// api/settings.js
import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';

// Returns null when valid; returns { field, message } on the first violation.
export function validateTargets({ targetCalories, targetProteinG, targetCarbsG, targetFatG } = {}) {
  if (targetCalories < 800)  return { field: 'targetCalories', message: 'targetCalories must be at least 800' };
  if (targetProteinG < 20)   return { field: 'targetProteinG', message: 'targetProteinG must be at least 20' };
  if (targetCarbsG < 20)     return { field: 'targetCarbsG',   message: 'targetCarbsG must be at least 20' };
  if (targetFatG < 10)       return { field: 'targetFatG',     message: 'targetFatG must be at least 10' };
  return null;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from user_settings where user_id = ${req.user.id}`;
      if (rows.length === 0) {
        // Return defaults if not yet set up
        return res.status(200).json({
          user_id: req.user.id,
          calorie_target: 2200,
          macro_protein_g: 180,
          macro_carbs_g: 200,
          macro_fat_g: 70,
          manually_edited: false,
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

    const validationError = validateTargets({ targetCalories, targetProteinG, targetCarbsG, targetFatG });
    if (validationError) return res.status(400).json({ error: validationError.message });

    try {
      const { rows } = await sql`
        insert into user_settings (user_id, calorie_target, macro_protein_g, macro_carbs_g, macro_fat_g, manually_edited, updated_at)
        values (${req.user.id}, ${targetCalories}, ${targetProteinG}, ${targetCarbsG}, ${targetFatG}, true, now())
        on conflict (user_id) do update set
          calorie_target  = excluded.calorie_target,
          macro_protein_g = excluded.macro_protein_g,
          macro_carbs_g   = excluded.macro_carbs_g,
          macro_fat_g     = excluded.macro_fat_g,
          manually_edited = true,
          updated_at      = now()
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
