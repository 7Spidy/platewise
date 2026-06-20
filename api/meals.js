// api/meals.js
import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { uploadMealPhoto } from '../lib/blob.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { rows } = await sql`
      select id, created_at, name, serving, calories, carbs_g, protein_g, fat_g,
             fiber_g, sugar_g, sodium_mg, health_score, fact, tips, mismatch, photo_url, meal_type
      from meal_logs
      order by created_at desc
      limit 200
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const {
      name, serving, calories,
      macros = {}, other = {},
      healthScore, fact, tips, mismatch, mealType,
      imageBase64, mimeType,
    } = req.body || {};

    if (!name || typeof calories !== 'number') {
      return res.status(400).json({ error: 'name and calories are required' });
    }

    let photoUrl = null;
    if (imageBase64) {
      try {
        photoUrl = await uploadMealPhoto(imageBase64, mimeType || 'image/jpeg');
      } catch (err) {
        // Don't block the save just because the photo upload failed
        console.error('Blob upload failed:', err);
      }
    }

    const { rows } = await sql`
      insert into meal_logs
        (name, serving, calories, carbs_g, protein_g, fat_g, fiber_g, sugar_g, sodium_mg,
         health_score, fact, tips, mismatch, photo_url, meal_type)
      values
        (${name}, ${serving ?? null}, ${calories},
         ${macros.carbs ?? null}, ${macros.protein ?? null}, ${macros.fat ?? null},
         ${other.fiber ?? null}, ${other.sugar ?? null}, ${other.sodium ?? null},
         ${healthScore ?? null}, ${fact ?? null}, ${JSON.stringify(tips ?? [])},
         ${!!mismatch}, ${photoUrl}, ${mealType ?? null})
      returning *
    `;

    return res.status(201).json(rows[0]);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
