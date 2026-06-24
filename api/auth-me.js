import { requireAuth } from './lib/auth.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;
  try {
    const { rows } = await sql`
      select id, email, name, role, onboarding_completed_at, bonus_scans
      from users where id = ${req.user.id} limit 1
    `;
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('GET /api/auth-me failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
