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
