import { sql } from '@vercel/postgres';
import { verifyPassword, createSessionCookie } from './lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, password, passcode } = req.body || {};

  // Legacy admin passcode backdoor
  if (passcode) {
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected || passcode !== expected) {
      return res.status(401).json({ error: 'Incorrect passcode' });
    }
    const { rows } = await sql`select id, role from users where email = 'avi.bangera2@gmail.com' limit 1`;
    if (!rows[0]) return res.status(500).json({ error: 'Admin account not found' });
    res.setHeader('Set-Cookie', createSessionCookie({ sub: rows[0].id, role: rows[0].role }));
    return res.status(200).json({ ok: true, role: rows[0].role });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const { rows } = await sql`
      select id, role, password_hash, onboarding_completed_at
      from users where email = ${email.toLowerCase().trim()} limit 1
    `;
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    await sql`update users set last_active_at = now() where id = ${user.id}`;
    res.setHeader('Set-Cookie', createSessionCookie({ sub: user.id, role: user.role }));
    return res.status(200).json({
      ok: true,
      role: user.role,
      onboardingDone: !!user.onboarding_completed_at,
    });
  } catch (err) {
    console.error('POST /api/auth-login failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
