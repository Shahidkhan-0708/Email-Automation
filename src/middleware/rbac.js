import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';

/**
 * In-memory cache for user profiles (role + modules).
 * TTL 5 min — short enough that permission changes propagate quickly,
 * long enough to avoid a DB hit on every single API request.
 */
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const profileCache = new Map(); // key: userId, value: { profile, expiresAt }

/**
 * Fetch a user's RBAC profile from the `user_profiles` table.
 * Returns { role, enabled_modules, active_workspace } or null if no row.
 */
export async function getUserProfile(userId) {
  const cached = profileCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.profile;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, enabled_modules, active_workspace')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('Failed to fetch user profile:', { userId, error: error.message });
    return null;
  }

  if (data) {
    profileCache.set(userId, { profile: data, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS });
  }
  return data;
}

/**
 * Invalidate cached profile (call after role/module changes).
 */
export function invalidateProfileCache(userId) {
  profileCache.delete(userId);
}

/**
 * Middleware factory: requireModule('outreach') returns middleware that
 * rejects the request with 403 if the authenticated user does not have
 * the specified module in their enabled_modules.
 *
 * Must be placed AFTER requireAuth (which populates req.user).
 *
 * The owner role bypasses all module checks (owners see everything).
 */
export function requireModule(moduleName) {
  return async function moduleGuard(req, res, next) {
    // API-key / dev-bypass users are treated as admin (full access)
    if (!req.user || req.user.id === 'dev-bypass' || req.user.id === 'api-key') {
      return next();
    }

    const profile = await getUserProfile(req.user.id);

    if (!profile) {
      // No profile row — first login or migration not applied yet.
      // Default: allow outreach only (safe fallback for existing users).
      if (moduleName === 'outreach') return next();
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your account does not have access to the "${moduleName}" module.`,
      });
    }

    // Owners see everything
    if (profile.role === 'owner') return next();

    // Check enabled_modules
    if (!profile.enabled_modules || !profile.enabled_modules.includes(moduleName)) {
      logger.warn(`RBAC denied: user ${req.user.id} (role=${profile.role}) attempted access to module "${moduleName}"`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your account does not have access to the "${moduleName}" module.`,
      });
    }

    next();
  };
}

/**
 * Middleware: attach user profile to req.userProfile for downstream use.
 * Placed after requireAuth. Does NOT reject — just enriches.
 */
export async function attachUserProfile(req, _res, next) {
  if (!req.user || req.user.id === 'dev-bypass' || req.user.id === 'api-key') {
    req.userProfile = { role: 'owner', enabled_modules: ['outreach', 'job_search'], active_workspace: 'outreach' };
    return next();
  }

  const profile = await getUserProfile(req.user.id);
  if (profile) {
    req.userProfile = profile;
  } else {
    // Default for users without a profile row yet
    req.userProfile = { role: 'college_operator', enabled_modules: ['outreach'], active_workspace: 'outreach' };
  }
  next();
}
