import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';
import { calcTarget, inchesToCm, lbsToKg } from './lib/calorie.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        select u.name, u.gender, u.age, u.height_cm, u.weight_kg, u.unit_pref, u.activity_level, u.goal,
               s.calorie_target, s.macro_carbs_g, s.macro_protein_g, s.macro_fat_g, s.manually_edited
        from users u
        left join user_settings s on s.user_id = u.id
        where u.id = ${req.user.id}
      `;
      return res.status(200).json(rows[0] ?? {});
    } catch (err) {
      console.error('GET /api/profile failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  if (req.method === 'PATCH') {
    const { name, gender, age, height, weight, unit_pref, activity_level, goal, calories, carbs_g, protein_g, fat_g, manualEdit } = req.body || {};
    try {
      if (manualEdit) {
        // User manually edited targets
        await sql`
          update user_settings set
            calorie_target = ${calories}, macro_carbs_g = ${carbs_g},
            macro_protein_g = ${protein_g}, macro_fat_g = ${fat_g},
            manually_edited = true, updated_at = now()
          where user_id = ${req.user.id}
        `;
        return res.status(200).json({ ok: true });
      }

      const height_cm = unit_pref === 'imperial' ? inchesToCm(Number(height)) : Number(height);
      const weight_kg = unit_pref === 'imperial' ? lbsToKg(Number(weight)) : Number(weight);
      const effectiveGoal = goal || 'maintain';
      const target = calcTarget({ gender, age: Number(age), height_cm, weight_kg, activity_level, goal: effectiveGoal });

      await sql`
        update users set
          name = ${name ?? null}, gender = ${gender}, age = ${Number(age)},
          height_cm = ${height_cm}, weight_kg = ${weight_kg},
          unit_pref = ${unit_pref ?? 'metric'}, activity_level = ${activity_level}, goal = ${effectiveGoal}
        where id = ${req.user.id}
      `;

      // Only overwrite if not manually edited
      const { rows: settingsRows } = await sql`select manually_edited from user_settings where user_id = ${req.user.id}`;
      if (!settingsRows[0]?.manually_edited) {
        await sql`
          update user_settings set
            calorie_target = ${target.calories}, macro_carbs_g = ${target.carbs_g},
            macro_protein_g = ${target.protein_g}, macro_fat_g = ${target.fat_g},
            updated_at = now()
          where user_id = ${req.user.id}
        `;
      }
      return res.status(200).json({ ok: true, target, needsRecalc: settingsRows[0]?.manually_edited ?? false });
    } catch (err) {
      console.error('PATCH /api/profile failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
