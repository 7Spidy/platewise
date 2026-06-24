import { sql } from '@vercel/postgres';
import { hashPassword, createSessionCookie } from './lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(400).json({ error: 'token is required' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  if (req.method === 'GET') {
    const { rows } = await sql`
      select id from password_reset_tokens
      where token_hash = ${tokenHash} and used_at is null and expires_at > now()
      limit 1
    `;
    if (!rows[0]) return res.status(400).json({ error: 'Token invalid or expired' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    const { password } = req.body || {};
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    try {
      const { rows } = await sql`
        select id, user_id from password_reset_tokens
        where token_hash = ${tokenHash} and used_at is null and expires_at > now()
        limit 1
      `;
      if (!rows[0]) return res.status(400).json({ error: 'Token invalid or expired' });
      const passwordHash = await hashPassword(password);
      await sql`update users set password_hash = ${passwordHash} where id = ${rows[0].user_id}`;
      await sql`update password_reset_tokens set used_at = now() where id = ${rows[0].id}`;
      const { rows: userRows } = await sql`select id, role, onboarding_completed_at from users where id = ${rows[0].user_id}`;
      const user = userRows[0];
      res.setHeader('Set-Cookie', createSessionCookie({ sub: user.id, role: user.role }));
      return res.status(200).json({ ok: true, role: user.role, onboardingDone: !!user.onboarding_completed_at });
    } catch (err) {
      console.error('POST /api/auth-reset-password failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
