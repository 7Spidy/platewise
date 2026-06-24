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
        (created_at + interval '5 hours 30 minutes')::date::text as date,
        count(*) as scans
      from api_usage
      where created_at >= now() - interval '14 days'
      group by 1
      order by 1 asc
    `;
    return res.status(200).json(rows);
  } catch (err) {
    console.error('GET /api/admin/usage-trend failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
