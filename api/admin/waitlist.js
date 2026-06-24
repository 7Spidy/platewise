import { sql } from '@vercel/postgres';
import { requireAdmin, generateToken } from '../lib/auth.js';
import { sendInviteEmail } from '../lib/mailer.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select * from waitlist order by created_at desc`;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/admin/waitlist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  if (req.method === 'POST') {
    const { id, action } = req.body || {};
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'id and action (approve|reject) are required' });
    }
    try {
      const { rows } = await sql`
        update waitlist set status = ${action === 'approve' ? 'approved' : 'rejected'}, decided_at = now()
        where id = ${id} returning email
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });

      if (action === 'approve') {
        const { raw, hash } = generateToken();
        const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await sql`insert into invite_tokens (email, token_hash, expires_at) values (${rows[0].email}, ${hash}, ${expires.toISOString()})`;
        const url = `${process.env.APP_BASE_URL}/invite/${raw}`;
        await sendInviteEmail(rows[0].email, url).catch(console.error);
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('POST /api/admin/waitlist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
