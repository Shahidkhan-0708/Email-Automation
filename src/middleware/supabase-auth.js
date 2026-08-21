import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let supabaseAuth = null;

function getSupabaseAuth() {
  if (supabaseAuth) return supabaseAuth;
  if (!config.supabase.url || !config.supabase.anonKey) {
    logger.warn('Supabase anon key missing — JWT verification disabled.');
    return null;
  }
  supabaseAuth = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false },
  });
  return supabaseAuth;
}

/**
 * Middleware: verify a Supabase JWT from the Authorization header.
 * Attaches req.user = { id, email, role } on success.
 *
 * Falls back to x-api-key / x-bypass-auth for backward compatibility
 * (the V2 console bakes in VITE_ADMIN_API_KEY and sends x-api-key).
 */
export async function requireAuth(req, res, next) {
  // --- backward-compat: API key bypass (V2 console, cron triggers) ---
  if (config.env === 'development' && req.headers['x-bypass-auth'] === 'true') {
    req.user = { id: 'dev-bypass', email: 'dev@local', role: 'admin' };
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['apikey'];
  if (apiKey && apiKey === config.security.adminApiKey) {
    req.user = { id: 'api-key', email: 'api@key', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.slice(7);
  const auth = getSupabaseAuth();

  if (!auth) {
    // No anon key configured — fall back to API-key-only mode
    return res.status(401).json({ error: 'Unauthorized', message: 'Auth not configured on server.' });
  }

  try {
    const { data: { user }, error } = await auth.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
    }
    req.user = { id: user.id, email: user.email, role: user.role || 'authenticated' };
    next();
  } catch (err) {
    logger.error('JWT verification failed:', { error: err.message });
    return res.status(401).json({ error: 'Unauthorized', message: 'Token verification failed.' });
  }
}
