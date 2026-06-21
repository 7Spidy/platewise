import './loadenv.js';
import express from 'express';
import cors from 'cors';
import analyzeHandler from '../api/analyze.js';
import authHandler from '../api/auth.js';
import mealsHandler from '../api/meals.js';
import mealsHistoryHandler from '../api/meals-history.js';
import logAgainHandler from '../api/log-again.js';
import savedMealsHandler from '../api/saved-meals.js';
import savedIngredientsHandler from '../api/saved-ingredients.js';
import settingsHandler from '../api/settings.js';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: '10mb' }));

function wrap(h) {
  return (req, res) => {
    Promise.resolve(h(req, res)).catch((err) => {
      console.error('[handler error]', err);
      if (!res.headersSent) res.status(500).json({ error: err?.message ?? 'Internal server error' });
    });
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.all('/api/auth',               wrap((req, res) => authHandler(req, res)));
app.all('/api/analyze',            wrap((req, res) => analyzeHandler(req, res)));
app.all('/api/meals',              wrap((req, res) => mealsHandler(req, res)));
app.all('/api/meals-history',      wrap((req, res) => mealsHistoryHandler(req, res)));
app.all('/api/log-again',          wrap((req, res) => logAgainHandler(req, res)));
app.all('/api/saved-meals',        wrap((req, res) => savedMealsHandler(req, res)));
app.all('/api/saved-ingredients',  wrap((req, res) => savedIngredientsHandler(req, res)));
app.all('/api/settings',           wrap((req, res) => settingsHandler(req, res)));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Platewise dev API listening on http://localhost:${PORT}`);
});
