// api/saved-meals.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { validateMealWritePayload } from '../lib/schema.js';
import { numifyRow, SAVED_NUMERIC_KEYS, sanitizeMealType } from '../lib/normalize.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from saved_meals where user_id = ${req.user.id} order by name asc`;
      return res.status(200).json(rows.map((r) => numifyRow(r, SAVED_NUMERIC_KEYS)));
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
          (user_id, name, photo_url, ingredients, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
        values
          (${req.user.id}, ${name}, ${photoUrl ?? null}, ${ingredients ? JSON.stringify(ingredients) : null}, ${calories},
           ${proteinG ?? 0}, ${carbsG ?? 0}, ${fatG ?? 0},
           ${fiberG ?? 0}, ${sodiumMg ?? 0}, ${sugarG ?? 0})
        returning *
      `;
      return res.status(201).json(numifyRow(rows[0], SAVED_NUMERIC_KEYS));
    } catch (err) {
      console.error('POST /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, log, mealType, loggedAt, name, photoUrl, ingredients, calories, proteinG, carbsG, fatG, fiberG, sodiumMg, sugarG } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (log) {
      let createdAtIso = null;
      if (loggedAt !== undefined && loggedAt !== null) {
        const d = new Date(loggedAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: 'loggedAt is not a valid date' });
        }
        createdAtIso = d.toISOString();
      }
      const safeMealType = sanitizeMealType(mealType);

      try {
        // One statement = atomic: the meal_logs row is inserted and use_count bumped together, or neither.
        const { rows } = await sql`
          with bumped as (
            update saved_meals
               set use_count = use_count + 1, last_used_at = now()
             where id = ${id} and user_id = ${req.user.id}
            returning *
          )
          insert into meal_logs
            (user_id, name, serving, calories, carbs_g, protein_g, fat_g,
             fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch,
             photo_url, meal_type, ingredients, created_at)
          select
            b.user_id, b.name, null, round(b.calories)::int,
            round(b.carbs_g)::int, round(b.protein_g)::int, round(b.fat_g)::int,
            round(b.fiber_g), round(b.sugar_g), round(b.sodium_mg),
            null, null, '[]'::jsonb, false,
            b.photo_url, ${safeMealType}, b.ingredients,
            coalesce(${createdAtIso}::timestamptz, now())
          from bumped b
          returning *
        `;
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.status(201).json(rows[0]);
      } catch (err) {
        console.error('PATCH /api/saved-meals log failed:', err);
        return res.status(500).json({ error: 'Something went wrong, please try again' });
      }
    }

    try {
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
        where id = ${id} and user_id = ${req.user.id}
        returning *
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(numifyRow(rows[0], SAVED_NUMERIC_KEYS));
    } catch (err) {
      console.error('PATCH /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      await sql`delete from saved_meals where id = ${id} and user_id = ${req.user.id}`;
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/saved-meals failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
