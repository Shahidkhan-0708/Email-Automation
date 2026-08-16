# Project Decisions

Record decisions that should remain valid across sessions.

---

### 2026-08-15 — React app is the primary frontend

Context: Two frontends existed — a complete vanilla-JS dashboard in `public/` (mock data) and an unbuilt React scaffold in `frontend/`.

Decision: Build out the React app as the primary frontend and have Express serve `frontend/dist` at `/` with an SPA fallback. The legacy `public/` dashboard remains only as a static fallback when `frontend/dist` is absent.

Reason: The user chose "build out the React app"; the backend's static middleware now prefers the built React app.

Consequences: `npm run build` in `frontend/` is required before `npm start` serves the new UI. All new UI work happens in `frontend/`.

---

### 2026-08-15 — Default campaign lookup must be deterministic

Context: `getOrCreateDefaultCampaign()` queried by non-unique `name` with `.maybeSingle()`, which errors when multiple rows match on this PostgREST setup; the code then fell through and inserted a new duplicate campaign on every call (29+ duplicates accumulated).

Decision: Use `.eq('name', …).order('created_at', { ascending: true }).limit(1)` and take `data[0]`. Never `maybeSingle()` on a non-unique column.

Reason: Deterministic single-row fetch; stops duplicate campaign pollution.

Consequences: Existing duplicate campaigns remain and need a separate dedupe pass (with care about cascade deletes on outreach).

---

### 2026-08-15 — Profile upsert must not depend on a DB unique constraint

Context: `createOrUpdateProfile()` used `.upsert(..., { onConflict: 'contact_id' })`, but the `profiles` migration never added a unique constraint on `contact_id`, so every import row failed after the contact insert (contacts created, profiles missing, job counters zero).

Decision: Rewrote `createOrUpdateProfile()` as find-then-update/insert (`.eq('contact_id', …).limit(1)` → update or insert). Consider adding the constraint later: `ALTER TABLE profiles ADD CONSTRAINT profiles_contact_id_key UNIQUE (contact_id);`

Reason: The code should work regardless of DB constraint state; the migration was the source of the mismatch.

Consequences: Import pipeline now records correct created/updated counters.

---

### 2026-08-15 — Frontend auth strategy

Context: All `/api/*` routes require the admin API key; there is a dev-only `x-bypass-auth` escape hatch.

Decision: The frontend API client sends `x-bypass-auth: true` automatically in dev builds, or `x-api-key` when `VITE_ADMIN_API_KEY` is set at build time.

Reason: Zero-config local development while keeping a production path.

Consequences: Production builds must set `VITE_ADMIN_API_KEY`; document this before release (Milestone 4).

---

### 2026-08-15 — Read/data endpoints live in one router

Context: The UI needed campaign/contact/outreach/reply/profile/stats listings, which did not exist.

Decision: New `src/routes/dashboard.routes.js` mounted at `/api` holds all read-only data endpoints; action endpoints stay in `import.routes.js` / `personalization.routes.js`.

Reason: Follows the existing router-per-concern convention.

Consequences: Adding a new read endpoint goes in `dashboard.routes.js`.

---

### 2026-08-15 — E2E pipeline test is a repeatable regression script

Context: The full pipeline (import → enrichment → AI → review → approve → send → replies) needed verification against real integrations.

Decision: Keep `.e2e-pipeline.mjs` as a hidden, repeatable regression script (runs against a backend on :5001; creates test data).

Reason: Cheap end-to-end confidence without a full test framework yet.

Consequences: Running it creates demo rows in Supabase; clean them up before release.
