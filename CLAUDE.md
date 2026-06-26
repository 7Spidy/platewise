# Platewise — CLAUDE.md

## What this is
Food nutrition analyser. User types a food name + uploads a photo → Anthropic API (Claude Haiku vision, forced tool use) → nutrition infographic card. Personal project, not public-facing.

## Repo layout
```
platewise/
├── api/analyze.js          # Vercel serverless function — the only Anthropic API call
├── server/server.js        # Express wrapper that calls the same handler locally
├── server/loadenv.js       # dotenv loader — must run before any SDK import
├── client/src/App.jsx      # All UI, state, hooks, and screens
├── client/src/index.css    # Animations, keyframes, design utility classes
├── client/src/main.jsx     # React entry point
├── client/index.html       # HTML shell
├── client/vite.config.js   # Vite config — proxies /api to localhost:3001
├── vercel.json             # Build config + rewrite rules
└── package.json            # Root scripts
```

## Local dev
```bash
cp .env.example .env          # then set ANTHROPIC_API_KEY
npm run install:all           # root deps + client deps
npm run dev                   # Express on :3001 + Vite concurrently
```
Vite proxies `/api/*` → `localhost:3001`. No CORS config needed in dev.

## API contract

**POST /api/analyze**

Request:
```json
{
  "name":        "Butter Chicken",   // max 80 chars; treated as data, not instructions
  "imageBase64": "<base64 string>",  // always JPEG, client-side compressed to 600px
  "mimeType":    "image/jpeg"        // server whitelist: jpeg|png|webp|gif; defaults to jpeg
}
```

Response (validated server-side — 502 if shape is wrong):
```json
{
  "name":        "string",
  "serving":     "string",
  "calories":    450,
  "macros":      { "carbs": 30, "protein": 28, "fat": 18 },
  "other":       { "fiber": 3, "sugar": 6, "sodium": 820 },
  "fact":        "string — max 25 words",
  "tips":        ["string ≤15 words", "string", "string"],
  "healthScore": 7,
  "mismatch":    false
}
```

## Key implementation decisions

| Decision | Why |
|---|---|
| `claude-haiku-4-5-20251001` | ~3x cheaper than Sonnet (~₹0.20/scan vs ₹0.80) |
| Forced tool use (`tool_choice: { type: 'tool', name: 'record_nutrition' }`) | Structurally enforces JSON schema; no parsing or fence-stripping needed |
| Images compressed to 600px JPEG client-side | Cuts image tokens ~44%; HEIC/HEIF handled safely via canvas re-encode |
| `max_tokens: 1024` | Actual output is ~250–300 tokens; 1024 is safe headroom |
| `mimeType` server whitelist | Rejects exotic types; defaults to jpeg |
| `name` truncated to 80 chars server-side | Prompt injection guard |
| `validateResult()` server-side | 502s cleanly on malformed model output instead of passing garbage to client |
| `mismatch` surfaced as warning banner | Only honest signal when photo ≠ food name |
| `scanCache` (`useRef Map`) | Session-scoped dedup — identical name+photo combos skip the API call entirely |
| `usePngExport` hook | Single source of truth for download logic; used by both mobile and desktop |
| Macro bar `safeTotal = total \|\| 1` + `flexFor = v => Math.max(v, safeTotal * 0.02)` | Prevents NaN% and zero-flex collapse on trace-calorie foods |
| Run time estimate `÷ 10` | ≈10 kcal/min at a moderate running pace (was incorrectly ÷90) |

## V2 implementation decisions

| Decision | Why |
|---|---|
| Single shared passcode, no per-user accounts | Personal app — one household, no need for user table or registration flow |
| Stateless signed cookie (`HMAC-SHA256` over expiry timestamp) | No session table to maintain; verified by re-computing HMAC — nothing to look up in DB |
| `SESSION_SECRET` in env, never in code | Rotating the secret instantly invalidates all sessions without a DB migration |
| Vercel Postgres (`meal_logs` table) | Native Vercel integration; `@vercel/postgres` handles pooling automatically |
| Photo stored to Vercel Blob, URL saved on row | Avoids storing base64 in Postgres (column bloat); Blob CDN serves images faster |
| `log-again` endpoint duplicates the row, reuses `photo_url` | No re-upload to Blob needed for a repeat entry — same image, new timestamp |
| No "favorites" — log-again is the repeat mechanism | Simpler model: every log entry is just a timestamped meal; history + log-again covers the repeat use case without a separate favorites table |
| `requireAuth` guard on `/api/analyze` | Passcode blocks the only expensive endpoint (Anthropic API call) |
| `meal_type` column nullable, unused by UI | Reserved for future breakfast/lunch/dinner tagging without requiring a migration |

## What NOT to change without a reason
- **Model**: do not switch away from `claude-haiku-4-5-20251001` without re-benchmarking cost + quality
- **`tool_choice`**: must stay `{ type: 'tool', name: 'record_nutrition' }` — forced, not `auto`
- **Image max**: do not increase above 600px — extra resolution doesn't improve nutrition accuracy
- **`max_tokens`**: do not raise above 1024 without profiling actual output sizes

## Things that intentionally don't exist
- No auth, no rate limiting — personal project, not public
- No server-side image storage — base64 is transient, discarded after response
- No database — session memory only (`useRef` cache, cleared on page reload)

## Testing checklist (run before every push)

- [ ] **Normal scan** — common food (e.g. "Dal Tadka") with matching photo → card renders; all fields populated; no console errors
- [ ] **Mismatch** — type "Apple", upload a photo of pizza → amber warning banner visible on card
- [ ] **HEIC / iPhone photo** — upload a `.heic` file → compresses and sends as JPEG; no error
- [ ] **Zero-macro food** — "Black Coffee" → macro bar renders without NaN% or layout collapse; segments have minimum visible width
- [ ] **Corrupt file** — upload a `.txt` renamed to `.jpg` → red error banner shown; UI does not hang
- [ ] **Duplicate scan** — submit the same food + photo twice → second call returns instantly with no loading spinner
- [ ] **Long food name** — paste 200 chars into the name field → input capped at 80 chars (`maxLength`); scan proceeds normally
- [ ] **Download PNG** — tap Download → file saved; action buttons not visible in the exported image
- [ ] **Desktop layout** — viewport > 640px → sticky nav bar, centred 480px card, "How it works" modal opens and closes
- [ ] **Mobile layout** — viewport < 640px → full-screen input screen → full-screen result screen on analyze
- [ ] **Log again from History** — open a past meal from History, tap "Log again", confirm with default (now) timestamp, verify a new entry appears on today's Dashboard with the same food data and a new id.
- [ ] **Log again with backdated time** — same as above but change the datetime field before confirming; verify the new entry's logged time matches what was entered, not the time the button was tapped.
- [ ] **Log again hidden on Dashboard** — open a meal from the Dashboard's "today" list and confirm no "Log again" button appears in the detail view, only Edit/Close.
- [ ] **Log again removed from Edit screen** — open Edit on any meal and confirm there is no "Log again" button in the header; only back button and title.
- [ ] **Log again error handling** — simulate a failed `/api/log-again` call (e.g. temporarily break the endpoint or disconnect network) and confirm the modal stays open with an error message instead of silently failing or closing.

## Commit style
```
type: short imperative description

- bullet: what changed
- bullet: why
```
Types: `feat`, `fix`, `refactor`, `chore`, `docs`
