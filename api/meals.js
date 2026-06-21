// api/meals.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { uploadMealPhoto } from '../lib/blob.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { date } = req.query || {};
      if (date) {
        const { rows } = await sql`
          select id, created_at, name, serving, calories, carbs_g, protein_g, fat_g,
                 fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch,
                 photo_url, meal_type, ingredients
          from meal_logs
          where created_at::date = ${date}::date
          order by created_at asc
        `;
        return res.status(200).json(rows);
      }

      const { rows } = await sql`
        select id, created_at, name, serving, calories, carbs_g, protein_g, fat_g,
               fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch,
               photo_url, meal_type, ingredients
        from meal_logs
        order by created_at desc
        limit 200
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/meals failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const {
      name, serving, calories,
      macros = {}, other = {}, ingredients,
      healthScore, fact, tips, mismatch, mealType,
      imageBase64, mimeType, loggedAt,
    } = req.body || {};

    if (!name || typeof calories !== 'number') {
      return res.status(400).json({ error: 'name and calories are required' });
    }

    let photoUrl = null;
    if (imageBase64) {
      try {
        photoUrl = await uploadMealPhoto(imageBase64, mimeType || 'image/jpeg');
      } catch (err) {
        console.error('Blob upload failed:', err);
      }
    }

    try {
      const { rows } = await sql`
        insert into meal_logs
          (name, serving, calories, carbs_g, protein_g, fat_g, fiber_g, sugar_g, sodium_mg,
           health_score, fact, tips, mismatch, photo_url, meal_type, ingredients, created_at)
        values
          (${name}, ${serving ?? null}, ${calories},
           ${macros.carbs ?? null}, ${macros.protein ?? null}, ${macros.fat ?? null},
           ${other.fiber ?? null}, ${other.sugar ?? null}, ${other.sodium ?? null},
           ${healthScore ?? null}, ${fact ?? null}, ${JSON.stringify(tips ?? [])},
           ${!!mismatch}, ${photoUrl}, ${mealType ?? null},
           ${ingredients ? JSON.stringify(ingredients) : null},
           ${loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString()})
        returning *
      `;
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/meals failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const {
      id, name, serving, calories,
      macros = {}, other = {}, ingredients,
      healthScore, fact, tips, mismatch, mealType, loggedAt,
    } = req.body || {};

    if (!id) return res.status(400).json({ error: 'id is required' });
    if (!name || typeof calories !== 'number') {
      return res.status(400).json({ error: 'name and calories are required' });
    }
    if (!loggedAt) {
      return res.status(400).json({ error: 'loggedAt is required (send the existing value if unchanged)' });
    }

    try {
      const { rows } = await sql`
        update meal_logs set
          name         = ${name},
          serving      = ${serving ?? null},
          calories     = ${calories},
          carbs_g      = ${macros.carbs ?? null},
          protein_g    = ${macros.protein ?? null},
          fat_g        = ${macros.fat ?? null},
          fiber_g      = ${other.fiber ?? null},
          sugar_g      = ${other.sugar ?? null},
          sodium_mg    = ${other.sodium ?? null},
          health_score = ${healthScore ?? null},
          fact         = ${fact ?? null},
          tips         = ${JSON.stringify(tips ?? [])},
          mismatch     = ${!!mismatch},
          meal_type    = ${mealType ?? null},
          ingredients  = ${ingredients ? JSON.stringify(ingredients) : null},
          created_at   = ${new Date(loggedAt).toISOString()}
        where id = ${id}
        returning *
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Meal not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/meals failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      await sql`delete from meal_logs where id = ${id}`;
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/meals failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
