// client/src/components/PWMealView.jsx — read-only meal detail
import React, { useState, useEffect } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import PWHero from '../ui/PWHero.jsx';
import PWStats from '../ui/PWStats.jsx';
import PWLeader from '../ui/PWLeader.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWActionBar from '../ui/PWActionBar.jsx';

function fmt(val, unit) {
  return val != null ? `${Math.round(val)} ${unit}` : '–';
}

function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const sectionHead = { fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0, color: T.ink };

export default function PWMealView({ meal, onClose, onEdit, origin, onLoggedAgain }) {
  const [loggingAgain, setLoggingAgain]   = useState(false);
  const [logAgainAt, setLogAgainAt]       = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [logAgainError, setLogAgainError] = useState(null);
  const [libState, setLibState]           = useState('checking'); // 'checking' | 'idle' | 'saving' | 'saved'
  const [libError, setLibError]           = useState(null);

  // Reset per-meal state whenever the viewed meal changes, and check whether the
  // library already has a meal with this name. A failed check never blocks saving.
  useEffect(() => {
    setLoggingAgain(false);
    setLogAgainAt('');
    setSubmitting(false);
    setLogAgainError(null);
    setLibError(null);
    if (!meal) return undefined;

    let cancelled = false;
    setLibState('checking');
    const norm = (s) => String(s || '').trim().toLowerCase();
    (async () => {
      try {
        const res = await fetch('/api/saved-meals');
        if (!res.ok) throw new Error('check failed');
        const rows = await res.json();
        if (cancelled) return;
        const target = norm(meal.name);
        setLibState(Array.isArray(rows) && rows.some((r) => norm(r.name) === target) ? 'saved' : 'idle');
      } catch {
        if (!cancelled) setLibState('idle');
      }
    })();
    return () => { cancelled = true; };
  }, [meal]);

  // Escape closes the view
  useEffect(() => {
    if (!meal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [meal, onClose]);

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

  const onSaveToLibrary = async () => {
    if (libState !== 'idle') return;
    setLibState('saving');
    setLibError(null);
    // Postgres numeric columns can come back as strings; the validator needs real numbers.
    const num = (v) => (v == null || v === '' ? null : Number(v));
    try {
      const res = await fetch('/api/saved-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: meal.name,
          photoUrl: meal.photo_url ?? null,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : null,
          calories: Number(meal.calories) || 0,
          proteinG: num(meal.protein_g), carbsG: num(meal.carbs_g), fatG: num(meal.fat_g),
          fiberG: num(meal.fiber_g), sodiumMg: num(meal.sodium_mg), sugarG: num(meal.sugar_g),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Could not save to library');
      }
      setLibState('saved');
    } catch (e) {
      setLibError(e.message || 'Could not save to library');
      setLibState('idle');
    }
  };

  const savedNow = libState === 'saved';
  const saveLabel = savedNow ? 'Saved in library' : 'Save to library';

  const when = new Date(meal.created_at);
  const typeLabel = meal.meal_type ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1) : 'Meal';
  const whenLine = `${typeLabel} on ${when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} at ${when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const tips = Array.isArray(meal.tips) ? meal.tips : [];
  const score = Math.max(0, Math.min(10, Math.round(Number(meal.health_score) || 0)));

  return (
    <div role="dialog" aria-modal="true" aria-label={meal.name} style={{
      position: 'fixed', inset: 0, background: '#fff', zIndex: 100, overflowY: 'auto',
      display: 'flex', justifyContent: 'center', fontFamily: T.fontBody, color: T.ink,
    }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <PWHero onBack={onClose} backLabel="Close" src={meal.photo_url} name={meal.name} />

        <div style={{ padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 'normal', margin: 0, lineHeight: 1.15 }}>{meal.name}</h1>
          <div style={{ fontSize: 15, color: T.inkMute, marginTop: 6 }}>{whenLine}</div>
        </div>

        <div style={{ margin: '22px 0' }}>
          <PWStats calories={meal.calories} protein={meal.protein_g} carbs={meal.carbs_g} fat={meal.fat_g} />
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 26 }}>

          {meal.health_score != null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 16 }}>Health score <strong>{score}</strong> of 10</span>
              <span aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} style={{
                    width: 13, height: 13, borderRadius: '50%', boxSizing: 'border-box',
                    background: i < score ? T.sage : 'transparent',
                    border: i < score ? 'none' : `2px solid ${T.lineStrong}`,
                  }} />
                ))}
              </span>
            </div>
          )}

          <section style={{ display: 'flex', gap: 10 }}>
            {[
              ['Fiber', meal.fiber_g, 'g'],
              ['Sugar', meal.sugar_g, 'g'],
              ['Sodium', meal.sodium_mg, 'mg'],
            ].map(([l, v, u]) => (
              <div key={l} style={{ flex: 1, border: `1.5px solid ${T.line}`, borderRadius: T.rInput, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(v, u)}</div>
                <div style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </section>

          {ingredients.length > 0 && (
            <section>
              <h2 style={{ ...sectionHead, marginBottom: 4 }}>Ingredients</h2>
              {ingredients.map((ing, i) => (
                <PWLeader
                  key={i}
                  label={ing.name}
                  value={ing.quantity}
                  unit={ing.unit}
                  strong={false}
                  right={Number.isFinite(Number(ing.calories)) ? (
                    <span style={{ fontSize: 15, color: T.inkMute, whiteSpace: 'nowrap', marginLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(ing.calories)} kcal
                    </span>
                  ) : null}
                />
              ))}
            </section>
          )}

          {meal.fact && (
            <section style={{ background: T.goldTint, borderRadius: T.rCard, padding: '18px 20px' }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 18, lineHeight: 1.4, color: T.factInk }}>{meal.fact}</div>
            </section>
          )}

          {tips.length > 0 && (
            <section>
              <h2 style={{ ...sectionHead, marginBottom: 6 }}>Healthier swaps</h2>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0',
                  borderBottom: i < tips.length - 1 ? `1px solid ${T.line}` : 'none', fontSize: 16, lineHeight: 1.4,
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>{PWIcon2.check(20, T.sage)}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </section>
          )}

          {origin === 'history' && loggingAgain && (
            <section style={{ background: T.tint, borderRadius: T.rCard, padding: 16 }}>
              <label htmlFor="pw-logagain-at" style={{ display: 'block', fontSize: 14, color: T.inkSoft, marginBottom: 6 }}>
                Log this meal at
              </label>
              <input
                id="pw-logagain-at"
                type="datetime-local"
                value={logAgainAt}
                onChange={(e) => setLogAgainAt(e.target.value)}
                style={{
                  width: '100%', height: 52, border: 'none', borderRadius: T.rInput, background: '#fff',
                  padding: '0 14px', fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <PWButton variant="secondary" onClick={() => setLoggingAgain(false)} style={{ flex: 1, height: 48, fontSize: 16 }}>Cancel</PWButton>
                <PWButton variant="primary" onClick={onLogAgain} busy={submitting} disabled={!logAgainAt} style={{ flex: 1, height: 48, fontSize: 16 }}>
                  Confirm
                </PWButton>
              </div>
            </section>
          )}

          {logAgainError && (
            <div style={{ background: T.dangerTint, color: T.danger, borderRadius: 14, padding: '12px 16px', fontSize: 15 }}>
              {logAgainError}
            </div>
          )}

          {libError && (
            <div style={{ background: T.dangerTint, color: T.danger, borderRadius: 14, padding: '12px 16px', fontSize: 15 }}>
              {libError}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <PWActionBar>
          {origin === 'history' ? (
            <>
              <PWButton variant="secondary" onClick={onEdit} style={{ flex: 1 }}>Edit</PWButton>
              <PWButton
                variant={savedNow ? 'soft' : 'secondary'}
                onClick={onSaveToLibrary}
                disabled={libState === 'checking' || savedNow}
                busy={libState === 'saving'}
                aria-label={saveLabel}
                style={{ width: 56, minWidth: 56, padding: 0, flex: '0 0 56px', ...(savedNow ? { opacity: 1 } : null) }}
              >
                {savedNow ? PWIcon2.check(20, T.sage) : PWIcon2.bookmark(20, T.ink)}
              </PWButton>
              {!loggingAgain && (
                <PWButton variant="primary" style={{ flex: 1.5 }}
                  onClick={() => { setLoggingAgain(true); setLogAgainAt(toLocalInputValue(new Date())); }}>
                  Log again
                </PWButton>
              )}
            </>
          ) : (
            <>
              <PWButton variant="secondary" onClick={onEdit} style={{ flex: 1 }}>Edit</PWButton>
              <PWButton
                variant={savedNow ? 'soft' : 'primary'}
                onClick={onSaveToLibrary}
                disabled={libState === 'checking' || savedNow}
                busy={libState === 'saving'}
                aria-label={saveLabel}
                style={{ flex: 1, padding: '0 16px', whiteSpace: 'nowrap', ...(savedNow ? { opacity: 1 } : null) }}
              >
                {savedNow ? <>{PWIcon2.check(18, T.sage)} Saved</> : <>{PWIcon2.bookmark(18, T.onAccent)} Save</>}
              </PWButton>
            </>
          )}
        </PWActionBar>
      </div>
    </div>
  );
}
