import { sql } from '@vercel/postgres';
import { hashPassword, createSessionCookie } from './lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(400).json({ error: 'token is required' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  if (req.method === 'GET') {
    const { rows } = await sql`
      select email from invite_tokens
      where token_hash = ${tokenHash} and used_at is null and expires_at > now()
      limit 1
    `;
    if (!rows[0]) return res.status(400).json({ error: 'Invite link invalid or expired' });
    return res.status(200).json({ email: rows[0].email });
  }

  if (req.method === 'POST') {
    const { password, name } = req.body || {};
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    try {
      const { rows: tokenRows } = await sql`
        select id, email from invite_tokens
        where token_hash = ${tokenHash} and used_at is null and expires_at > now()
        limit 1
      `;
      if (!tokenRows[0]) return res.status(400).json({ error: 'Invite link invalid or expired' });
      const { email } = tokenRows[0];
      const passwordHash = await hashPassword(password);
      const { rows: userRows } = await sql`
        insert into users (email, password_hash, name, role)
        values (${email}, ${passwordHash}, ${name ?? null}, 'user')
        returning id, role
      `;
      const user = userRows[0];
      // Insert default user_settings
      await sql`
        insert into user_settings (user_id) values (${user.id})
        on conflict (user_id) do nothing
      `;
      await sql`update invite_tokens set used_at = now() where id = ${tokenRows[0].id}`;
      res.setHeader('Set-Cookie', createSessionCookie({ sub: user.id, role: user.role }));
      return res.status(201).json({ ok: true, role: user.role, onboardingDone: false });
    } catch (err) {
      console.error('POST /api/invite failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
