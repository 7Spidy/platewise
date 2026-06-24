import { sql } from '@vercel/postgres';
import { requireAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { rows } = await sql`
      select
        u.id, u.email, u.name, u.role, u.bonus_scans, u.created_at, u.last_active_at,
        s.calorie_target,
        coalesce(
          (select count(*) from api_usage a where a.user_id = u.id and a.created_at >= now() - interval '30 days'),
          0
        ) as scans_30d,
        coalesce(
          (select sum(a.cost_inr) from api_usage a where a.user_id = u.id and a.created_at >= now() - interval '30 days'),
          0
        ) as cost_inr_30d,
        coalesce(
          (select sum(a.cost_inr) from api_usage a where a.user_id = u.id),
          0
        ) as cost_inr_lifetime
      from users u
      left join user_settings s on s.user_id = u.id
      order by u.created_at asc
    `;
    return res.status(200).json(rows);
  } catch (err) {
    console.error('GET /api/admin/users failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
