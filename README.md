# Platewise

Food nutrition analyzer. Take a photo of food, get a nutrition infographic powered by Claude vision. V2 adds a passcode lock, a meal log, and history.

## Stack

- **Frontend** — React + Vite + Tailwind (in `client/`)
- **Backend** — Vercel serverless functions at `api/`; Express dev server at `server/server.js` mirrors them locally
- **LLM** — `claude-haiku-4-5-20251001` with vision (~3x cheaper than Sonnet, see `CLAUDE.md` for the cost comparison)
- **Database** — Vercel Postgres (`meal_logs` table)
- **Photo storage** — Vercel Blob (resized meal photo, URL stored on the row)
- **Auth** — single shared app-level passcode, signed session cookie, no per-user accounts

## Setup

```bash
cp .env.example .env
# edit .env — see "Environment variables" below

npm run install:all
```

### Environment variables

| Variable | Where it comes from |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `APP_PASSCODE` | pick a 4-digit code yourself |
| `SESSION_SECRET` | any long random string, e.g. `openssl rand -hex 32` |
| `POSTGRES_URL` | Vercel dashboard → Storage → add Postgres → it's injected automatically once linked |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → add Blob → injected automatically once linked |

Run `vercel env pull` after adding the Postgres/Blob integrations in the dashboard to get those last two locally.

### Database

Run `sql/001_meal_logs.sql` once against your Postgres instance (Vercel dashboard → Storage → your Postgres → Query tab, or any Postgres client).

## Develop

```bash
npm run dev
```

Runs the Express API on `http://localhost:3001` and the Vite client concurrently. The client proxies `/api` to `localhost:3001`.

## API

`POST /api/analyze` — unchanged, still the only Anthropic call. Now requires an authenticated session.

`GET /api/auth` — `{ authenticated: boolean }`
`POST /api/auth` — body `{ passcode }` to log in, or `{ logout: true }` to log out

`GET /api/meals` — list saved meals, newest first
`POST /api/meals` — save a new meal (see `api/meals.js` for the request shape)

`POST /api/log-again` — body `{ id }`, duplicates an existing meal as a new entry today

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the Postgres and Blob storage integrations from the Vercel dashboard (Storage tab) — this sets `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN` automatically.
4. Set `ANTHROPIC_API_KEY`, `APP_PASSCODE`, and `SESSION_SECRET` in the project's environment variables.
5. Run the migration in `sql/001_meal_logs.sql` against the new Postgres instance.
6. Vercel auto-detects `api/` as serverless functions and builds the client to `client/dist` per `vercel.json`.

## Project layout

```
platewise/
├── api/
│   ├── analyze.js          # Vercel serverless function — the Anthropic vision call
│   ├── auth.js             # passcode login / session check / logout
│   ├── meals.js            # list + save meal logs
│   └── log-again.js        # duplicate an existing meal log entry
├── lib/
│   ├── auth.js             # signed session cookie helpers
│   └── blob.js             # Vercel Blob upload helper
├── sql/
│   └── 001_meal_logs.sql
├── server/
│   └── server.js           # Express wrapper that mirrors the api/ handlers in dev
├── client/                 # Vite + React frontend
├── package.json
├── vercel.json
└── .env.example
```
