import { sql } from '@vercel/postgres';
import { requireAuth } from './lib/auth.js';
import { windowStart, calcLimit, calcRemaining, isBlocked, calcNextAvailable } from './lib/scanLimit.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { rows: userRows } = await sql`select bonus_scans from users where id = ${req.user.id}`;
    const user = userRows[0] ?? { bonus_scans: 0 };
    const ws = windowStart();
    const { rows: usageRows } = await sql`
      select count(*) as count, min(created_at) as oldest
      from api_usage
      where user_id = ${req.user.id} and created_at >= ${ws.toISOString()}
    `;
    const usageCount = Number(usageRows[0]?.count ?? 0);
    const oldest = usageRows[0]?.oldest;
    const limit = calcLimit(user);
    const remaining = calcRemaining(user, usageCount);
    const blocked = isBlocked(user, usageCount);
    const nextAvailableAt = blocked ? calcNextAvailable(oldest) : null;
    return res.status(200).json({ limit, remaining, blocked, nextAvailableAt });
  } catch (err) {
    console.error('GET /api/scan-remaining failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
