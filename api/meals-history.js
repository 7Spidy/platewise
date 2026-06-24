// api/meals-history.js
import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';
import { dateRange } from '../lib/date.js';

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
    // IST-aware date bucketing done in SQL to avoid UTC-day mismatch
    const { rows } = await sql`
      select id, created_at, name, serving, calories, carbs_g, protein_g, fat_g,
             fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch,
             photo_url, meal_type, ingredients,
             (created_at + interval '5 hours 30 minutes')::date::text as ist_date
      from meal_logs
      where user_id = ${req.user.id}
        and (created_at + interval '5 hours 30 minutes')::date >= ${start}::date
        and (created_at + interval '5 hours 30 minutes')::date <= ${end}::date
      order by created_at asc
    `;

    const byDate = new Map();
    for (const m of rows) {
      const day = m.ist_date;
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day).push(m);
    }

    // Zero-fill the full date range so the chart has no gaps
    const days = dateRange(start, end).map((date) => {
      const meals = byDate.get(date) || [];
      return {
        date,
        total_calories:  meals.reduce((s, m) => s + (m.calories   || 0), 0),
        total_protein_g: meals.reduce((s, m) => s + (Number(m.protein_g) || 0), 0),
        total_carbs_g:   meals.reduce((s, m) => s + (Number(m.carbs_g)   || 0), 0),
        total_fat_g:     meals.reduce((s, m) => s + (Number(m.fat_g)     || 0), 0),
        meals,
      };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));

    return res.status(200).json({ start, end, days });
  } catch (err) {
    console.error('GET /api/meals-history failed:', err);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
}
