# Project Operating System

You are working inside a persistent software project: **College Outreach Automation System V2** — an AI-assisted outreach platform (Node/Express + Supabase + React). Treat every session as a continuation of prior work.

## Global goal

The authoritative project goal is:

`.freebuff/goal.md`

Read it before doing meaningful work. Do not replace, reinterpret, or weaken the global goal unless the user explicitly approves the change.

## Required startup behavior

At the beginning of every session or new task:

1. Read `.freebuff/goal.md`.
2. Read `.freebuff/roadmap.md`.
3. Read `.freebuff/current-task.md`.
4. Read `.freebuff/decisions.md`.
5. Inspect the repository structure.
6. Check the current git status.
7. Identify the current milestone and next action.

Before editing files, report:

- The global goal.
- The current milestone.
- The active task.
- Relevant constraints.
- Any blockers or uncertainties.
- The next action you propose.

## Project orientation (this repo)

- **Backend**: `src/` — Express (ESM), Supabase is the source of truth, Airtable for dashboard sync, SMTP via Brevo (nodemailer), Gmail OAuth for inbound reply detection, OpenAI for reply classification + personalization, `node-cron` scheduled jobs (`src/jobs/`).
- **Frontend**: `frontend/` — React 19 + Vite + TypeScript + Tailwind v4 + Radix UI. The built app (`frontend/dist`) is served by Express at `/` with an SPA fallback. A legacy vanilla-JS dashboard lives in `public/` and is used only as a static fallback.
- **Database**: Supabase tables — `contacts`, `campaigns`, `outreach`, `processed_gmail_messages`, `profiles`, `enrichment_sources`, `enrichment_results`, `profile_enrichment_links`, `personalization_results`, `review_decisions`, `import_jobs`. Migrations live in `db/migrations/`; they must be applied via the Supabase SQL editor (no direct psql access).
- **API**: all routes under `/api` require the admin key (`x-api-key`) — in dev, `x-bypass-auth: true` also works.
- **Dev**: `cd frontend && npm run dev` (Vite on :5173, proxies `/api` to :5000). Prod: `npm start` serves the built app on :5000.

## Goal alignment

For every user request, determine whether it:

- Directly advances the global goal.
- Is necessary maintenance.
- Is a temporary side task.
- Conflicts with the project direction.

If the request is unrelated or changes the product direction, ask for clarification instead of silently changing scope.

## Work rules

- Inspect existing code before proposing changes.
- Search the repository before assuming something does not exist.
- Follow existing naming, architecture, and formatting conventions.
- Prefer small, reversible changes.
- Do not rewrite unrelated code.
- Do not add dependencies without explaining why.
- Do not create duplicate functionality.
- Do not claim that a command succeeded unless you actually ran it.
- Do not claim that tests pass unless you actually ran them.

## Planning rule

Create a plan before:

- Changing multiple files.
- Changing architecture.
- Changing public APIs.
- Modifying authentication or authorization.
- Changing the database schema.
- Adding a significant dependency.
- Performing a destructive operation.
- Changing deployment or infrastructure.
- Sending real email or touching production data.

The plan must include:

1. Objective.
2. Goal alignment.
3. Files likely to change.
4. Implementation steps.
5. Risks.
6. Verification commands.

For small, local, reversible changes, a full plan is not required.

## Implementation loop

For each meaningful change:

1. Inspect.
2. Explain the intended change.
3. Implement the smallest useful version.
4. Run relevant checks.
5. Inspect the diff.
6. Update `.freebuff/current-task.md`.

Do not move to a new feature while the current task has failing checks unless the user explicitly asks you to do so.

## Verification (this project)

- Backend syntax: `node --check <file>`.
- Backend smoke/unit verification: `node test-verification.js`.
- End-to-end pipeline regression: `node .e2e-pipeline.mjs` (requires a backend on :5001 — it creates test data; see the script header).
- Frontend: `cd frontend && npm run build` (tsc + vite) and `cd frontend && npm run lint` (oxlint).
- Always inspect `git diff` afterwards; check for accidental files, secrets, debug code, and unrelated modifications.

Report:

- Commands executed.
- Results.
- Known failures.
- Checks that were not run.

## Persistent state

Update the state files when:

- A task begins.
- A task is completed.
- A decision is made.
- A blocker appears.
- The roadmap changes.
- Tests reveal important information.

Before ending a session, always update `.freebuff/current-task.md` and `.freebuff/session-log.md`.

## Safety

Ask before:

- Deleting files or data (including cleanup of test/demo rows in Supabase).
- Running destructive commands.
- Changing the global goal.
- Changing the roadmap substantially.
- Modifying authentication or authorization.
- Changing public API behavior.
- Making database migrations.
- Adding paid services.
- Committing or pushing code.
- Deploying.
- Sending real outreach emails beyond a contained test.

## End-of-task report

End every completed work unit with:

```text
Completed:
Files changed:
Verification:
Known issues:
Remaining work:
Next recommended action:
```

## Priority order

When instructions conflict:

1. System and platform instructions.
2. Explicit instructions in the current user message.
3. This file.
4. `.freebuff/goal.md`.
5. `.freebuff/roadmap.md`.
6. `.freebuff/decisions.md`.
7. Existing project conventions.
