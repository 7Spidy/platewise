// client/src/components/PWMealView.jsx — read-only meal detail modal
import React, { useState, useEffect } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

function fmt(val, unit) {
  return val != null ? `${Math.round(val)}${unit}` : '—';
}

function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PWMealView({ meal, onClose, onEdit, origin, onLoggedAgain }) {
  const [loggingAgain, setLoggingAgain]   = useState(false);
  const [logAgainAt, setLogAgainAt]       = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [logAgainError, setLogAgainError] = useState(null);

  // Reset log-again state whenever the viewed meal changes
  useEffect(() => {
    setLoggingAgain(false);
    setLogAgainAt('');
    setSubmitting(false);
    setLogAgainError(null);
  }, [meal]);

  if (!meal) return null;

  const onLogAgain = async () => {
    setSubmitting(true);
    setLogAgainError(null);
    try {
      const res = await fetch('/api/log-again', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meal.id, loggedAt: new Date(logAgainAt).toISOString() }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Could not log again');
      }
      if (onLoggedAgain) onLoggedAgain(); else onClose();
    } catch (e) {
      setLogAgainError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const timeLabel = new Date(meal.created_at).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
  const typeLine = [timeLabel, meal.meal_type].filter(Boolean).join(' · ');

  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.35)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 100, padding: '0 0 0 0',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: T.shadow,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Photo or placeholder */}
        {meal.photo_url
          ? <img
              src={meal.photo_url}
              alt={meal.name}
              style={{
                width: '100%', height: 200, objectFit: 'cover',
                borderRadius: '20px 20px 0 0', flexShrink: 0,
              }}
            />
          : <div style={{
              width: '100%', height: 160, borderRadius: '20px 20px 0 0',
              background: T.lineSoft, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {PWIcon2.plate(48, T.inkFaint)}
            </div>
        }

        {/* Content */}
        <div style={{ padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name + meta */}
          <div>
            <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {meal.name}
            </div>
            {typeLine && (
              <div style={{ fontSize: 12, color: T.inkMute, marginTop: 4 }}>{typeLine}</div>
            )}
          </div>

          {/* Calories */}
          <div style={{ fontFamily: T.heading, fontSize: 36, fontWeight: 700, color: T.green, lineHeight: 1 }}>
            {Math.round(meal.calories)}
            <span style={{ fontSize: 14, fontWeight: 400, color: T.inkMute, fontFamily: T.font }}> kcal</span>
          </div>

          {/* Macros */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Carbs',   value: meal.carbs_g,   unit: 'g', color: T.amber },
              { label: 'Protein', value: meal.protein_g, unit: 'g', color: T.sage },
              { label: 'Fat',     value: meal.fat_g,     unit: 'g', color: T.fat },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{
                flex: 1, background: T.lineSoft, borderRadius: 10, padding: '9px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmt(value, unit)}</div>
                <div style={{ fontSize: 9.5, color: T.inkMute, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Micros */}
          <div style={{ background: T.lineSoft, borderRadius: 12, overflow: 'hidden' }}>
            {[
              ['Fiber',  meal.fiber_g,   'g'],
              ['Sugar',  meal.sugar_g,   'g'],
              ['Sodium', meal.sodium_mg, 'mg'],
            ].map(([label, val, unit], i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: i < 2 ? `1px solid ${T.line}` : 'none',
              }}>
                <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{fmt(val, unit)}</span>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Ingredients
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ingredients.map((ing, i) => (
                  <div key={i} style={{ fontSize: 13, color: T.inkSoft, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{ing.name}</span>
                    <span style={{ color: T.inkFaint }}>{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log again — timestamp row (history only) */}
          {origin === 'history' && loggingAgain && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="datetime-local"
                value={logAgainAt}
                onChange={(e) => setLogAgainAt(e.target.value)}
                style={{
                  flex: 1, minWidth: 0, border: `1.5px solid ${T.line}`, borderRadius: 10,
                  padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                  color: T.ink, outline: 'none', background: '#fff',
                }}
              />
              <button
                onClick={onLogAgain}
                disabled={submitting || !logAgainAt}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: T.green, color: '#fff', fontWeight: 700,
                  cursor: submitting || !logAgainAt ? 'default' : 'pointer',
                  fontFamily: T.font, fontSize: 14,
                  opacity: submitting || !logAgainAt ? 0.6 : 1,
                }}
              >
                {submitting ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setLoggingAgain(false)}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${T.line}`, background: '#fff',
                  cursor: 'pointer', fontFamily: T.font, fontSize: 14, color: T.inkSoft,
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {logAgainError && (
            <div style={{ background: T.red50, color: T.red, borderRadius: 10, padding: '9px 12px', fontSize: 12.5 }}>
              ⚠ {logAgainError}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {origin === 'history' && !loggingAgain && (
              <button
                onClick={() => { setLoggingAgain(true); setLogAgainAt(toLocalInputValue(new Date())); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: `1.5px solid ${T.line}`, background: '#fff',
                  cursor: 'pointer', fontFamily: T.font, fontSize: 14,
                  fontWeight: 600, color: T.inkSoft,
                }}
              >
                ↻ Log again
              </button>
            )}
            <button
              onClick={onEdit}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1.5px solid ${T.line}`, background: '#fff',
                cursor: 'pointer', fontFamily: T.font, fontSize: 14,
                fontWeight: 600, color: T.inkSoft,
              }}
            >
              Edit
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1.5px solid ${T.line}`, background: '#fff',
                cursor: 'pointer', fontFamily: T.font, fontSize: 14,
                fontWeight: 600, color: T.inkSoft,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
