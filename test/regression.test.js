import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import { rowsFromText, extractRows } from '../src/services/import.service.js';
import { sanitizeEvidence } from '../src/services/personalization.service.js';
import { planFollowUpStep } from '../src/services/followup.service.js';
import { requireWebhookSecret } from '../src/webhooks/email-events.js';
import { config } from '../src/config/env.js';

// ---------------------------------------------------------------------------
// Import: free-text fallback must never silently drop OCR'd contact data
// ---------------------------------------------------------------------------
test('rowsFromText extracts emails from free-text lines (OCR fallback)', () => {
  const text = [
    'Dr. Ayesha Khan',
    'ayesha.khan@example.edu',
    'Dr. Rahul Verma rahul.verma@example.org',
    'No contact info here — should be dropped',
    '',
  ].join('\n');

  const rows = rowsFromText(text);
  assert.equal(rows.length, 2);
  const byEmail = Object.fromEntries(rows.map(r => [r.email, r]));
  assert.equal(byEmail['ayesha.khan@example.edu'].name, 'Dr. Ayesha Khan');
  assert.equal(byEmail['rahul.verma@example.org'].name, 'Dr. Rahul Verma');
});

test('rowsFromText still parses delimited tables with headers', () => {
  const text = 'Name,Email,Organization,Role\nDr. Ayesha Khan,ayesha@example.edu,Example University,Professor';
  const rows = rowsFromText(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Dr. Ayesha Khan');
  assert.equal(rows[0].email, 'ayesha@example.edu');
  assert.equal(rows[0].organization, 'Example University');
});

// ---------------------------------------------------------------------------
// Follow-up state machine: every step must terminate (regression for the bug
// where Follow-up 2 records were never Closed because the due filter excluded
// them — the planner now marks the final step and the job closes the record).
// ---------------------------------------------------------------------------
test('planFollowUpStep maps each sequence step to a terminal outcome', () => {
  const step0 = planFollowUpStep(0);
  assert.equal(step0.nextStatus, 'Follow-up 1');
  assert.equal(step0.final, false);
  assert.equal(step0.intervalDays, config.outreach.followup2Days);

  const step1 = planFollowUpStep(1);
  assert.equal(step1.nextStatus, 'Follow-up 2');
  assert.equal(step1.final, true);
  assert.equal(step1.intervalDays, 0); // final step: no further scheduling

  const step2 = planFollowUpStep(2);
  assert.equal(step2.close, true);

  const step9 = planFollowUpStep(9);
  assert.equal(step9.close, true);
});

// ---------------------------------------------------------------------------
// Test PDF fixture: the 5-recipient dataset must flow through the app's own
// PDF parser into 5 distinct rows (regression for pdf-parse's bundled 2019
// pdf.js rejecting valid PDFs — extraction now uses pdfjs-dist).
// ---------------------------------------------------------------------------
test('the 5-recipient test PDF extracts to 5 rows with correct emails', async () => {
  const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'email_personalization_test_dataset.pdf');
  const buf = fs.readFileSync(fixture);
  const rows = await extractRows(buf, 'pdf');
  assert.equal(rows.length, 5);
  const emails = rows.map(r => r.email);
  for (const expected of ['sarah.chen@example.edu', 'marcus.webb@example.edu', 'priya.sharma@example.edu', 'elena.petrova@example.edu', 'james.okafor@example.edu']) {
    assert.ok(emails.includes(expected), `missing ${expected} in ${emails.join(', ')}`);
  }
  const byEmail = Object.fromEntries(rows.map(r => [r.email, r]));
  assert.match(byEmail['sarah.chen@example.edu'].name, /Sarah Chen/);
  assert.match(byEmail['james.okafor@example.edu'].name, /James Okafor/);
});

// ---------------------------------------------------------------------------
// Evidence integrity: AI-invented evidence ids must never be stored as real;
// only ids that resolve to the profile's actual enrichment rows are kept, and
// they are decorated with the real source/url/relationship.
// ---------------------------------------------------------------------------
test('sanitizeEvidence keeps only real enrichment facts of the profile', () => {
  const enrichments = [
    { id: 'a1a1a1a1-1111-4111-8111-111111111111', source_id: 'academic_db', source_url: 'https://example.org/doi', relationship: 'publication', fact_value: 'A paper on fairness', confidence: 0.9, verified: false },
    { id: 'b2b2b2b2-2222-4222-8222-222222222222', source_id: 'news_api', source_url: null, relationship: 'news', fact_value: 'A news mention', confidence: 0.7, verified: false },
  ];

  const cleaned = sanitizeEvidence([
    { id: 'a1a1a1a1-1111-4111-8111-111111111111', confidence: 0.88, usage: 'opening hook' },
    { id: 'publication-1', usage: 'credibility' }, // invented id — must be dropped
    { id: 'persona_profile' },                      // invented id — must be dropped
    { factId: 'b2b2b2b2-2222-4222-8222-222222222222', confidence: 0.7, usage: 'call to action' }, // factId alias accepted
  ], enrichments);

  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].id, 'a1a1a1a1-1111-4111-8111-111111111111');
  assert.equal(cleaned[0].source, 'academic_db');
  assert.equal(cleaned[0].relationship, 'publication');
  assert.equal(cleaned[0].confidence, 0.88); // model's confidence preserved
  assert.equal(cleaned[0].factValue, 'A paper on fairness');
  assert.equal(cleaned[1].id, 'b2b2b2b2-2222-4222-8222-222222222222');
  assert.equal(cleaned[1].usage, 'call to action');
  assert.deepEqual(sanitizeEvidence([{ id: 'nope' }], enrichments), []);
});

// ---------------------------------------------------------------------------
// Webhook auth: without the shared secret the endpoint must reject (regression
// for the bug where anyone could POST fake bounce/complaint events).
// ---------------------------------------------------------------------------
function mockRes() {
  let statusCode = 200;
  return {
    status(c) { statusCode = c; return this; },
    json() { return this; },
    get statusCode() { return statusCode; },
  };
}

test('requireWebhookSecret rejects missing, wrong, and query-param secrets', () => {
  const expected = config.security.webhookSecret;

  let called = false;
  requireWebhookSecret({ headers: {} }, mockRes(), () => { called = true; });
  assert.equal(called, false, 'missing secret must not pass');

  called = false;
  requireWebhookSecret({ headers: { 'x-webhook-secret': 'wrong-secret' } }, mockRes(), () => { called = true; });
  assert.equal(called, false, 'wrong secret must not pass');

  called = false;
  requireWebhookSecret({ headers: {}, query: { secret: ` ${expected} ` } }, mockRes(), () => { called = true; });
  assert.equal(called, false, 'padded secret must not pass (exact match required)');
});

test('requireWebhookSecret accepts the correct header and query secret', () => {
  const expected = config.security.webhookSecret;

  let called = false;
  requireWebhookSecret({ headers: { 'x-webhook-secret': expected }, query: {} }, mockRes(), () => { called = true; });
  assert.equal(called, true, 'correct header secret must pass');

  called = false;
  requireWebhookSecret({ headers: {}, query: { secret: expected } }, mockRes(), () => { called = true; });
  assert.equal(called, true, 'correct query secret must pass');
});
