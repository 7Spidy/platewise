import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';

export default function PWLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'passcode'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = mode === 'passcode'
        ? { passcode }
        : { email, password };
      const r = await fetch('/api/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Login failed');
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

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: T.font,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380, boxShadow: T.shadow,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: T.heading, fontSize: 28, fontWeight: 700, color: T.ink, letterSpacing: '-0.5px' }}>
            Platewise
          </div>
          <div style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>Sign in to your account</div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: T.bg, borderRadius: 10, padding: 3,
          marginBottom: 20, gap: 3,
        }}>
          {['email', 'passcode'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 8,
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? T.ink : T.inkMute,
                fontWeight: mode === m ? 600 : 400,
                fontSize: 13, cursor: 'pointer', fontFamily: T.font,
                boxShadow: mode === m ? T.shadowSoft : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'email' ? 'Email' : 'Passcode'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'email' ? (
            <>
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
                  style={inputStyle(T)}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft }}>Password</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{ background: 'none', border: 'none', fontSize: 12, color: T.green, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={inputStyle(T)}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, display: 'block', marginBottom: 5 }}>
                Admin Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                autoComplete="off"
                placeholder="Enter passcode"
                style={inputStyle(T)}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: T.red50, border: `1px solid ${T.red}`,
              borderRadius: 8, padding: '9px 12px',
              color: T.red, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: T.green, color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 0', fontSize: 14,
              fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              fontFamily: T.font, opacity: loading ? 0.7 : 1, marginTop: 4,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: T.inkMute }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: T.green, cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}
          >
            Join waitlist
          </button>
        </div>
      </div>
    </div>
  );
}

function inputStyle(T) {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 9,
    border: `1.5px solid ${T.line}`,
    background: T.bg, fontSize: 14, fontFamily: T.font, color: T.ink,
    outline: 'none',
  };
}
