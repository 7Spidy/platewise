import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
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
    const { rows: existing } = await sql`select status from waitlist where email = ${normalized}`;
    if (existing.length > 0) {
      return res.status(200).json({ ok: true, alreadyOnList: true });
    }
    await sql`insert into waitlist (email) values (${normalized})`;
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/waitlist failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
