import { test, before } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// API-level tests — require a running backend (default http://localhost:5000).
// They run in dev auth mode via x-bypass-auth: true. If the backend is down,
// the suite is skipped so `npm test` stays green in CI-less environments.
// ---------------------------------------------------------------------------
const BASE = process.env.API_BASE_URL || 'http://localhost:5000';
let up = false;

async function api(path) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'x-bypass-auth': 'true' },
  });
  if (!res.ok) throw new Error(`GET /api${path} -> ${res.status}`);
  return res.json();
}

before(async () => {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    up = res.ok;
  } catch {
    up = false;
  }
});

test('backend is reachable (skip suite otherwise)', (t) => {
  if (!up) {
    t.skip(`backend not running at ${BASE} — run npm start first`);
    return;
  }
  assert.ok(up);
});

test('GET /api/dashboard/stats returns expected shape', async (t) => {
  if (!up) return t.skip('backend down');
  const { success, stats } = await api('/dashboard/stats');
  assert.equal(success, true);
  assert.equal(typeof stats.contacts, 'number');
  assert.equal(typeof stats.campaigns, 'number');
  assert.ok(stats.outreach);
  assert.equal(typeof stats.outreach.sent, 'number');
  assert.ok(stats.config);
  assert.equal(typeof stats.config.dailySendLimit, 'number');
});

test('GET /api/campaigns returns campaign list with counts', async (t) => {
  if (!up) return t.skip('backend down');
  const { success, campaigns } = await api('/campaigns');
  assert.equal(success, true);
  assert.ok(Array.isArray(campaigns));
  assert.ok(campaigns.length >= 1, 'expected at least one campaign');
  const c = campaigns[0];
  assert.ok(c.id);
  assert.ok(c.name);
  assert.equal(typeof c.total, 'number');
});

test('GET /api/contacts returns rows with id + email', async (t) => {
  if (!up) return t.skip('backend down');
  const { success, contacts } = await api('/contacts?limit=3');
  assert.equal(success, true);
  assert.ok(Array.isArray(contacts));
  if (contacts.length > 0) {
    assert.ok(contacts[0].id);
    assert.ok(contacts[0].email);
  }
});

test('GET /api/profiles includes enrichmentCount', async (t) => {
  if (!up) return t.skip('backend down');
  const { success, profiles } = await api('/profiles?limit=5');
  assert.equal(success, true);
  assert.ok(Array.isArray(profiles));
  if (profiles.length > 0) {
    assert.equal(typeof profiles[0].enrichmentCount, 'number');
  }
});

test('GET /api/replies returns an array', async (t) => {
  if (!up) return t.skip('backend down');
  const { success, replies } = await api('/replies?limit=5');
  assert.equal(success, true);
  assert.ok(Array.isArray(replies));
});
