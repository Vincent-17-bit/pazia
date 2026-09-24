# Pazia

Monorepo: `/server` (Express + TMDB proxy) and `/client` (Vite + React + Tailwind).

## Run locally

```
cd server && cp .env.example .env && npm install && npm run dev
cd client && cp .env.example .env && npm install && npm run dev
```

Without `TMDB_API_KEY` / `MONGODB_URI` set, the server runs in demo-data mode with an
in-memory store, so the app is fully clickable out of the box. Add real credentials
in `server/.env` to switch to live TMDB data and persistent MongoDB storage — no code
changes required.

A working demo `ContentSource` (Internet Archive public-domain film) is seeded for
`movie/watu-wote` so the player can be tested end-to-end.

## Deploy to Vercel

Deploy `client` and `server` as two **separate** Vercel projects (each has its own
`vercel.json`), so only `server` serves the API.

**server** — root directory `server`. Vercel auto-detects `api/index.js` as the
serverless function; `vercel.json` rewrites every path to it, so the Express app's
own `/api/...` routing still applies. Set env vars from `server/.env.example`
(`MONGODB_URI`, `TMDB_API_KEY`, etc.) plus:
- `CLIENT_ORIGIN` — the client's deployed URL. Comma-separate multiple origins
  (e.g. prod + a preview URL) to allow more than one.

**client** — root directory `client`. Vercel's Vite preset builds it as a static
site; `vercel.json` adds the SPA fallback so deep links don't 404 on refresh. Set:
- `VITE_API_BASE` — the server project's URL + `/api`, e.g.
  `https://pazia-server.vercel.app/api`.

Deploy the server first, note its URL for `VITE_API_BASE`, then deploy the client
with `CLIENT_ORIGIN` on the server pointed back at the client's URL.
