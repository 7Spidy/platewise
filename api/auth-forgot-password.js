import { sql } from '@vercel/postgres';
import { generateToken } from './lib/auth.js';
import { sendResetEmail } from './lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  // Always return success to avoid email enumeration
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
    console.error('POST /api/auth-forgot-password failed:', err);
  }
  return res.status(200).json({ ok: true });
}
