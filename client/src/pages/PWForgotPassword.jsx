import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';

export default function PWForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        setSent(true);
      } else {
        const data = await r.json();
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: T.font,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380, boxShadow: T.shadow,
      }}>
        <button
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', color: T.green, cursor: 'pointer', fontSize: 13, padding: '0 0 16px', fontFamily: T.font }}
        >
          ← Back to sign in
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px', marginBottom: 6 }}>
            Forgot password
          </div>
          <div style={{ fontSize: 13, color: T.inkMute, lineHeight: 1.6 }}>
            Enter your email and we'll send a reset link valid for 30 minutes.
          </div>
        </div>

        {sent ? (
          <div style={{
            background: T.sageSoft, border: `1px solid ${T.sage}`, borderRadius: 12,
            padding: '16px 18px', color: T.sage, fontSize: 14, lineHeight: 1.6,
          }}>
            If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly. Check your spam folder too.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, display: 'block', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', borderRadius: 9,
                  border: `1.5px solid ${T.line}`,
                  background: T.bg, fontSize: 14, fontFamily: T.font, color: T.ink, outline: 'none',
                }}
              />
            </div>
            {error && (
              <div style={{ background: T.red50, border: `1px solid ${T.red}`, borderRadius: 8, padding: '9px 12px', color: T.red, fontSize: 13 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: T.green, color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 0', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'default' : 'pointer', fontFamily: T.font,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
