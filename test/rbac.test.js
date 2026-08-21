import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// RBAC middleware unit tests
// ---------------------------------------------------------------------------

// Helper: create a mock Express req/res/next
// getStatus() and getBody() are on the returned res object.
function mockReqRes(user = null) {
  const req = { user, userProfile: undefined };
  const state = { status: null, body: null };
  const res = {
    status(code) { state.status = code; return this; },
    json(body) { state.body = body; },
    getStatus: () => state.status,
    getBody: () => state.body,
  };
  const next = () => { next.called = true; };
  next.called = false;
  return { req, res, next };
}

let rbac;

test('load RBAC module', async () => {
  rbac = await import('../src/middleware/rbac.js');
  assert.ok(rbac.requireModule);
  assert.ok(rbac.getUserProfile);
  assert.ok(rbac.attachUserProfile);
  assert.ok(rbac.invalidateProfileCache);
});

// --- getUserProfile ---

describe('getUserProfile', () => {
  test('is a function', () => {
    assert.equal(typeof rbac.getUserProfile, 'function');
  });

  test('returns a promise', () => {
    const result = rbac.getUserProfile('nonexistent-id');
    assert.ok(result instanceof Promise);
  });
});

// --- requireModule ---

describe('requireModule', () => {
  test('is a factory function that returns middleware', () => {
    const guard = rbac.requireModule('outreach');
    assert.equal(typeof guard, 'function');
  });

  test('allows request when user has no user object (bypass)', async () => {
    const guard = rbac.requireModule('outreach');
    const { req, res, next } = mockReqRes(null);
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });

  test('allows dev-bypass user through any module', async () => {
    const guard = rbac.requireModule('job_search');
    const { req, res, next } = mockReqRes({ id: 'dev-bypass' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });

  test('allows api-key user through any module', async () => {
    const guard = rbac.requireModule('outreach');
    const { req, res, next } = mockReqRes({ id: 'api-key' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });

  test('dev-bypass works for job_search module', async () => {
    const guard = rbac.requireModule('job_search');
    const { req, res, next } = mockReqRes({ id: 'dev-bypass' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });

  test('dev-bypass works for outreach module', async () => {
    const guard = rbac.requireModule('outreach');
    const { req, res, next } = mockReqRes({ id: 'dev-bypass' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });
});

// --- attachUserProfile ---

describe('attachUserProfile', () => {
  test('attaches owner profile for dev-bypass user', async () => {
    const { req, res, next } = mockReqRes({ id: 'dev-bypass' });
    await rbac.attachUserProfile(req, res, next);
    assert.equal(next.called, true);
    assert.deepEqual(req.userProfile, {
      role: 'owner',
      enabled_modules: ['outreach', 'job_search'],
      active_workspace: 'outreach',
    });
  });

  test('attaches owner profile for api-key user', async () => {
    const { req, res, next } = mockReqRes({ id: 'api-key' });
    await rbac.attachUserProfile(req, res, next);
    assert.equal(next.called, true);
    assert.equal(req.userProfile.role, 'owner');
    assert.ok(req.userProfile.enabled_modules.includes('outreach'));
    assert.ok(req.userProfile.enabled_modules.includes('job_search'));
  });

  test('attaches owner profile when no user (null user treated as bypass)', async () => {
    const { req, res, next } = mockReqRes(null);
    await rbac.attachUserProfile(req, res, next);
    assert.equal(next.called, true);
    assert.equal(req.userProfile.role, 'owner');
    assert.ok(req.userProfile.enabled_modules.includes('outreach'));
    assert.ok(req.userProfile.enabled_modules.includes('job_search'));
  });
});

// --- invalidateProfileCache ---

describe('invalidateProfileCache', () => {
  test('is a callable function', () => {
    assert.equal(typeof rbac.invalidateProfileCache, 'function');
    rbac.invalidateProfileCache('nonexistent-user-id');
  });

  test('can be called multiple times without error', () => {
    rbac.invalidateProfileCache('user-1');
    rbac.invalidateProfileCache('user-2');
    rbac.invalidateProfileCache('');
  });
});

// --- requireModule edge cases ---

describe('requireModule edge cases', () => {
  test('different module names return different middleware instances', () => {
    const a = rbac.requireModule('outreach');
    const b = rbac.requireModule('job_search');
    assert.notEqual(a, b);
  });

  test('module guard returns 403 for unknown user with valid req.user', async () => {
    const guard = rbac.requireModule('job_search');
    const { req, res, next } = mockReqRes({ id: '00000000-0000-0000-0000-000000000000' });
    await guard(req, res, next);
    assert.equal(res.getStatus(), 403);
    assert.equal(res.getBody().error, 'Forbidden');
  });

  test('module guard allows outreach for user with no profile (safe default)', async () => {
    const guard = rbac.requireModule('outreach');
    const { req, res, next } = mockReqRes({ id: '00000000-0000-0000-0000-000000000000' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });

  test('403 message includes module name', async () => {
    const guard = rbac.requireModule('job_search');
    const { req, res, next } = mockReqRes({ id: '00000000-0000-0000-0000-000000000000' });
    await guard(req, res, next);
    assert.match(res.getBody().message, /job_search/);
  });

  test('403 for outreach module when user has no profile is NOT triggered (safe default)', async () => {
    const guard = rbac.requireModule('outreach');
    const { req, res, next } = mockReqRes({ id: '00000000-0000-0000-0000-000000000000' });
    await guard(req, res, next);
    assert.equal(next.called, true);
    assert.equal(res.getStatus(), null);
  });
});
