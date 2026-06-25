# Platewise

Personal food nutrition analyser. Describe a meal and optionally upload a photo — Claude vision breaks it into ingredients and returns a nutrition card with calories, macros, and micros.

## Stack

- **Frontend** — React + Vite, inline styles, `@fontsource/fraunces` + `@fontsource/inter` typography
- **Backend** — Vercel serverless functions under `api/`; Express dev server at `server/server.js` mirrors them locally
- **Database** — Vercel Postgres (`meal_logs`, `saved_meals`, `saved_ingredients`, `user_settings` tables)
- **Storage** — Vercel Blob (meal photos)
- **LLM** — `claude-haiku-4-5-20251001` with forced tool use for structured nutrition output

## Features

- **Scan** — type a food name, attach a photo, get a full nutrition card (calories, macros, fiber, sodium, health score)
- **Dashboard** — daily calorie ring, macro progress pills, per-meal-type breakdown, quick-add from saved meals
- **History** — week navigator (backward unlimited; forward blocked at the current week); current week shows only days up to and including today
- **Library** — flat list of saved meals; searchable
- **Auth** — single shared passcode, stateless signed cookie (HMAC-SHA256)
- **PNG export** — download the nutrition card as an image

## Setup

```bash
cp .env.example .env
# Set ANTHROPIC_API_KEY, SESSION_SECRET, POSTGRES_URL, BLOB_READ_WRITE_TOKEN

npm run install:all
```

## Develop

```bash
npm run dev
```

Starts the Express API on `http://localhost:3001` and the Vite dev server concurrently. Vite proxies `/api/*` to `localhost:3001`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analyze` | Analyse a meal (requires auth) |
| GET/POST | `/api/auth` | Check session / verify passcode |
| GET/POST/PATCH | `/api/meals` | Today's logged meals |
| GET | `/api/meals-history` | Week range of logged meals |
| GET/POST/PATCH/DELETE | `/api/saved-meals` | Saved meal library |
| GET/POST/DELETE | `/api/saved-ingredients` | Saved ingredients (backend only, not surfaced in UI) |
| GET/PATCH | `/api/settings` | Daily nutrition targets |
| POST | `/api/log-again` | Re-log a past meal (reuses existing photo URL) |

### `/api/analyze` request

```json
{
  "name": "Butter Chicken",
  "imageBase64": "<base64 string>",
  "mimeType": "image/jpeg"
}
```

### `/api/analyze` response

```json
{
  "name": "string",
  "serving": "string",
  "calories": 450,
  "macros": { "carbs": 30, "protein": 28, "fat": 18 },
  "other": { "fiber": 3, "sugar": 6, "sodium": 820 },
  "fact": "string",
  "tips": ["string", "string", "string"],
  "healthScore": 7,
  "mismatch": false
}
```

## Project layout

```
platewise/
├── api/                        # Vercel serverless functions (production)
│   ├── analyze.js              # Claude vision call — the only Anthropic API call
│   ├── auth.js
│   ├── meals.js
│   ├── meals-history.js
│   ├── saved-meals.js
│   ├── saved-ingredients.js
│   ├── settings.js
│   └── log-again.js
├── server/
│   ├── server.js               # Express wrapper for local dev
│   └── loadenv.js
├── client/
│   ├── src/
│   │   ├── main.jsx            # Entry point — font CSS imports live here
│   │   ├── App.jsx             # Router / view switcher
│   │   ├── tokens.jsx          # Design tokens, shared utilities, shared components
│   │   ├── index.css           # Animations and keyframes
│   │   └── components/
│   │       ├── PWDashboard.jsx
│   │       ├── PWHistory.jsx
│   │       ├── PWLibrary.jsx
│   │       ├── PWAddMeal.jsx
│   │       ├── PWReview.jsx
│   │       ├── PWEditMeal.jsx
│   │       └── PWLock.jsx
│   ├── index.html
│   └── vite.config.js
├── package.json                # Root scripts (dev, build, install:all)
├── vercel.json
└── .env.example
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import in Vercel; set env vars: `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`.
3. Vercel auto-detects `api/` as serverless functions and builds `client/` to `client/dist` per `vercel.json`.
