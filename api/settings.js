// api/settings.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from settings where id = 1`;
      if (rows.length === 0) {
        return res.status(200).json({
          id: 1, target_calories: 2200, target_protein_g: 180,
          target_carbs_g: 200, target_fat_g: 70,
        });
      }
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('GET /api/settings failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { targetCalories, targetProteinG, targetCarbsG, targetFatG } = req.body || {};
    try {
      const { rows } = await sql`
        update settings set
          target_calories = ${targetCalories}, target_protein_g = ${targetProteinG},
          target_carbs_g = ${targetCarbsG}, target_fat_g = ${targetFatG},
          updated_at = now()
        where id = 1
        returning *
      `;
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/settings failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
