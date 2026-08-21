import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mapWithConcurrency } from '../src/utils/pool.js';
import { extractEmailAddress, extractPlainTextBody } from '../src/utils/email-parser.js';
import { normalizeRows } from '../src/services/import.service.js';
import { buildPrompt, buildEvidenceTrace, submitReviewDecision } from '../src/services/personalization.service.js';

// ---------------------------------------------------------------------------
// utils/pool.js — bounded concurrency
// ---------------------------------------------------------------------------
test('mapWithConcurrency preserves result order', async () => {
  const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10);
  assert.deepEqual(out, [10, 20, 30, 40]);
});

test('mapWithConcurrency respects the concurrency limit', async () => {
  let inFlight = 0;
  let peak = 0;
  const items = [1, 2, 3, 4, 5, 6];
  await mapWithConcurrency(items, 3, async () => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise(r => setTimeout(r, 20));
    inFlight -= 1;
  });
  assert.ok(peak <= 3, `peak concurrency was ${peak}, expected <= 3`);
  assert.ok(peak >= 2, `expected some parallelism, got peak ${peak}`);
});

test('mapWithConcurrency handles a single item and empty list', async () => {
  assert.deepEqual(await mapWithConcurrency([42], 5, async x => x), [42]);
  assert.deepEqual(await mapWithConcurrency([], 5, async () => 1), []);
});

test('mapWithConcurrency propagates errors', async () => {
  await assert.rejects(
    mapWithConcurrency([1, 2], 2, async () => { throw new Error('boom'); }),
    /boom/
  );
});

// ---------------------------------------------------------------------------
// utils/email-parser.js
// ---------------------------------------------------------------------------
test('extractEmailAddress handles angle-bracket headers and bare emails', () => {
  assert.equal(extractEmailAddress('Dr. Sarah Rao <sarah.rao@xyz.edu>'), 'sarah.rao@xyz.edu');
  assert.equal(extractEmailAddress('SARAH.RAO@XYZ.EDU'), 'sarah.rao@xyz.edu');
  assert.equal(extractEmailAddress(''), '');
});

test('extractPlainTextBody decodes base64 text/plain and recurses into parts', () => {
  const plain = { mimeType: 'text/plain', body: { data: Buffer.from('Hello there').toString('base64') } };
  assert.equal(extractPlainTextBody(plain), 'Hello there');

  const multipart = {
    mimeType: 'multipart/alternative',
    parts: [
      { mimeType: 'text/html', body: { data: Buffer.from('<p>hi</p>').toString('base64') } },
      { mimeType: 'text/plain', body: { data: Buffer.from('plain body').toString('base64') } },
    ],
  };
  assert.equal(extractPlainTextBody(multipart), 'plain body');

  const nested = {
    mimeType: 'multipart/mixed',
    parts: [
      { mimeType: 'multipart/alternative', parts: [{ mimeType: 'text/plain', body: { data: Buffer.from('deep').toString('base64') } }] },
    ],
  };
  assert.equal(extractPlainTextBody(nested), 'deep');
  assert.equal(extractPlainTextBody(null), '');
});

// ---------------------------------------------------------------------------
// services/import.service.js — row normalization
// ---------------------------------------------------------------------------
test('normalizeRows maps column aliases and drops rows without name/email', () => {
  const rows = normalizeRows([
    { Name: 'Dr. Ayesha Khan', 'Email Address': 'ayesha@example.edu', Institution: 'Example University', Title: 'Professor' },
    { 'Full Name': 'Rahul Verma', Mail: 'rahul@example.org', Org: 'Example Labs', Designation: 'Researcher' },
    { onlyName: 'No email here' },
    { Email: 'not-an-email' },
  ]);
  // normalizeRows keeps any row with a name OR email value (email format
  // validation happens later in processRows); rows with neither are dropped.
  assert.equal(rows.length, 3);
  assert.equal(rows[0].name, 'Dr. Ayesha Khan');
  assert.equal(rows[0].email, 'ayesha@example.edu');
  assert.equal(rows[0].organization, 'Example University');
  assert.equal(rows[0].role, 'Professor');
  assert.equal(rows[1].email, 'rahul@example.org');
  assert.equal(rows[2].email, 'not-an-email');
});

// ---------------------------------------------------------------------------
// services/personalization.service.js — prompt + evidence trace
// ---------------------------------------------------------------------------
test('buildPrompt includes profile fields, facts, and campaign context', () => {
  const prompt = buildPrompt(
    { full_name: 'Dr. Ayesha Khan', organization: 'Example University', role: 'Professor' },
    [
      { relationship: 'publication', fact_value: 'AI ethics paper 2024', source_id: 'academic_db', confidence: 0.92, verified: true },
      { relationship: 'bio', fact_value: 'Leads NLP lab', source_id: 'manual', confidence: null, verified: false },
    ],
    { name: 'College Outreach Initiative', description: 'Default campaign' },
    { fromName: 'Shahid', fromEmail: 'shahid@gmail.com' }
  );

  assert.match(prompt, /Dr\. Ayesha Khan/);
  assert.match(prompt, /Example University/);
  assert.match(prompt, /AI ethics paper 2024/);
  assert.match(prompt, /academic_db/);
  assert.match(prompt, /College Outreach Initiative/);
  assert.match(prompt, /Shahid/);
  // null confidence must not crash and should be rendered as 0%
  assert.match(prompt, /0%/);
});

test('buildEvidenceTrace normalizes evidence fields', () => {
  const trace = buildEvidenceTrace([
    { id: 'a1', source: 'academic_db', confidence: 0.9, usage: 'opening hook' },
    { factId: 'b2', source: 'news', confidence: 0.7 },
  ]);
  assert.equal(trace.length, 2);
  assert.equal(trace[0].factId, 'a1');
  assert.equal(trace[0].usage, 'opening hook');
  assert.equal(trace[1].factId, 'b2');
  assert.deepEqual(buildEvidenceTrace(null), []);
  assert.deepEqual(buildEvidenceTrace(undefined), []);
});

// ---------------------------------------------------------------------------
// services/personalization.service.js — decidedBy contract
// ---------------------------------------------------------------------------
test('submitReviewDecision rejects a non-UUID decidedBy', async () => {
  // decidedBy maps to review_decisions.decided_by (FK to contacts(id)); anything
  // that is not a UUID should fail fast with a clear error, not a DB 500.
  await assert.rejects(
    submitReviewDecision('00000000-0000-0000-0000-000000000000', 'approved', { decidedBy: 'shahid' }),
    /Invalid decidedBy 'shahid'/
  );
  await assert.rejects(
    submitReviewDecision('00000000-0000-0000-0000-000000000000', 'approved', { decidedBy: 'not-a-uuid' }),
    /Invalid decidedBy/
  );
});
