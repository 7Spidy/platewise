import { sql } from '@vercel/postgres';
import { requireAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, amount } = req.body || {};
  if (!userId || !amount || typeof amount !== 'number' || amount < 1) {
    return res.status(400).json({ error: 'userId and positive numeric amount are required' });
  }
  try {
    const { rows } = await sql`
      update users set bonus_scans = bonus_scans + ${amount} where id = ${userId} returning bonus_scans
    `;
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ ok: true, bonus_scans: rows[0].bonus_scans });
  } catch (err) {
    console.error('POST /api/admin/grant-scans failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
