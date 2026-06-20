// api/auth.js
import { createSessionCookie, clearSessionCookie, isAuthenticated } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthenticated(req) });
  }

  if (req.method === 'POST') {
    const { passcode, logout } = req.body || {};

    if (logout) {
      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.status(200).json({ ok: true });
    }

    const expected = process.env.APP_PASSCODE;
    if (!expected) {
      return res.status(500).json({ error: 'APP_PASSCODE is not configured' });
    }
    if (typeof passcode !== 'string' || passcode !== expected) {
      return res.status(401).json({ error: 'Incorrect passcode' });
    }

    res.setHeader('Set-Cookie', createSessionCookie());
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
