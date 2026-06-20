import './loadenv.js';
import express from 'express';
import cors from 'cors';
import analyzeHandler from '../api/analyze.js';
import authHandler from '../api/auth.js';
import mealsHandler from '../api/meals.js';
import logAgainHandler from '../api/log-again.js';

// Prevent silent crashes — log unhandled errors instead of killing the process
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Wrap async handlers so Express 4 never sees an unhandled rejection
function wrap(handler) {
  return (req, res) => {
    handler(req, res).catch((err) => {
      console.error('[handler uncaught]', err);
      if (!res.headersSent) res.status(500).json({ error: err?.message ?? 'Internal server error' });
    });
  };
}

app.post('/api/analyze', wrap(analyzeHandler));

app.get('/api/auth', wrap(authHandler));
app.post('/api/auth', wrap(authHandler));

app.get('/api/meals', wrap(mealsHandler));
app.post('/api/meals', wrap(mealsHandler));

app.post('/api/log-again', wrap(logAgainHandler));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Platewise dev API listening on http://localhost:${PORT}`);
});
