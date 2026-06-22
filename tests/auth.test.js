import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Set before any test runs — auth.js reads the env var lazily (inside functions)
process.env.SESSION_SECRET = 'test-secret-for-unit-tests-only';

import { createSessionCookie, isAuthenticated } from '../lib/auth.js';

const COOKIE_NAME = 'pw_session';

function makeFakeReq(tokenValue) {
  return { headers: { cookie: `${COOKIE_NAME}=${tokenValue}` } };
}

function sign(value) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex');
}

function extractToken(setCookieHeader) {
  const match = setCookieHeader.match(/pw_session=([^;]+)/);
  return match ? match[1] : null;
}

describe('auth', () => {
  it('isAuthenticated returns true for a valid session cookie', () => {
    const token = extractToken(createSessionCookie());
    expect(isAuthenticated(makeFakeReq(token))).toBe(true);
  });

  it('isAuthenticated returns false for a tampered signature', () => {
    const token = extractToken(createSessionCookie());
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    expect(isAuthenticated(makeFakeReq(tampered))).toBe(false);
  });

  it('isAuthenticated returns false for an expired token', () => {
    const pastExpiry = `${Date.now() - 1000}`;
    const expiredToken = `${pastExpiry}.${sign(pastExpiry)}`;
    expect(isAuthenticated(makeFakeReq(expiredToken))).toBe(false);
  });
});
