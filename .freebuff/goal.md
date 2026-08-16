# Global Goal

## Objective

Build a complete college outreach automation system that ingests academic lead files, enriches them with research context, generates AI-personalized outreach emails for human review, dispatches them through a rate-limited SMTP pipeline, and tracks inbound replies with AI classification — all controlled through a connected web dashboard.

## Definition of done

The project is complete when:

- Leads can be imported from CSV/XLSX/PDF and become contacts, profiles, and outreach enrollments.
- AI personalization generates evidence-cited emails that land in a human review queue.
- Approve / reject / edit decisions control what gets sent, with one-click bulk approve-and-send.
- Outreach dispatches through SMTP with daily rate limits, and follow-ups are sequenced automatically.
- Inbound replies are detected (Gmail), AI-classified, and surfaced in the UI.
- The React dashboard reflects real backend state for all of the above (no mock data in the primary UI).
- The full pipeline is verified end to end (`node .e2e-pipeline.mjs`) and core flows have automated checks.

## Current priorities

1. Make the connected frontend the primary interface and keep every page on real data.
2. Close the remaining pipeline gaps (real enrichment stage, campaign dedupe, reply detail view).
3. Harden reliability: automated tests, code-splitting, production auth config, deployment docs.

## Non-goals

This project does not currently include:

- Payments or billing.
- Multi-tenant/multi-org support.
- Native mobile applications.
- An inbox UI (replies are surfaced read-only).

## Constraints

- Supabase (Postgres) is the source of truth; Airtable is dashboard-only sync.
- Prefer the existing stack: Express ESM, React 19 + Vite + Tailwind v4, Radix UI.
- Do not add paid services without approval (Brevo, OpenAI, Supabase already in use).
- Do not change DB schema without applying it through `db/migrations/` via the Supabase SQL editor.
- Do not send real outreach email beyond a contained test without approval.

## Last approved change

Connected the React frontend to the backend end to end: added read/data API routes, rewired the app state to live API data, and had Express serve the built React app with an SPA fallback. End-to-end pipeline test passes 20/20.

## Last updated

2026-08-15
