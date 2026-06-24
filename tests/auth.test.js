import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Set before importing auth — functions read env lazily
process.env.SESSION_SECRET = 'test-secret-for-unit-tests-only-32chars!!';

import {
  hashPassword, verifyPassword,
  signSession, verifySession,
  generateToken, createSessionCookie,
} from '../lib/auth.js';

describe('password hashing', () => {
  it('hash and verify round-trip', async () => {
    const hash = await hashPassword('correctPassword123');
    expect(await verifyPassword('correctPassword123', hash)).toBe(true);
  });

  it('wrong password returns false', async () => {
    const hash = await hashPassword('correctPassword123');
    expect(await verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('hashes are different each call (salted)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('session sign/verify', () => {
  const payload = { sub: 'user-uuid-1234', role: 'user', exp: Date.now() + 60_000 };

  it('round-trip: sign then verify returns original payload', () => {
    const token = signSession(payload);
    const decoded = verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });

  it('tampered byte in signature fails verification', () => {
    const token = signSession(payload);
    const dot = token.lastIndexOf('.');
    const sig = token.slice(dot + 1);
    const flipped = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a');
    const tampered = token.slice(0, dot + 1) + flipped;
    expect(verifySession(tampered)).toBeNull();
  });

  it('tampered payload fails verification', () => {
    const token = signSession(payload);
    const dot = token.lastIndexOf('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker', role: 'admin', exp: payload.exp }))
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const tampered = fakePayload + token.slice(dot);
    expect(verifySession(tampered)).toBeNull();
  });

  it('expired token returns null', () => {
    const expiredPayload = { sub: 'user-1', role: 'user', exp: Date.now() - 1000 };
    const token = signSession(expiredPayload);
    expect(verifySession(token)).toBeNull();
  });

  it('null/undefined/empty input returns null', () => {
    expect(verifySession(null)).toBeNull();
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession('')).toBeNull();
  });
});

describe('generateToken', () => {
  it('returns raw and hash strings', () => {
    const { raw, hash } = generateToken();
    expect(typeof raw).toBe('string');
    expect(typeof hash).toBe('string');
    expect(raw.length).toBe(64); // 32 bytes hex
    expect(hash.length).toBe(64); // sha256 hex
  });

  it('raw and hash are different', () => {
    const { raw, hash } = generateToken();
    expect(raw).not.toBe(hash);
  });

  it('hash of different raw does not match first hash', () => {
    const { hash: hash1 } = generateToken();
    const { raw: raw2 } = generateToken();
    const hash2 = crypto.createHash('sha256').update(raw2).digest('hex');
    expect(hash2).not.toBe(hash1);
  });

  it('each call produces a unique raw token', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1.raw).not.toBe(t2.raw);
  });
});

describe('createSessionCookie', () => {
  it('includes HttpOnly and SameSite=Lax', () => {
    const cookie = createSessionCookie({ sub: 'uid', role: 'user' });
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('cookie value verifies successfully', () => {
    const cookie = createSessionCookie({ sub: 'uid-abc', role: 'admin' });
    const match = cookie.match(/pw_session=([^;]+)/);
    const value = match[1];
    const decoded = verifySession(value);
    expect(decoded).not.toBeNull();
    expect(decoded.sub).toBe('uid-abc');
    expect(decoded.role).toBe('admin');
  });
});
