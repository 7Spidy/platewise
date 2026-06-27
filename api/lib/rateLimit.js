// Serverless is stateless, so this is backed by the login_attempts table, not in-memory state.
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function hashKey(ip, secondary, action) {
  return crypto.createHash('sha256').update(`${ip}:${secondary || ''}:${action}`).digest('hex');
}

// Call BEFORE doing any real work on the route. Returns false if blocked.
export async function checkRateLimit(action, ip, secondary) {
  const key = hashKey(ip, secondary, action);
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const { rows } = await sql`
    select count(*)::int as count from login_attempts
    where identifier_hash = ${key} and created_at > ${windowStart}
  `;
  return rows[0].count < MAX_ATTEMPTS;
}

// Call on a failed/abusive attempt.
export async function recordAttempt(action, ip, secondary) {
  const key = hashKey(ip, secondary, action);
  await sql`insert into login_attempts (identifier_hash, action) values (${key}, ${action})`;
  // Opportunistic cleanup — cheap given low volume on these routes even under attack.
  await sql`delete from login_attempts where created_at < now() - interval '1 day'`;
}

// Call on a successful attempt to un-penalize a legitimate user for earlier typos.
export async function clearAttempts(action, ip, secondary) {
  const key = hashKey(ip, secondary, action);
  await sql`delete from login_attempts where identifier_hash = ${key}`;
}
