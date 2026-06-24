// api/lib/auth.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'pw_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function isProd() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signSession(payload) {
  const encoded = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = crypto.createHmac('sha256', getSecret()).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

export function verifySession(cookieValue) {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot === -1) return null;
  const encoded = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('hex');
  // Pad both sides to same length to avoid timing attacks on length comparison
  const sigBuf = Buffer.from(sig.padEnd(64, '0'), 'hex');
  const expBuf = Buffer.from(expected.padEnd(64, '0'), 'hex');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  if (sig !== expected) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64').toString());
  } catch {
    return null;
  }
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function generateToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (k) acc[k.trim()] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function createSessionCookie(payload) {
  const full = { ...payload, exp: Date.now() + SESSION_DURATION_MS };
  const value = signSession(full);
  const secureFlag = isProd() ? '; Secure' : '';
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return `${COOKIE_NAME}=${value}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  const secureFlag = isProd() ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=0`;
}

export function requireAuth(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const payload = verifySession(cookies[COOKIE_NAME]);
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  req.user = { id: payload.sub, role: payload.role };
  return true;
}

export function requireAdmin(req, res) {
  if (!requireAuth(req, res)) return false;
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return false;
  }
  return true;
}
