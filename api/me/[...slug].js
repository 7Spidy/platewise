import { sql } from '@vercel/postgres';
import {
  requireAuth, clearSessionCookie,
} from '../../lib/auth.js';

function toTargetsShape(row) {
  return {
    target_calories: row.calorie_target,
    target_protein_g: row.macro_protein_g,
    target_carbs_g: row.macro_carbs_g,
    target_fat_g: row.macro_fat_g,
    manually_edited: row.manually_edited,
    name: row.name,
  };
}
import { calcTarget, inchesToCm, lbsToKg } from '../../lib/calorie.js';
import { windowStart, calcLimit, calcRemaining, isBlocked, calcNextAvailable } from '../../lib/scanLimit.js';
import { validateTargets } from '../../lib/settings.js';

export default async function handler(req, res) {
  const rawSlug = req.query.slug ?? req.query['...slug'];
  const slug = Array.isArray(rawSlug) ? rawSlug : (rawSlug ? [rawSlug] : []);
  const [route] = slug;

  // GET /api/me/session — return current user info
  if (route === 'session' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows } = await sql`
        select id, email, name, role, onboarding_completed_at, bonus_scans
        from users where id = ${req.user.id} limit 1
      `;
      if (!rows[0]) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('GET /api/me/session failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/me/logout
  if (route === 'logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }

  // POST /api/me/onboarding
  if (route === 'onboarding' && req.method === 'POST') {
    if (!requireAuth(req, res)) return;
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
      console.error('POST /api/me/onboarding failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/me/profile
  if (route === 'profile' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
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
      console.error('GET /api/me/profile failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // PATCH /api/me/profile
  if (route === 'profile' && req.method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    const { name, gender, age, height, weight, unit_pref, activity_level, goal, calories, carbs_g, protein_g, fat_g, manualEdit } = req.body || {};
    try {
      if (manualEdit) {
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
      console.error('PATCH /api/me/profile failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/me/settings
  if (route === 'settings' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows } = await sql`
        select s.*, u.name
        from users u
        left join user_settings s on s.user_id = u.id
        where u.id = ${req.user.id}
      `;
      if (rows[0]?.calorie_target == null) {
        return res.status(200).json(toTargetsShape({
          calorie_target: 2200,
          macro_protein_g: 180,
          macro_carbs_g: 200,
          macro_fat_g: 70,
          manually_edited: false,
          name: rows[0]?.name,
        }));
      }
      return res.status(200).json(toTargetsShape(rows[0]));
    } catch (err) {
      console.error('GET /api/me/settings failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/me/settings
  if (route === 'settings' && req.method === 'PATCH') {
    if (!requireAuth(req, res)) return;
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
      return res.status(200).json(toTargetsShape(rows[0]));
    } catch (err) {
      console.error('PATCH /api/me/settings failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/me/feedback
  if (route === 'feedback' && req.method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { type, message, meal_log_id } = req.body || {};
    if (!type || !message) return res.status(400).json({ error: 'type and message are required' });
    if (!['scan', 'general'].includes(type)) return res.status(400).json({ error: 'type must be scan or general' });
    try {
      await sql`
        insert into feedback (user_id, type, message, meal_log_id)
        values (${req.user.id}, ${type}, ${message}, ${meal_log_id ?? null})
      `;
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('POST /api/me/feedback failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/me/scan-remaining
  if (route === 'scan-remaining' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows: userRows } = await sql`select bonus_scans from users where id = ${req.user.id}`;
      const user = userRows[0] ?? { bonus_scans: 0 };
      const ws = windowStart();
      const { rows: usageRows } = await sql`
        select count(*) as count, min(created_at) as oldest
        from api_usage
        where user_id = ${req.user.id} and created_at >= ${ws.toISOString()}
      `;
      const usageCount = Number(usageRows[0]?.count ?? 0);
      const oldest = usageRows[0]?.oldest;
      const limit = calcLimit(user);
      const remaining = calcRemaining(user, usageCount);
      const blocked = isBlocked(user, usageCount);
      const nextAvailableAt = blocked ? calcNextAvailable(oldest) : null;
      return res.status(200).json({ limit, remaining, blocked, nextAvailableAt });
    } catch (err) {
      console.error('GET /api/me/scan-remaining failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/me/export
  if (route === 'export' && req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows: userRows } = await sql`select last_export_at from users where id = ${req.user.id}`;
      const lastExportAt = userRows[0]?.last_export_at;
      if (lastExportAt) {
        const lastMs = new Date(lastExportAt).getTime();
        const nowMs = Date.now();
        const sixtyMinMs = 60 * 60 * 1000;
        if (nowMs - lastMs < sixtyMinMs) {
          const nextAvailableAt = new Date(lastMs + sixtyMinMs);
          const minutesRemaining = Math.ceil((nextAvailableAt.getTime() - nowMs) / 60000);
          return res.status(429).json({
            error: 'rate_limited',
            message: `You can export again in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}.`,
            nextAvailableAt: nextAvailableAt.toISOString(),
          });
        }
      }
      const range = ['30', '90', 'all'].includes(req.query.range) ? req.query.range : '90';
      const now = new Date();
      let fromDate = null;
      if (range === '30') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (range === '90') fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const { rows: mealRows } = fromDate
        ? await sql`
            select created_at, name, serving, meal_type, calories, carbs_g, protein_g, fat_g,
                   fiber_g, sugar_g, sodium_mg, health_score, ingredients
            from meal_logs
            where user_id = ${req.user.id} and created_at >= ${fromDate.toISOString()}
            order by created_at asc
          `
        : await sql`
            select created_at, name, serving, meal_type, calories, carbs_g, protein_g, fat_g,
                   fiber_g, sugar_g, sodium_mg, health_score, ingredients
            from meal_logs
            where user_id = ${req.user.id}
            order by created_at asc
          `;
      const meals = mealRows.map((r) => ({
        logged_at: new Date(r.created_at).toISOString(),
        name: r.name,
        serving: r.serving,
        meal_type: r.meal_type,
        calories: r.calories,
        protein_g: r.protein_g,
        carbs_g: r.carbs_g,
        fat_g: r.fat_g,
        fiber_g: r.fiber_g,
        sugar_g: r.sugar_g,
        sodium_mg: r.sodium_mg,
        health_score: r.health_score,
        ingredients: r.ingredients,
      }));
      const payload = {
        app: 'Platewise',
        exported_at: now.toISOString(),
        period: { from: fromDate ? fromDate.toISOString() : null, to: now.toISOString(), range },
        meal_count: meals.length,
        meals,
      };
      await sql`update users set last_export_at = now() where id = ${req.user.id}`;
      const rangeLabel = range === 'all' ? 'all' : `last${range}`;
      const filename = `platewise-export-${rangeLabel}-${now.toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('GET /api/me/export failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
