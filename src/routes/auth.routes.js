import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getUserProfile, invalidateProfileCache } from '../middleware/rbac.js';

export const authRouter = Router();

function getServiceClient() {
  return createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false },
  });
}

function getAnonClient() {
  if (!config.supabase.anonKey) return null;
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false },
  });
}

// -------------------------------------------------------
// POST /auth/signup  { email, password, name? }
// -------------------------------------------------------
authRouter.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm since there's no email server for confirmations
      user_metadata: name ? { name } : {},
    });

    if (error) {
      logger.warn('Signup failed:', { error: error.message, email });
      return res.status(400).json({ error: error.message });
    }

    // Sign in to get a session token
    const anon = getAnonClient();
    if (!anon) {
      return res.status(201).json({ message: 'Account created. Sign in.', userId: data.user.id });
    }

    const { data: session, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    if (signInErr) {
      return res.status(201).json({ message: 'Account created. Sign in.', userId: data.user.id });
    }

    logger.info(`User signed up: ${email}`);

    // Create RBAC profile row — first user gets owner, rest get college_operator
    try {
      const sb = getServiceClient();
      const { count } = await sb.from('user_profiles').select('id', { count: 'exact', head: true });
      const isFirstUser = !count || count === 0;
      const role = isFirstUser ? 'owner' : 'college_operator';
      const enabled_modules = isFirstUser ? ['outreach', 'job_search'] : ['outreach'];
      await sb.from('user_profiles').insert({
        user_id: data.user.id,
        role,
        enabled_modules,
        active_workspace: 'outreach',
      });
      logger.info(`Created user profile: ${email} (role=${role})`);
    } catch (profErr) {
      // Non-fatal: user can still log in, just won't have RBAC profile yet
      logger.warn('Failed to create user profile on signup:', { error: profErr.message });
    }

    res.status(201).json({
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name },
      session: session.session,
    });
  } catch (err) {
    logger.error('Signup error:', { error: err.message });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -------------------------------------------------------
// POST /auth/login  { email, password }
// -------------------------------------------------------
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const anon = getAnonClient();
  if (!anon) {
    return res.status(500).json({ error: 'Auth not configured on server.' });
  }

  try {
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error) {
      logger.warn('Login failed:', { error: error.message, email });
      return res.status(401).json({ error: error.message });
    }

    logger.info(`User logged in: ${email}`);
    res.json({
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name },
      session: data.session,
    });
  } catch (err) {
    logger.error('Login error:', { error: err.message });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -------------------------------------------------------
// GET /auth/me  (requires Authorization: Bearer <token>)
// -------------------------------------------------------
authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const token = authHeader.slice(7);
  const anon = getAnonClient();
  if (!anon) {
    return res.status(500).json({ error: 'Auth not configured.' });
  }

  try {
    const { data: { user }, error } = await anon.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    res.json({
      user: { id: user.id, email: user.email, name: user.user_metadata?.name },
    });
  } catch (err) {
    logger.error('Auth/me error:', { error: err.message });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -------------------------------------------------------
// GET /auth/profile  (RBAC profile: role, modules, workspace)
// -------------------------------------------------------
authRouter.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const token = authHeader.slice(7);
  const anon = getAnonClient();
  if (!anon) {
    return res.status(500).json({ error: 'Auth not configured.' });
  }

  try {
    const { data: { user }, error } = await anon.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const profile = await getUserProfile(user.id);
    if (!profile) {
      // No profile yet — return defaults
      return res.json({
        success: true,
        profile: {
          role: 'college_operator',
          enabled_modules: ['outreach'],
          active_workspace: 'outreach',
        },
      });
    }

    res.json({ success: true, profile });
  } catch (err) {
    logger.error('Auth/profile error:', { error: err.message });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -------------------------------------------------------
// PUT /auth/profile/workspace  { workspace: 'outreach' | 'job_search' }
// -------------------------------------------------------
authRouter.put('/profile/workspace', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const token = authHeader.slice(7);
  const anon = getAnonClient();
  if (!anon) {
    return res.status(500).json({ error: 'Auth not configured.' });
  }

  try {
    const { data: { user }, error } = await anon.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { workspace } = req.body;
    if (!workspace || !['outreach', 'job_search'].includes(workspace)) {
      return res.status(400).json({ error: 'Invalid workspace. Must be "outreach" or "job_search".' });
    }

    // Check if user has the module for the requested workspace
    const profile = await getUserProfile(user.id);
    if (!profile) {
      return res.status(403).json({ error: 'No user profile found.' });
    }

    const moduleForWorkspace = workspace; // workspace name === module name
    if (profile.role !== 'owner' && !profile.enabled_modules.includes(moduleForWorkspace)) {
      return res.status(403).json({ error: `Your account does not have access to the "${workspace}" workspace.` });
    }

    // Update active_workspace
    const sb = getServiceClient();
    const { error: updateErr } = await sb
      .from('user_profiles')
      .update({ active_workspace: workspace })
      .eq('user_id', user.id);

    if (updateErr) throw updateErr;

    invalidateProfileCache(user.id);
    res.json({ success: true, active_workspace: workspace });
  } catch (err) {
    logger.error('Workspace switch error:', { error: err.message });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -------------------------------------------------------
// POST /auth/logout  (client-side clears tokens, this is a formality)
// -------------------------------------------------------
authRouter.post('/logout', async (req, res) => {
  res.json({ message: 'Logged out.' });
});
