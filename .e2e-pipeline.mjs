// End-to-end pipeline test — runs the full flow through the real HTTP API
// exactly as the React frontend calls it. Requires the backend on :5001.
import { getSupabaseClient } from './src/db/client.js';

const BASE = 'http://localhost:5001';
const H = { 'x-bypass-auth': 'true', 'Content-Type': 'application/json' };

let passed = 0;
let failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passed += 1; console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ''}`); }
  else { failed += 1; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`); }
};

async function api(path, opts = {}) {
  // For multipart uploads the browser sets Content-Type itself (with boundary);
  // forcing application/json here would make express.json() choke on it.
  const isForm = opts.body instanceof FormData;
  const headers = isForm ? { 'x-bypass-auth': 'true' } : H;
  const url = `${BASE}${path.startsWith('/api') ? path : '/api' + path}`;
  const res = await fetch(url, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}: ${body.error || res.statusText}`);
  return body;
}

const run = async () => {
  console.log('\n================ E2E PIPELINE TEST ================\n');

  // ---- 1. Import a CSV of leads -------------------------------------------
  console.log('STAGE 1 — File Import (CSV)');
  const csv = 'Name,Email,Organization,Role\n' +
    'Dr. E2E Alpha,pipeline.alpha@example.com,Alpha University,Professor\n' +
    'Dr. E2E Beta,pipeline.beta@example.com,Beta Institute,Dean\n';
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'e2e-leads.csv');
  const queued = await api('/import', { method: 'POST', body: form });
  ok('CSV queued', !!queued.jobId, `jobId ${queued.jobId}`);
  const job = await api('/import/process', { method: 'POST', body: JSON.stringify({ jobId: queued.jobId }) });
  ok('Job processed (2 created or updated — idempotent)',
    job.job?.status === 'completed' && (job.job?.created_records + job.job?.updated_records) === 2,
    `created=${job.job?.created_records}, updated=${job.job?.updated_records}, total=${job.job?.total_records}`);
  const imported = await api('/import/status/' + queued.jobId);
  ok('Job status = completed', imported.job?.status === 'completed');
  ok('No job errors', !imported.job?.error_message);

  // ---- 2. Contacts & profiles created -------------------------------------
  console.log('\nSTAGE 2 — Contacts & Profiles');
  const contacts = (await api('/contacts?limit=200')).contacts.filter(c => c.email.startsWith('pipeline.'));
  ok('2 contacts created', contacts.length === 2, contacts.map(c => c.name).join(', '));
  const profiles = (await api('/profiles?limit=200')).profiles.filter(p => contacts.some(c => c.id === p.contactId));
  ok('2 profiles created', profiles.length === 2);
  const outreachAll = (await api('/outreach?limit=200')).outreach;
  const enrolled = outreachAll.filter(o => contacts.some(c => c.id === o.contact_id));
  ok('Both contacts enrolled in outreach', enrolled.length === 2, `statuses: ${enrolled.map(o => o.status).join(', ')}`);

  // ---- 3. Enrichment (stubbed stage — seed facts the AI will cite) ---------
  console.log('\nSTAGE 3 — Enrichment Facts (seeded, source: academic_db)');
  const sb = getSupabaseClient();
  for (const p of profiles) {
    const { error } = await sb.from('enrichment_results').insert({
      profile_id: p.id,
      source_id: 'academic_db',
      relationship: 'publication',
      fact_value: `Fault-tolerant ${p.fullName} research on distributed systems (2026)`,
      confidence: 0.92,
      verified: true,
    });
    if (error) throw new Error(`enrichment insert failed: ${error.message}`);
  }
  const enriched = (await api('/profiles?limit=200')).profiles.filter(p => profiles.some(x => x.id === p.id));
  ok('Profiles have enrichment facts', enriched.every(p => p.enrichmentCount >= 1), enriched.map(p => `${p.enrichmentCount} facts`).join(', '));

  // ---- 4. AI personalization ----------------------------------------------
  console.log('\nSTAGE 4 — AI Personalization Generation (real OpenAI call)');
  const genIds = [];
  for (const p of enriched) {
    const gen = await api(`/personalization/generate/${p.id}`, { method: 'POST', body: JSON.stringify({}) });
    genIds.push(gen.personalization?.id);
    ok(`Generated for ${p.fullName}`, !!gen.personalization?.subject, `status=${gen.personalization?.status}`);
  }

  // ---- 5. Review queue -----------------------------------------------------
  console.log('\nSTAGE 5 — Human Review Queue');
  const queue = (await api('/review/queue?limit=50')).queue;
  const mine = queue.filter(q => genIds.includes(q.id));
  ok('2 items in review queue', mine.length === 2, mine.map(q => q.status).join(', '));
  const first = mine[0];
  ok('Subject present', !!first.subject, first.subject?.slice(0, 60) + '…');
  ok('Body present', (first.body || '').length > 50, `${first.body?.length} chars`);
  ok('Evidence attached', Array.isArray(first.evidence_used) && first.evidence_used.length > 0, `${first.evidence_used?.length || 0} facts cited`);

  // ---- 6. Approve ----------------------------------------------------------
  console.log('\nSTAGE 6 — Approval');
  for (const p of mine) {
    const r = await api(`/review/${p.id}`, { method: 'POST', body: JSON.stringify({ decision: 'approved' }) });
    ok(`Approved ${p.profiles?.full_name || p.id}`, r.personalization?.status === 'approved', `status=${r.personalization?.status}`);
  }
  const contactsAfter = (await api('/contacts?limit=200')).contacts.filter(c => c.email.startsWith('pipeline.'));
  ok('Contacts marked approved for sending', contactsAfter.every(c => c.personalizationApproved === true));

  // ---- 7. Dispatch (real SMTP send) ---------------------------------------
  console.log('\nSTAGE 7 — Outreach Dispatch (real SMTP via Brevo)');
  const send = await api('/trigger/outreach', { method: 'POST' });
  ok('Outreach batch ran', send.success === true, `claimed=${send.result?.claimed}, sent=${send.result?.sent}, failed=${send.result?.failed}`);
  const afterSend = (await api('/outreach?limit=200')).outreach.filter(o => contacts.some(c => c.id === o.contact_id));
  const sentRows = afterSend.filter(o => ['Sent', 'Delivered'].includes(o.status));
  const errRows = afterSend.filter(o => ['Error', 'Bounced'].includes(o.status));
  ok('Emails dispatched', sentRows.length > 0, `statuses: ${afterSend.map(o => o.status).join(', ')}`);

  // ---- 8. Reply check ------------------------------------------------------
  console.log('\nSTAGE 8 — Inbound Reply Check (Gmail)');
  const replies = await api('/trigger/replies', { method: 'POST' });
  ok('Reply check ran', replies.success === true, `fetched=${replies.result?.fetched}, processed=${replies.result?.processed}`);

  console.log(`\n================ RESULT: ${passed} passed, ${failed} failed ================\n`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(err => {
  console.error('\n❌ E2E TEST ABORTED:', err.message);
  process.exit(1);
});
