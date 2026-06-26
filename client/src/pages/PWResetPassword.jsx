import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';

export default function PWResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [valid, setValid] = useState(null); // null=checking, true, false
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/public/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => {
        setValid(r.ok);
      })
      .catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/public/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      if (data.onboardingDone === false) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  if (valid === null) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: T.inkMute, fontSize: 14, fontFamily: T.font }}>Validating link…</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg, fontFamily: T.font,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '32px 28px',
          width: '100%', maxWidth: 380, boxShadow: T.shadow, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
          <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
            Link expired
          </div>
          <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 24 }}>
            This reset link is invalid or has expired. Request a new one.
          </div>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              background: T.green, color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
            }}
          >
            Request new link
          </button>
        </div>
      </div>
    );
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px', marginBottom: 6 }}>
            Set new password
          </div>
          <div style={{ fontSize: 13, color: T.inkMute }}>Must be at least 8 characters.</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, display: 'block', marginBottom: 5 }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputStyle(T)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, display: 'block', marginBottom: 5 }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputStyle(T)}
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
            {loading ? 'Saving…' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function inputStyle(T) {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 9,
    border: `1.5px solid ${T.line}`,
    background: T.bg, fontSize: 14, fontFamily: T.font, color: T.ink, outline: 'none',
  };
}
