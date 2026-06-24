import { sql } from '@vercel/postgres';
import {
  verifyPassword, hashPassword, createSessionCookie,
  generateToken,
} from '../../lib/auth.js';
import { sendInviteEmail, sendResetEmail } from '../../lib/mailer.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const slug = Array.isArray(req.query.slug) ? req.query.slug : (req.query.slug ? [req.query.slug] : []);
  const [route, token] = slug;
  console.log('DEBUG public route:', { method: req.method, url: req.url, query: req.query, slug, route });

  // POST /api/public/login
  if (route === 'login' && req.method === 'POST') {
    const { email, password, passcode } = req.body || {};

    if (passcode) {
      const expected = process.env.ADMIN_PASSCODE;
      if (!expected || passcode !== expected) {
        return res.status(401).json({ error: 'Incorrect passcode' });
      }
      try {
        const { rows } = await sql`select id, role from users where email = 'avi.bangera2@gmail.com' limit 1`;
        if (!rows[0]) return res.status(500).json({ error: 'Admin account not found' });
        res.setHeader('Set-Cookie', createSessionCookie({ sub: rows[0].id, role: rows[0].role }));
        return res.status(200).json({ ok: true, role: rows[0].role });
      } catch (err) {
        console.error('POST /api/public/login (passcode) failed:', err);
        return res.status(500).json({ error: 'Something went wrong' });
      }
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
      console.error('POST /api/public/login failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/public/waitlist
  if (route === 'waitlist' && req.method === 'POST') {
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const normalized = email.toLowerCase().trim();
    try {
      const { rows: existing } = await sql`select status from waitlist where email = ${normalized}`;
      if (existing.length > 0) {
        return res.status(200).json({ ok: true, alreadyOnList: true });
      }
      await sql`insert into waitlist (email) values (${normalized})`;
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('POST /api/public/waitlist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/public/forgot-password
  if (route === 'forgot-password' && req.method === 'POST') {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    try {
      const { rows } = await sql`select id from users where email = ${email.toLowerCase().trim()} limit 1`;
      if (rows[0]) {
        const { raw, hash } = generateToken();
        const expires = new Date(Date.now() + 30 * 60 * 1000);
        await sql`
          insert into password_reset_tokens (user_id, token_hash, expires_at)
          values (${rows[0].id}, ${hash}, ${expires.toISOString()})
        `;
        const url = `${process.env.APP_BASE_URL}/reset-password/${raw}`;
        await sendResetEmail(email.toLowerCase().trim(), url).catch(console.error);
      }
    } catch (err) {
      console.error('POST /api/public/forgot-password failed:', err);
    }
    return res.status(200).json({ ok: true });
  }

  // GET /api/public/reset-password/:token — validate token
  if (route === 'reset-password' && req.method === 'GET') {
    if (!token) return res.status(400).json({ error: 'token is required' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const { rows } = await sql`
        select id from password_reset_tokens
        where token_hash = ${tokenHash} and used_at is null and expires_at > now()
        limit 1
      `;
      if (!rows[0]) return res.status(400).json({ error: 'Token invalid or expired' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('GET /api/public/reset-password failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/public/reset-password/:token — set new password
  if (route === 'reset-password' && req.method === 'POST') {
    if (!token) return res.status(400).json({ error: 'token is required' });
    const { password } = req.body || {};
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
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
      const { rows: userRows } = await sql`
        select id, role, onboarding_completed_at from users where id = ${rows[0].user_id}
      `;
      const user = userRows[0];
      res.setHeader('Set-Cookie', createSessionCookie({ sub: user.id, role: user.role }));
      return res.status(200).json({ ok: true, role: user.role, onboardingDone: !!user.onboarding_completed_at });
    } catch (err) {
      console.error('POST /api/public/reset-password failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/public/invite/:token — validate invite, return email
  if (route === 'invite' && req.method === 'GET') {
    if (!token) return res.status(400).json({ error: 'token is required' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const { rows } = await sql`
        select email from invite_tokens
        where token_hash = ${tokenHash} and used_at is null and expires_at > now()
        limit 1
      `;
      if (!rows[0]) return res.status(400).json({ error: 'Invite link invalid or expired' });
      return res.status(200).json({ email: rows[0].email });
    } catch (err) {
      console.error('GET /api/public/invite failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/public/invite/:token — accept invite, create user
  if (route === 'invite' && req.method === 'POST') {
    if (!token) return res.status(400).json({ error: 'token is required' });
    const { password, name } = req.body || {};
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
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
      await sql`
        insert into user_settings (user_id) values (${user.id})
        on conflict (user_id) do nothing
      `;
      await sql`update invite_tokens set used_at = now() where id = ${tokenRows[0].id}`;
      res.setHeader('Set-Cookie', createSessionCookie({ sub: user.id, role: user.role }));
      return res.status(201).json({ ok: true, role: user.role, onboardingDone: false });
    } catch (err) {
      console.error('POST /api/public/invite failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
