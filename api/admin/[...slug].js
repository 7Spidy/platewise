import { sql } from '@vercel/postgres';
import { requireAdmin, generateToken } from '../../lib/auth.js';
import { sendInviteEmail } from '../../lib/mailer.js';

export default async function handler(req, res) {
  const rawSlug = req.query.slug ?? req.query['...slug'];
  const slug = Array.isArray(rawSlug) ? rawSlug : (rawSlug ? [rawSlug] : []);
  const [route] = slug;

  if (!requireAdmin(req, res)) return;

  // GET /api/admin/users
  if (route === 'users' && req.method === 'GET') {
    try {
      const { rows } = await sql`
        select
          u.id, u.email, u.name, u.role, u.bonus_scans, u.created_at, u.last_active_at,
          s.calorie_target,
          coalesce(
            (select count(*) from api_usage a where a.user_id = u.id and a.created_at >= now() - interval '30 days'),
            0
          ) as scans_30d,
          coalesce(
            (select sum(a.cost_inr) from api_usage a where a.user_id = u.id and a.created_at >= now() - interval '30 days'),
            0
          ) as cost_inr_30d,
          coalesce(
            (select sum(a.cost_inr) from api_usage a where a.user_id = u.id),
            0
          ) as cost_inr_lifetime
        from users u
        left join user_settings s on s.user_id = u.id
        order by u.created_at asc
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/admin/users failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/admin/grant-scans
  if (route === 'grant-scans' && req.method === 'POST') {
    const { userId, amount } = req.body || {};
    if (!userId || !amount || typeof amount !== 'number' || amount < 1) {
      return res.status(400).json({ error: 'userId and positive numeric amount are required' });
    }
    try {
      const { rows } = await sql`
        update users set bonus_scans = bonus_scans + ${amount} where id = ${userId} returning bonus_scans
      `;
      if (!rows[0]) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ ok: true, bonus_scans: rows[0].bonus_scans });
    } catch (err) {
      console.error('POST /api/admin/grant-scans failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/admin/usage-trend
  if (route === 'usage-trend' && req.method === 'GET') {
    try {
      const { rows } = await sql`
        select
          (created_at + interval '5 hours 30 minutes')::date::text as date,
          count(*) as scans
        from api_usage
        where created_at >= now() - interval '14 days'
        group by 1
        order by 1 asc
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/admin/usage-trend failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/admin/waitlist
  if (route === 'waitlist' && req.method === 'GET') {
    try {
      const { rows } = await sql`select * from waitlist order by created_at desc`;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/admin/waitlist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/admin/waitlist — approve or reject
  if (route === 'waitlist' && req.method === 'POST') {
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
        const emailResult = await sendInviteEmail(rows[0].email, url).catch((err) => {
          console.error('sendInviteEmail failed:', err);
          return { error: true, message: err?.message || 'Email send failed' };
        });
        if (emailResult?.error) {
          return res.status(200).json({ ok: true, emailSent: false, emailError: emailResult.message });
        }
      }
      return res.status(200).json({ ok: true, emailSent: true });
    } catch (err) {
      console.error('POST /api/admin/waitlist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // POST /api/admin/whitelist — direct invite by email
  if (route === 'whitelist' && req.method === 'POST') {
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
      const emailResult = await sendInviteEmail(normalized, url).catch((err) => {
        console.error('sendInviteEmail failed:', err);
        return { error: true, message: err?.message || 'Email send failed' };
      });
      return res.status(201).json({ ok: true, emailSent: !emailResult?.error, ...(emailResult?.error && { emailError: emailResult.message }) });
    } catch (err) {
      console.error('POST /api/admin/whitelist failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // GET /api/admin/feedback
  if (route === 'feedback' && req.method === 'GET') {
    try {
      const { rows } = await sql`
        select f.id, f.type, f.message, f.created_at, f.meal_log_id,
               u.email, u.name,
               m.name as meal_name
        from feedback f
        join users u on u.id = f.user_id
        left join meal_logs m on m.id = f.meal_log_id
        order by f.created_at desc
        limit 100
      `;
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/admin/feedback failed:', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
