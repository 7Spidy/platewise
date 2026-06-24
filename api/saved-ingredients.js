// api/saved-ingredients.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from saved_ingredients where user_id = ${req.user.id} order by name asc`;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/saved-ingredients failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'POST') {
    const { name, defaultUnit, calories, proteinG, carbsG, fatG, fiberG, sodiumMg, sugarG } = req.body || {};
    if (!name || typeof calories !== 'number') {
      return res.status(400).json({ error: 'name and calories are required' });
    }
    try {
      const { rows } = await sql`
        insert into saved_ingredients
          (user_id, name, default_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g)
        values
          (${req.user.id}, ${name}, ${defaultUnit ?? null}, ${calories},
           ${proteinG ?? 0}, ${carbsG ?? 0}, ${fatG ?? 0},
           ${fiberG ?? 0}, ${sodiumMg ?? 0}, ${sugarG ?? 0})
        returning *
      `;
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/saved-ingredients failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, name, defaultUnit, calories, proteinG, carbsG, fatG, fiberG, sodiumMg, sugarG } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      const { rows } = await sql`
        update saved_ingredients set
          name = ${name}, default_unit = ${defaultUnit ?? null}, calories = ${calories},
          protein_g = ${proteinG ?? 0}, carbs_g = ${carbsG ?? 0}, fat_g = ${fatG ?? 0},
          fiber_g = ${fiberG ?? 0}, sodium_mg = ${sodiumMg ?? 0}, sugar_g = ${sugarG ?? 0}
        where id = ${id} and user_id = ${req.user.id}
        returning *
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/saved-ingredients failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      await sql`delete from saved_ingredients where id = ${id} and user_id = ${req.user.id}`;
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/saved-ingredients failed:', err);
      return res.status(500).json({ error: 'Something went wrong, please try again' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
