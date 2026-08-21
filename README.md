# College Outreach Automation System V2

AI-assisted college outreach platform: import academic lead files (CSV/XLSX/PDF/images), enrich them with research context (OpenAlex / Wikipedia / DuckDuckGo), generate evidence-cited personalized emails for human review, dispatch through a rate-limited SMTP pipeline, and track AI-classified replies — all controlled from a React dashboard.

**Stack**: Node.js (Express, ESM) · Supabase (Postgres, source of truth) · React 19 + Vite + TypeScript + Tailwind v4 · Airtable (dashboard sync) · SMTP via Nodemailer · Gmail OAuth (reply detection) · OpenAI (personalization + classification) · `node-cron` scheduled jobs.

---

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | Express backend: routes, services, jobs, integrations, db access |
| `f/` | **Primary frontend** — "Outreach Console V2" React app (built to `f/dist`) |
| `frontend/` | Earlier React app — fallback only when `f/dist` is absent |
| `public/` | Legacy static dashboard — last-resort fallback |
| `db/migrations/` | SQL migrations, applied via the Supabase SQL editor |
| `test/` | `node:test` unit + API tests (`npm test`) |
| `.freebuff/` | Project state (goal, roadmap, decisions, session log) |

The backend serves `f/dist` first, then `frontend/dist`, then `public/`, with an SPA fallback to `index.html` for client-side routes.

---

## Prerequisites

- **Node.js 20+** (LTS recommended) and npm.
- A **Supabase** project (database), with the migrations applied (see below).
- An **SMTP** account (e.g. Brevo) for sending.
- An **OpenAI** API key.
- Optional: Gmail OAuth credentials (reply detection), an Airtable token + base (dashboard sync).

---

## Local development

```bash
npm install                 # backend deps (project root)

# 1. Configure environment
cp .env.example .env        # then fill in real values (see .env.example)

# 2. Apply DB migrations (one-time, per environment)
#    Open the Supabase dashboard → SQL Editor, run each file in db/migrations/
#    in filename order (0001 → 0006). There is no psql access in this project.

# 3a. Frontend dev server (hot reload) — terminal A
cd f && npm install && npm run dev     # Vite on :5174, proxies /api → :5000

# 3b. Backend — terminal B (project root)
npm run dev                            # node --watch on :5000
```

Open `http://localhost:5000/dashboard` (served build) or `http://localhost:5174` (Vite). In dev, the app authenticates API calls with `x-bypass-auth: true` — the backend only honors it when `NODE_ENV=development`.

---

## Production deployment

Provider-agnostic — works on any host that can run Node 20+ (VPS, Render, Railway, Fly.io, a Docker container of your own, etc.).

### 1. Provision external services

- **Supabase**: create a project; run `db/migrations/*.sql` in the SQL Editor (filename order). Grab the project URL and a **service-role** key (server-side secret — never put it in the browser bundle).
- **SMTP**: create an account (e.g. Brevo) and note host/port/credentials.
- **OpenAI**: create an API key.
- Optional: Gmail OAuth (see "Gmail reply detection" below), Airtable token/base.

### 2. Install & configure

```bash
git clone <repo> && cd college-outreach-automation
npm install

cp .env.example .env
# edit .env — set NODE_ENV=production and every [REQUIRED] variable,
# plus strong random values for ADMIN_API_KEY / UNSUBSCRIBE_JWT_SECRET /
# WEBHOOK_SECRET (e.g. `openssl rand -hex 32`)
```

> The app deliberately does **not** fail fast on missing env vars — a misconfigured server starts and only breaks at runtime (jobs error, sends fail). Run through the checklist in `.env.example` before starting.

### 3. Apply DB migrations

In the **Supabase SQL Editor**, run each file from `db/migrations/` in order (`20240101000100_...` → `20240101000600_...`). Repeat per environment (staging/prod). The schema is not applied automatically on boot.

### 4. Build the frontend

```bash
cd f && npm install
# Production builds must embed the API key so the app sends x-api-key
VITE_ADMIN_API_KEY=your_secure_admin_api_key npm run build   # POSIX
# Windows: set VITE_ADMIN_API_KEY=your_secure_admin_api_key && npm run build
cd ..
```

`VITE_ADMIN_API_KEY` must match `ADMIN_API_KEY` in `.env`. Output lands in `f/dist`, which Express serves at `/`.

### 5. Run the server

```bash
npm start        # = node src/server.js → listens on 0.0.0.0:PORT (default 5000)
```

