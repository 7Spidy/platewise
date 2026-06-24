import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';
import { calcTarget, inchesToCm, lbsToKg } from './lib/calorie.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, gender, age, height, weight, unit_pref, activity_level, goal } = req.body || {};

  if (!gender || !age || !height || !weight || !activity_level) {
    return res.status(400).json({ error: 'Missing required fields: gender, age, height, weight, activity_level' });
  }

  const height_cm = unit_pref === 'imperial' ? inchesToCm(Number(height)) : Number(height);
  const weight_kg = unit_pref === 'imperial' ? lbsToKg(Number(weight)) : Number(weight);
  const effectiveGoal = goal || 'maintain';

  const target = calcTarget({ gender, age: Number(age), height_cm, weight_kg, activity_level, goal: effectiveGoal });

  try {
    await sql`
      update users set
        name = ${name ?? null}, gender = ${gender}, age = ${Number(age)},
        height_cm = ${height_cm}, weight_kg = ${weight_kg},
        unit_pref = ${unit_pref ?? 'metric'}, activity_level = ${activity_level},
        goal = ${effectiveGoal}, onboarding_completed_at = now()
      where id = ${req.user.id}
    `;
    await sql`
      insert into user_settings (user_id, calorie_target, macro_carbs_g, macro_protein_g, macro_fat_g, manually_edited)
      values (${req.user.id}, ${target.calories}, ${target.carbs_g}, ${target.protein_g}, ${target.fat_g}, false)
      on conflict (user_id) do update set
        calorie_target = excluded.calorie_target,
        macro_carbs_g = excluded.macro_carbs_g,
        macro_protein_g = excluded.macro_protein_g,
        macro_fat_g = excluded.macro_fat_g,
        manually_edited = false,
        updated_at = now()
    `;
    return res.status(200).json({ ok: true, target, clamped: target.clamped });
  } catch (err) {
    console.error('POST /api/onboarding failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
