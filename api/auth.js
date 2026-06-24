// api/auth.js — legacy compatibility endpoint
// GET: check if session cookie is valid (used by App.jsx on load)
// POST: legacy passcode login (redirects to new auth-login logic)
import { verifySession, clearSessionCookie, createSessionCookie } from './lib/auth.js';
import { sql } from '@vercel/postgres';

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (k) acc[k.trim()] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const cookies = parseCookies(req.headers.cookie || '');
    const payload = verifySession(cookies['pw_session']);
    return res.status(200).json({ authenticated: !!payload });
  }

  if (req.method === 'POST') {
    const { passcode, logout } = req.body || {};

    if (logout) {
      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.status(200).json({ ok: true });
    }

    // Legacy passcode login — delegates to admin user
    const expected = process.env.APP_PASSCODE || process.env.ADMIN_PASSCODE;
    if (!expected) {
      return res.status(500).json({ error: 'Passcode is not configured' });
    }
    if (typeof passcode !== 'string' || passcode !== expected) {
      return res.status(401).json({ error: 'Incorrect passcode' });
    }

    try {
      const { rows } = await sql`select id, role from users where email = 'avi.bangera2@gmail.com' limit 1`;
      if (rows[0]) {
        res.setHeader('Set-Cookie', createSessionCookie({ sub: rows[0].id, role: rows[0].role }));
      } else {
        // Fallback: set a minimal session without user id (won't work with new user-scoped queries)
        res.setHeader('Set-Cookie', createSessionCookie({ sub: 'legacy', role: 'admin' }));
      }
    } catch {
      res.setHeader('Set-Cookie', createSessionCookie({ sub: 'legacy', role: 'admin' }));
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
