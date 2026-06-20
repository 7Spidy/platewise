// client/src/components/PWLock.jsx
import React, { useState } from 'react';
import { PW_TOKENS } from '../App.jsx';

const LENGTH = 4;

export default function PWLock({ onUnlock }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
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

  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: PW_TOKENS.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 22, fontFamily: 'Inter, system-ui',
    }}>
      <div style={{
        fontWeight: 700, fontSize: 20, letterSpacing: -0.4, color: PW_TOKENS.ink,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: PW_TOKENS.green }}>✦</span> Platewise
      </div>

      <div style={{ fontSize: 13, color: error ? '#B42318' : PW_TOKENS.inkSoft, minHeight: 16 }}>
        {error || 'Enter passcode'}
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {Array.from({ length: LENGTH }).map((_, i) => (
          <span key={i} style={{
            width: 14, height: 14, borderRadius: 7,
            background: i < code.length ? PW_TOKENS.ink : 'transparent',
            border: `1.5px solid ${i < code.length ? PW_TOKENS.ink : PW_TOKENS.inkMute}`,
            transition: 'background 0.15s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, width: 220 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)} disabled={loading} style={keyStyle}>{d}</button>
        ))}
        <div />
        <button onClick={() => press('0')} disabled={loading} style={keyStyle}>0</button>
        <button
          onClick={backspace}
          disabled={loading}
          style={{ ...keyStyle, background: 'transparent', border: 'none', boxShadow: 'none', color: PW_TOKENS.inkSoft }}
        >⌫</button>
      </div>

      <div style={{ fontSize: 10.5, color: PW_TOKENS.inkMute }}>🔓 You'll stay signed in on this device</div>
    </div>
  );
}

const keyStyle = {
  aspectRatio: '1',
  borderRadius: '50%',
  background: '#fff',
  border: `1px solid ${PW_TOKENS.line}`,
  fontFamily: 'inherit',
  fontSize: 18,
  fontWeight: 600,
  color: PW_TOKENS.ink,
  cursor: 'pointer',
  boxShadow: PW_TOKENS.shadowSoft,
};
