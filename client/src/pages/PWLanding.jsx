import React, { useState } from 'react';
import { T } from '../tokens.jsx';

const FEATURES = [
  { icon: '📸', title: 'Photo + text scanning', desc: 'Snap a photo or describe what you ate — Claude vision breaks it into ingredients with calories and macros.' },
  { icon: '📊', title: 'Daily tracking', desc: 'Rings, charts, and a daily log so you always know where you stand against your targets.' },
  { icon: '🧮', title: 'Smart targets', desc: 'Enter your stats and Platewise calculates your personalised calorie and macro targets.' },
  { icon: '📚', title: 'Meal library', desc: 'Save favourite meals and ingredients for one-tap logging on repeat days.' },
];

export default function PWLanding({ onGoLogin }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | alreadyOnList
  const [errorMsg, setErrorMsg] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const r = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Something went wrong');
        return;
      }
      setStatus(data.alreadyOnList ? 'alreadyOnList' : 'success');
    } catch {
      setStatus('error');
      setErrorMsg('Network error, please try again');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, background: T.bg,
        borderBottom: `1px solid ${T.line}`, zIndex: 10,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 960, margin: '0 auto',
      }}>
        <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 20, color: T.ink, letterSpacing: '-0.5px' }}>
          Platewise
        </div>
        <button
          onClick={onGoLogin}
          style={{
            background: T.green, color: '#fff', border: 'none', borderRadius: 999,
            padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
          }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 960, margin: '0 auto', padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: T.greenSoft, color: T.green,
          borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 600,
          marginBottom: 24, letterSpacing: '0.02em',
        }}>
          Beta — invite only
        </div>
        <h1 style={{
          fontFamily: T.heading, fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 700, color: T.ink, marginBottom: 20,
          lineHeight: 1.15, letterSpacing: '-1px',
        }}>
          Know exactly what<br />you're eating
        </h1>
        <p style={{
          fontSize: 18, color: T.inkSoft, lineHeight: 1.7,
          maxWidth: 480, margin: '0 auto 40px',
        }}>
          Platewise uses Claude AI to analyse your meals from a photo or description — giving you instant calories, macros, and healthier swap suggestions.
        </p>

        {/* Waitlist form */}
        {status === 'success' ? (
          <div style={{
            background: T.sageSoft, border: `1px solid ${T.sage}`, borderRadius: 14,
            padding: '16px 24px', maxWidth: 420, margin: '0 auto',
            color: T.sage, fontSize: 14, fontWeight: 600,
          }}>
            You're on the waitlist! We'll email you when a spot opens.
          </div>
        ) : status === 'alreadyOnList' ? (
          <div style={{
            background: T.blue50, border: `1px solid ${T.blue}`, borderRadius: 14,
            padding: '16px 24px', maxWidth: 420, margin: '0 auto',
            color: T.blue, fontSize: 14, fontWeight: 600,
          }}>
            You're already on the waitlist. We'll be in touch!
          </div>
        ) : (
          <form onSubmit={handleJoin} style={{
            display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                flex: 1, minWidth: 200,
                padding: '12px 16px', borderRadius: 10,
                border: `1.5px solid ${status === 'error' ? T.red : T.line}`,
                background: '#fff', fontSize: 14, fontFamily: T.font,
                color: T.ink, outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: T.green, color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 22px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: T.font, opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? 'Joining…' : 'Join waitlist'}
            </button>
            {status === 'error' && (
              <div style={{ width: '100%', textAlign: 'center', color: T.red, fontSize: 13, marginTop: 4 }}>
                {errorMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: '#fff', border: `1px solid ${T.line}`,
              borderRadius: 16, padding: '22px 20px',
              boxShadow: T.shadowSoft,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.line}`, padding: '20px 24px',
        textAlign: 'center', fontSize: 12, color: T.inkFaint,
      }}>
        Platewise — personal nutrition tracking powered by Claude AI
      </div>
    </div>
  );
}
