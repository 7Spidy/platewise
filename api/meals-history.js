// api/meals-history.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { start, end } = req.query || {};
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query params are required (YYYY-MM-DD)' });
  }

  try {
    const { rows } = await sql`
      select id, created_at, name, serving, calories, carbs_g, protein_g, fat_g,
             fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch,
             photo_url, meal_type, ingredients
      from meal_logs
      where created_at::date >= ${start}::date and created_at::date <= ${end}::date
      order by created_at asc
    `;

    const byDate = new Map();
    for (const m of rows) {
      const day = new Date(m.created_at).toISOString().slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day).push(m);
    }

    const days = [...byDate.entries()]
      .map(([date, meals]) => ({
        date,
        total_calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        meals,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return res.status(200).json({ start, end, days });
  } catch (err) {
    console.error('GET /api/meals-history failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
