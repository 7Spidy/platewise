// api/log-again.js
import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const { rows: existing } = await sql`select * from meal_logs where id = ${id} and user_id = ${req.user.id}`;
    const source = existing[0];
    if (!source) return res.status(404).json({ error: 'Meal not found' });

    // Re-uses the same photo_url — no need to re-upload to Blob for a repeat entry
    const { rows } = await sql`
      insert into meal_logs
        (user_id, name, serving, calories, carbs_g, protein_g, fat_g, fiber_g, sugar_g, sodium_mg,
         health_score, fact, tips, mismatch, photo_url, meal_type, ingredients)
      values
        (${req.user.id}, ${source.name}, ${source.serving}, ${source.calories},
         ${source.carbs_g}, ${source.protein_g}, ${source.fat_g},
         ${source.fiber_g}, ${source.sugar_g}, ${source.sodium_mg},
         ${source.health_score}, ${source.fact}, ${JSON.stringify(source.tips ?? [])},
         ${source.mismatch}, ${source.photo_url}, ${source.meal_type},
         ${source.ingredients ? JSON.stringify(source.ingredients) : null})
      returning *
    `;

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/log-again failed:', err);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
}
