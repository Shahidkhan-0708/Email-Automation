# Outreach Console · V2

The primary React frontend for the College Outreach Automation System. Express
serves this app's production build (`f/dist`) at `/` with an SPA fallback.

## Run

```bash
npm install          # first time
npm run dev          # Vite dev server on :5174, proxies /api to localhost:5000
```

## Build (required for the backend to serve it)

```bash
npm run build        # tsc + vite → dist/
```

The backend serves `f/dist` first, falling back to `frontend/dist`, then the
legacy `public/` dashboard. Rebuild after frontend changes, then restart the
backend.

## Production auth

All `/api/*` routes require the admin API key. In dev builds the app sends
`x-bypass-auth: true` automatically; the backend only honors that header when
`NODE_ENV=development`. For production, build with the key so the app sends
`x-api-key` instead:

```bash
# POSIX
VITE_ADMIN_API_KEY=your_secure_admin_api_key npm run build

# Windows (cmd)
set VITE_ADMIN_API_KEY=your_secure_admin_api_key && npm run build
```

`VITE_ADMIN_API_KEY` must match the backend's `ADMIN_API_KEY`.

## Pages

Dashboard · Pipeline · Import (CSV/XLSX/PDF/images with OCR) · People ·
Research (live enrichment: OpenAlex/Wikipedia/DuckDuckGo) · Personalization ·
Review · Outreach · Replies · Campaigns · Bulk Send · Settings

## Notes

- All pages run on live API data. The only remaining demo-data spots are the
  Settings integrations list, the sidebar activity feed, and the
  Personalization variant picker (flagged with TODOs in `src/lib/demo.ts`).
- The bundle is code-split per route; vendor chunks are long-cacheable.
