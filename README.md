# Platewise

Food nutrition analyzer. Take a photo of food, get a nutrition infographic powered by Claude vision.

## Stack

- **Frontend** — React + Vite + Tailwind (in `client/`)
- **Backend** — Vercel serverless function at `api/analyze.js`; Express dev server at `server/server.js` mirrors it locally
- **LLM** — `claude-sonnet-4-6` with vision

## Setup

```bash
cp .env.example .env
# edit .env, set ANTHROPIC_API_KEY

npm run install:all
```

## Develop

```bash
npm run dev
```

Runs the Express API on `http://localhost:3001` and the Vite client (when present) concurrently. The client should proxy `/api` to `localhost:3001` (configure in `client/vite.config.js`).

## API

`POST /api/analyze`

Request:
```json
{
  "name": "Butter Chicken",
  "imageBase64": "<base64-encoded image, no data: prefix>",
  "mimeType": "image/jpeg"
}
```

Response: JSON object matching the schema enforced in [`api/analyze.js`](api/analyze.js) — name, serving, calories, macros, other, fact, tips, healthScore, mismatch.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Set `ANTHROPIC_API_KEY` in Vercel project env vars.
4. Vercel auto-detects `api/` as serverless functions and builds the client to `client/dist` per `vercel.json`.

## Project layout

```
platewise/
├── api/
│   └── analyze.js          # Vercel serverless function (production endpoint)
├── server/
│   └── server.js           # Express wrapper that calls the same handler in dev
├── client/                 # Vite + React frontend (added separately)
├── package.json
├── vercel.json
└── .env.example
```