Run it under a process manager (e.g. `pm2 start src/server.js --name outreach`, or a systemd unit) and put a reverse proxy in front for TLS (the app has no HTTPS termination). `GMAIL_REDIRECT_URI` and `BASE_URL` must use the **public** HTTPS URL.

### 6. Verify

- `GET /health` → `{"status":"ok",...}` with the resolved config.
- `https://app.example.com/dashboard` loads the V2 console and shows live data.
- Trigger jobs on demand to smoke-test: `POST /api/trigger/outreach` (and `/followups`, `/replies`, `/airtable-sync`) with `x-api-key: <ADMIN_API_KEY>`.
- Watch `logs/combined.log` and `logs/error.log` for job errors.

---

## Environment variables

See `.env.example` for the full annotated template. Required in production:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` — also disables `x-bypass-auth` |
| `PORT` / `BASE_URL` | yes | public base URL (no trailing slash) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | yes | service-role key, server-side only |
| `ADMIN_API_KEY` | yes | all `/api/*` calls must send it as `x-api-key` |
| `UNSUBSCRIBE_JWT_SECRET`, `WEBHOOK_SECRET` | yes | random 64-hex values |
| `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | yes | to send email |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | yes | personalization + reply classification |
| `GMAIL_CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN` | no | reply detection only |
| `AIRTABLE_TOKEN/BASE_ID/TABLE_NAME` | no | dashboard sync only |
| `DAILY_SEND_LIMIT`, `FOLLOWUP_1_DAYS`, `FOLLOWUP_2_DAYS`, `SEND_DELAY_MS` | no | outreach rules |
| `SMTP_CONCURRENCY`, `PERSONALIZATION_CONCURRENCY` | no | in-flight send / generation caps |
| `VITE_ADMIN_API_KEY` | build-time | embedded in `f/` build; must equal `ADMIN_API_KEY` |

---

## Scheduled jobs (node-cron, start automatically with the server)

| Job | Schedule | What it does |
| --- | --- | --- |
| Import | every 2 min | processes queued `import_jobs` (CSV/XLSX/PDF/OCR) |
| Personalization | every 5 min | enriches profiles without facts, then generates AI drafts into review queue |
| Outreach | daily 09:00 | dispatches approved outreach up to `DAILY_SEND_LIMIT`, honoring `SMTP_CONCURRENCY` |
| Follow-ups | daily 10:00 | sequences follow-up 1/2 based on `FOLLOWUP_*_DAYS` |
| Reply check | every 15 min | fetches Gmail replies, AI-classifies, surfaces in UI |
| Airtable sync | every 30 min | pushes Supabase rows to the Airtable dashboard base |
| Stale-claim cleanup | every 5 min | releases abandoned outreach claims |

All jobs can also be triggered manually via `POST /api/trigger/<job>` (secured by `x-api-key`).

---

## Security checklist (before going live)

- [ ] `NODE_ENV=production` — this is what disables the `x-bypass-auth` dev bypass.
- [ ] Strong unique values for `ADMIN_API_KEY`, `UNSUBSCRIBE_JWT_SECRET`, `WEBHOOK_SECRET`.
- [ ] `SUPABASE_SERVICE_KEY` never appears in the frontend bundle (only `VITE_ADMIN_API_KEY` is embedded).
- [ ] Frontend rebuilt with `VITE_ADMIN_API_KEY` so the dashboard authenticates properly.
- [ ] HTTPS in front of the server (reverse proxy); `BASE_URL` and `GMAIL_REDIRECT_URI` use it.
- [ ] No `.env`, `logs/`, or `credentials/` committed (all gitignored).
- [ ] Test/demo rows removed from Supabase before release (see `test/` and `.e2e-pipeline.mjs` cleanup notes).

---

## Operations

- **Logs**: Winston writes `logs/combined.log` and `logs/error.log`; console level is `debug` in dev, `info` in prod.
- **Gmail reply detection**: obtain a refresh token by visiting `/auth/google` once, then save the printed refresh token as `GMAIL_REFRESH_TOKEN`. In production the callback URL must match the deployed `GMAIL_REDIRECT_URI` exactly (including trailing path), or Google rejects it.
- **Unsubscribe**: every sent email links to `/unsubscribe?token=...` (JWT-signed); clicking it suppresses that contact.
- **Tests**: `npm test` (17 unit + API tests). Full end-to-end regression: `node .e2e-pipeline.mjs` against a backend on `:5001` (creates test data — clean up afterwards).

---

## Non-goals

No payments/billing, no multi-tenant support, no mobile apps, no inbox UI (replies are read-only). New paid services require explicit approval.
