import { sql } from '@vercel/postgres';
import { requireAuth, requireAdmin } from './lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    try {
      const { rows } = await sql`
        select f.id, f.type, f.message, f.created_at, f.meal_log_id,
               u.email, u.name,
               m.name as meal_name
        from feedback f
        join users u on u.id = f.user_id
        left join meal_logs m on m.id = f.meal_log_id
        order by f.created_at desc
        limit 100
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/feedback failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  if (req.method === 'POST') {
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
      console.error('POST /api/feedback failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
