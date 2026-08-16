# Roadmap

## Milestone 1: Foundation — DONE

Status: complete

- [x] Backend architecture: Express ESM, config/env, Supabase client, logging.
- [x] Core schema applied (11 tables + `outreach.personalization_id`) via `db/migrations/`.
- [x] Integrations: SMTP (Brevo), Gmail OAuth reply detection, OpenAI classification, Airtable sync.
- [x] Scheduled jobs: outreach, follow-ups, reply check, Airtable sync, stale-claim cleanup, import, personalization.
- [x] Unsubscribe endpoint (JWT) and webhook router.

## Milestone 2: Pipeline features — MOSTLY DONE

Status: in progress

- [x] Import pipeline: CSV/XLSX/PDF → contacts + profiles + outreach (idempotent).
- [x] Personalization: evidence-cited AI email generation → review queue.
- [x] Review workflow: approve / reject / edit-and-approve, bulk approve-and-send.
- [x] Outreach dispatch with rate limiting and SMTP auth halt; follow-up sequencing.
- [x] Reply detection + AI classification surfaced via API.
- [ ] **Real enrichment stage** — `enrichProfile()` is still a stub (returns `[]`); needs a real source or a manual-entry endpoint so the UI can trigger it.

## Milestone 3: Connected frontend — DONE

Status: complete

- [x] Read/data API routes (`/api/campaigns`, `/api/contacts`, `/api/outreach`, `/api/replies`, `/api/profiles`, `/api/dashboard/stats`).
- [x] React app: 13 pages wired to live API (dashboard, import, review, personalization, outreach, replies, campaigns, contacts, rate limiter, pipeline, settings, design system).
- [x] Express serves `frontend/dist` with SPA fallback; Vite dev proxy for local development.
- [x] End-to-end pipeline verified 20/20 through the real API.

## Milestone 4: Reliability & hardening — NOT STARTED

Status: pending

- [ ] Dedupe the duplicate "V1 College Outreach Initiative" campaigns in Supabase (29+ rows; careful with cascade deletes).
- [ ] Automated test suite (unit + API-level), beyond `test-verification.js` and `.e2e-pipeline.mjs`.
- [ ] Frontend code-splitting (bundle is ~655 kB) and fix Vite/CSS warnings.
- [ ] Production auth: document/verify `VITE_ADMIN_API_KEY` build flow; remove dev bypass in production env.
- [ ] `review` API contract: `decidedBy` expects a contact UUID — validate/document.

## Milestone 5: Release — NOT STARTED

Status: pending

- [ ] Review configuration and env docs (`src/env.example`).
- [ ] Remove debug/test code and demo data.
- [ ] Confirm deployment instructions (serve `frontend/dist` from the backend; document `npm start`).
- [ ] Obtain explicit approval before deploying.
