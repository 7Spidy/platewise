// client/src/components/PWHistory.jsx
import React, { useEffect, useState } from 'react';
import { PW_TOKENS } from '../App.jsx';

export default function PWHistory({ onBack }) {
  const [meals, setMeals] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/meals');
      if (!res.ok) throw new Error('Could not load history');
      setMeals(await res.json());
    } catch (e) {
      setError(e.message);
    }
  };

  const logAgain = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/log-again', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Could not log again');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const todayTotal = (meals || [])
    .filter((m) => new Date(m.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, m) => sum + (m.calories || 0), 0);

  return (
    <div style={{
      minHeight: '100vh', background: PW_TOKENS.bg, fontFamily: 'Inter, system-ui',
      padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{
          background: '#fff', border: `1px solid ${PW_TOKENS.line}`, borderRadius: 999,
          padding: '8px 14px', fontSize: 13, color: PW_TOKENS.inkSoft, cursor: 'pointer', fontFamily: 'inherit',
        }}>← Back</button>
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: PW_TOKENS.ink }}>History</span>
        <div style={{ width: 64 }} />
      </div>

      {meals && meals.length > 0 && (
        <div style={{
          fontSize: 12.5, color: PW_TOKENS.inkSoft, background: '#fff',
          border: `1px solid ${PW_TOKENS.line}`, borderRadius: 12, padding: '10px 14px',
        }}>
          Today so far · <b style={{ color: PW_TOKENS.ink }}>{todayTotal} kcal</b>
        </div>
      )}

      {error && <div style={{ color: '#B42318', fontSize: 13 }}>{error}</div>}

      {meals === null && !error && (
        <div style={{ color: PW_TOKENS.inkMute, fontSize: 13, textAlign: 'center', marginTop: 40 }}>Loading…</div>
      )}

      {meals && meals.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10, textAlign: 'center', color: PW_TOKENS.inkSoft,
        }}>
          <div style={{ fontSize: 32 }}>🍽️</div>
          <div style={{ fontWeight: 700, color: PW_TOKENS.ink }}>No meals logged yet</div>
          <p style={{ fontSize: 13, maxWidth: 220, margin: 0 }}>
            Scan a plate and save it to start building your history.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {(meals || []).map((m) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
            border: `1px solid ${PW_TOKENS.line}`, borderRadius: 14, padding: '10px 12px',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 11, flex: '0 0 46px',
              backgroundImage: m.photo_url ? `url(${m.photo_url})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              background: m.photo_url ? undefined : PW_TOKENS.greenSoft,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 700, color: PW_TOKENS.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{m.name}</div>
              <div style={{ fontSize: 11, color: PW_TOKENS.inkMute }}>
                {new Date(m.created_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PW_TOKENS.ink }}>{m.calories} kcal</div>
              {m.health_score != null && (
                <span style={{
                  fontSize: 10, fontWeight: 700, background: PW_TOKENS.greenSoft,
                  color: PW_TOKENS.greenInk, borderRadius: 999, padding: '1px 7px', display: 'inline-block', marginTop: 2,
                }}>{m.health_score}/10</span>
              )}
            </div>
            <button
              onClick={() => logAgain(m.id)}
              disabled={busyId === m.id}
              title="Log again"
              style={{
                width: 28, height: 28, borderRadius: 14, border: `1px solid ${PW_TOKENS.line}`,
                background: PW_TOKENS.bg, fontSize: 13, cursor: 'pointer', flex: '0 0 28px',
              }}
            >{busyId === m.id ? '…' : '↻'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
