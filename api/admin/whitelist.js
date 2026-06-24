import { sql } from '@vercel/postgres';
import { requireAdmin, generateToken } from '../lib/auth.js';
import { sendInviteEmail } from '../lib/mailer.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const normalized = email.toLowerCase().trim();
  try {
    const { raw, hash } = generateToken();
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await sql`insert into invite_tokens (email, token_hash, expires_at) values (${normalized}, ${hash}, ${expires.toISOString()})`;
    const url = `${process.env.APP_BASE_URL}/invite/${raw}`;
    await sendInviteEmail(normalized, url).catch(console.error);
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/whitelist failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
