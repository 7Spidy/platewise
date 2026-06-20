// lib/auth.js
// Single shared app-level passcode, no per-user accounts, no session table.
// The cookie is a signed, stateless token: `${expiryTimestamp}.${hmacSignature}`.
// Verifying it again just means re-computing the HMAC — nothing to look up in a DB.

import crypto from 'crypto';

const COOKIE_NAME = 'pw_session';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function isProd() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function createSessionCookie() {
  const expires = Date.now() + ONE_YEAR_SECONDS * 1000;
  const payload = `${expires}`;
  const token = `${payload}.${sign(payload)}`;
  const secureFlag = isProd() ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=${ONE_YEAR_SECONDS}`;
}

export function clearSessionCookie() {
  const secureFlag = isProd() ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (sign(payload) !== sig) return false;        // tampered or signed with a different secret
  if (Number(payload) < Date.now()) return false; // expired

  return true;
}

// Drop this in as the first line of any protected handler:
//   if (!requireAuth(req, res)) return;
export function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}
