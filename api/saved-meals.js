// api/saved-meals.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { validateMealWritePayload } from '../lib/schema.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from saved_meals order by name asc`;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'POST') {
    const { name, photoUrl, ingredients, calories, proteinG, carbsG, fatG, fiberG, sodiumMg, sugarG } = req.body || {};

    const payloadErrors = validateMealWritePayload({ name, calories, ingredients });
    if (payloadErrors.length > 0) {
      return res.status(400).json({ error: payloadErrors.join('; ') });
    }

    try {
      const { rows } = await sql`
        insert into saved_meals
          (name, photo_url, ingredients, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
        values
          (${name}, ${photoUrl ?? null}, ${ingredients ? JSON.stringify(ingredients) : null}, ${calories},
           ${proteinG ?? 0}, ${carbsG ?? 0}, ${fatG ?? 0},
           ${fiberG ?? 0}, ${sodiumMg ?? 0}, ${sugarG ?? 0})
        returning *
      `;
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, bumpUse, name, photoUrl, ingredients, calories, proteinG, carbsG, fatG, fiberG, sodiumMg, sugarG } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    try {
      if (bumpUse) {
        const { rows } = await sql`
          update saved_meals set use_count = use_count + 1, last_used_at = now()
          where id = ${id}
          returning *
        `;
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }

      const payloadErrors = validateMealWritePayload({ name, calories, ingredients });
      if (payloadErrors.length > 0) {
        return res.status(400).json({ error: payloadErrors.join('; ') });
      }

      const { rows } = await sql`
        update saved_meals set
          name = ${name}, photo_url = ${photoUrl ?? null},
          ingredients = ${ingredients ? JSON.stringify(ingredients) : null},
          calories = ${calories}, protein_g = ${proteinG ?? 0}, carbs_g = ${carbsG ?? 0}, fat_g = ${fatG ?? 0},
          fiber_g = ${fiberG ?? 0}, sodium_mg = ${sodiumMg ?? 0}, sugar_g = ${sugarG ?? 0}
        where id = ${id}
        returning *
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      await sql`delete from saved_meals where id = ${id}`;
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
