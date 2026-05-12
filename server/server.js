import './loadenv.js';
import express from 'express';
import cors from 'cors';
import handler from '../api/analyze.js';

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

// Wrap async handler so Express 4 never sees an unhandled rejection
app.post('/api/analyze', (req, res) => {
  handler(req, res).catch((err) => {
    console.error('[analyze uncaught]', err);
    if (!res.headersSent) res.status(500).json({ error: err?.message ?? 'Internal server error' });
  });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Platewise dev API listening on http://localhost:${PORT}`);
});
