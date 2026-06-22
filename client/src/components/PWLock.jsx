// client/src/components/PWLock.jsx
import React, { useState } from 'react';
import { T } from '../tokens.jsx';

const LENGTH = 4;

export default function PWLock({ onUnlock }) {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (passcode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) throw new Error('Incorrect passcode');
      onUnlock();
    } catch (e) {
      setError(e.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const press = (digit) => {
    if (code.length >= LENGTH || loading) return;
    const next = code + digit;
    setCode(next);
    if (next.length === LENGTH) submit(next);
  };

  const backspace = () => {
    setError(null);
    setCode((c) => c.slice(0, -1));
  };

  const keyStyle = {
    aspectRatio: '1',
    borderRadius: 14,
    background: '#FFFFFF',
    border: `1px solid ${T.line}`,
    fontFamily: T.font,
    fontSize: 22,
    fontWeight: 500,
    color: T.ink,
    cursor: 'pointer',
    boxShadow: T.shadowSoft,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      fontFamily: T.font,
      padding: '0 28px',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 68, height: 68,
          background: T.green,
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(196,103,74,0.30)',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="13" r="7" stroke="white" strokeWidth="2.5"/>
            <path d="M11 20c0 4.5 3.1 8 7 8s7-3.5 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M18 28v4M14 32h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{
          fontFamily: T.heading,
          fontSize: 26,
          fontWeight: 700,
          color: T.ink,
          letterSpacing: '-0.3px',
        }}>platewise</div>
      </div>

      {/* Status */}
      <div style={{
        fontSize: 13,
        color: error ? T.red : T.inkMute,
        minHeight: 18,
        textAlign: 'center',
      }}>
        {error || 'Enter your PIN to continue'}
      </div>

      {/* PIN dots */}
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: LENGTH }).map((_, i) => (
          <span key={i} style={{
            width: 13, height: 13, borderRadius: '50%',
            background: i < code.length ? T.green : 'transparent',
            border: `2px solid ${i < code.length ? T.green : T.line}`,
            transition: 'background 0.15s ease, border-color 0.15s ease',
            boxShadow: i < code.length ? '0 0 8px rgba(196,103,74,0.4)' : 'none',
          }} />
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: 240 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)} disabled={loading} style={keyStyle}>
            <span style={{ fontSize: 24, lineHeight: 1, color: T.ink, fontWeight: 500 }}>{d}</span>
          </button>
        ))}
        <div />
        <button onClick={() => press('0')} disabled={loading} style={keyStyle}>
          <span style={{ fontSize: 24, lineHeight: 1, color: T.ink, fontWeight: 500 }}>0</span>
        </button>
        <button onClick={backspace} disabled={loading} style={{
          ...keyStyle,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}>
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
            <path d="M9 10L5 6M9 10L5 14M9 10H21M15 5h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5"
              stroke={T.inkMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={{ fontSize: 11, color: T.inkFaint }}>
        You'll stay signed in on this device
      </div>
    </div>
  );
}
