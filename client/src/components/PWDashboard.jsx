// client/src/components/PWDashboard.jsx — "Today"
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWIcon2, getGreeting, isoDate } from '../tokens.jsx';
import { detectMealType, logSavedMeal } from '../lib/mealType.js';
import { macroNudge } from '../lib/nudge.js';
import PWMealView from './PWMealView.jsx';
import PWNav from '../ui/PWNav.jsx';
import PWPlate from '../ui/PWPlate.jsx';
import PWLeader from '../ui/PWLeader.jsx';

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function dateLabel(dateOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dateOffset);
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function weekdayName(dateOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dateOffset);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

const chevBtn = (disabled) => ({
  width: 44, height: 44, background: 'none', border: 'none', display: 'grid', placeItems: 'center',
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1,
});

const headingStyle = { fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0, color: T.ink };

export default function PWDashboard({ onAddMeal, onHistory, onLibrary, onYou, onEditMeal, refreshSignal }) {
  const [dateOffset, setDateOffset]   = useState(0);
  const [meals, setMeals]             = useState(null);
  const [savedMeals, setSavedMeals]   = useState([]);
  const [settings, setSettings]       = useState(null);
  const [busyChip, setBusyChip]       = useState(null);
  const [error, setError]             = useState(null);
  const [viewingMeal, setViewingMeal] = useState(null);

  const isReadOnly = dateOffset !== 0;

  const load = async () => {
    try {
      const [mealsRes, savedRes, settingsRes] = await Promise.all([
        fetch(`/api/meals?date=${isoDate(dateOffset)}`),
        fetch('/api/saved-meals'),
        fetch('/api/me/settings'),
      ]);
      if (mealsRes.ok)    setMeals(await mealsRes.json());
      if (savedRes.ok)    setSavedMeals(await savedRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {
      setError('Could not load Today');
    }
  };

  useEffect(() => { load(); }, [refreshSignal, dateOffset]);

  const totals = useMemo(() => {
    const m = meals || [];
    return {
      calories: m.reduce((s, x) => s + (x.calories || 0), 0),
      protein:  m.reduce((s, x) => s + (Number(x.protein_g) || 0), 0),
      carbs:    m.reduce((s, x) => s + (Number(x.carbs_g) || 0), 0),
      fat:      m.reduce((s, x) => s + (Number(x.fat_g) || 0), 0),
    };
  }, [meals]);

  const sortedMeals = useMemo(() => (
    [...(meals || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  ), [meals]);

  const quickAddChips = useMemo(() => {
    if (!savedMeals.length) return [];
    const now    = Date.now();
    const maxUse = Math.max(1, ...savedMeals.map((m) => m.use_count || 0));
    const scored = savedMeals.map((m) => {
      const lastUsed = m.last_used_at ? new Date(m.last_used_at).getTime() : 0;
      const recency  = lastUsed ? Math.max(0, 1 - (now - lastUsed) / (1000 * 60 * 60 * 24 * 30)) : 0;
      const freq     = (m.use_count || 0) / maxUse;
      return { ...m, score: recency * 0.6 + freq * 0.4 };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [savedMeals]);

  const onQuickAdd = async (saved) => {
    if (isReadOnly) return;
    setBusyChip(saved.id);
    try {
      await logSavedMeal(saved);
      await load();
    } catch {
      setError('Could not log that item');
    } finally {
      setBusyChip(null);
    }
  };

  const targets = settings || { target_calories: 2200, target_protein_g: 180, target_carbs_g: 200, target_fat_g: 70 };
  const consumed = Math.round(totals.calories);
  const targetCal = Number(targets.target_calories) || 0;
  const remaining = Math.max(0, targetCal - consumed);
  const over = Math.max(0, consumed - targetCal);
  const pct = targetCal > 0 ? Math.min(100, (consumed / targetCal) * 100) : 0;

  const nudge = !isReadOnly
    ? macroNudge(
        { protein: totals.protein, carbs: totals.carbs, fat: totals.fat },
        { protein: targets.target_protein_g, carbs: targets.target_carbs_g, fat: targets.target_fat_g },
      )
    : null;

  const mealTypeNow = detectMealType();

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      padding: '24px 20px 120px', boxSizing: 'border-box', position: 'relative',
    }}>

      {/* Date row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <button onClick={() => setDateOffset((o) => o - 1)} aria-label="Previous day" style={chevBtn(false)}>
          {PWIcon2.chevLeft(20, T.ink)}
        </button>
        <span style={{ fontSize: 15, color: T.inkMute }}>{dateLabel(dateOffset)}</span>
        <button
          onClick={() => setDateOffset((o) => Math.min(0, o + 1))}
          disabled={dateOffset === 0}
          aria-label="Next day"
          style={chevBtn(dateOffset === 0)}
        >
          {PWIcon2.chevRight(20, T.ink)}
        </button>
      </div>

      {/* Greeting */}
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 'normal', margin: '0 0 16px', lineHeight: 1.15 }}>
        {isReadOnly ? weekdayName(dateOffset) : getGreeting(settings?.name)}
      </h1>

      {isReadOnly && (
        <div style={{
          background: T.tint, borderRadius: T.rPill, padding: '6px 6px 6px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ fontSize: 14, color: T.inkSoft }}>Viewing a past day. Quick add is off.</span>
          <button onClick={() => setDateOffset(0)} style={{
            background: T.ink, color: T.onAccent, border: 'none', borderRadius: T.rPill, minHeight: 44,
            padding: '0 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.fontBody, whiteSpace: 'nowrap',
          }}>Back to today</button>
        </div>
      )}

      {error && (
        <div style={{ color: T.danger, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', fontSize: 14, marginBottom: 12 }}>{error}</div>
      )}

      {/* Menu panel */}
      <section style={{ background: T.tint, borderRadius: T.rPanel, padding: 22, marginBottom: 14 }}>
        {over > 0 ? (
          <div style={{ fontSize: 16, color: T.inkSoft }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 66, lineHeight: 1, color: T.goldInk, fontVariantNumeric: 'tabular-nums' }}>
              {over.toLocaleString()}
            </span>
            <div style={{ marginTop: 6 }}>kcal over, target {targetCal.toLocaleString()}</div>
          </div>
        ) : remaining === 0 && consumed > 0 ? (
          <div>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 44, lineHeight: 1.1 }}>Goal reached</span>
            <div style={{ fontSize: 16, color: T.inkSoft, marginTop: 6 }}>{consumed.toLocaleString()} of {targetCal.toLocaleString()} kcal</div>
          </div>
        ) : (
          <div>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 66, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {remaining.toLocaleString()}
            </span>
            <div style={{ fontSize: 16, color: T.inkSoft, marginTop: 6 }}>kcal left of {targetCal.toLocaleString()}</div>
          </div>
        )}
        <div
          role="progressbar" aria-label="Calories eaten" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
          style={{ height: 6, borderRadius: 3, background: 'rgba(23,54,42,0.1)', margin: '16px 0 10px', overflow: 'hidden' }}
        >
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 3,
            background: over > 0 ? T.gold : T.ink, transition: 'width 0.4s ease',
          }} />
        </div>
        <PWLeader label="Protein" value={`${Math.round(totals.protein)} of ${Math.round(targets.target_protein_g)}`} unit="g" />
        <PWLeader label="Carbs" value={`${Math.round(totals.carbs)} of ${Math.round(targets.target_carbs_g)}`} unit="g" />
        <PWLeader label="Fat" value={`${Math.round(totals.fat)} of ${Math.round(targets.target_fat_g)}`} unit="g" />
      </section>

      {/* Nudge */}
      {nudge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 15, color: T.inkSoft }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: T.sage, flexShrink: 0 }} />
          <span>{cap(nudge.macro)} is behind pace. {nudge.gramsToGo} g to go today.</span>
        </div>
      )}

      {/* Plates */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 0 12px' }}>
        <h2 style={headingStyle}>{isReadOnly ? 'Plates' : "Today's plates"}</h2>
        <span style={{ fontSize: 15, color: T.inkMute }}>{consumed.toLocaleString()} kcal</span>
      </div>

      {meals === null ? (
        <div style={{ color: T.inkMute, fontSize: 15, padding: '24px 0' }}>Loading…</div>
      ) : (
        <>
          <div className="pw-hscroll" style={{
            display: 'flex', gap: 18, overflowX: 'auto', scrollSnapType: 'x mandatory',
            padding: '4px 20px 22px', margin: '0 -20px',
          }}>
            {sortedMeals.map((m) => (
              <button key={m.id} onClick={() => setViewingMeal(m)} style={{
                flex: '0 0 138px', width: 138, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                scrollSnapAlign: 'start', textAlign: 'center', fontFamily: T.fontBody, color: T.ink,
              }}>
                <PWPlate src={m.photo_url} name={m.name} size={138} />
                <div style={{
                  fontFamily: T.fontDisplay, fontSize: 17, marginTop: 12, lineHeight: 1.25,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{m.name}</div>
                <div style={{ fontSize: 14, color: T.inkMute, marginTop: 3 }}>
                  {MEAL_LABELS[m.meal_type] || 'Meal'}, {Math.round(m.calories)} kcal
                </div>
              </button>
            ))}
            {!isReadOnly && (
              <button onClick={onAddMeal} aria-label={`Log ${MEAL_LABELS[mealTypeNow]}`} style={{
                flex: '0 0 138px', width: 138, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                scrollSnapAlign: 'start', textAlign: 'center', fontFamily: T.fontBody, color: T.ink,
              }}>
                <span style={{
                  width: 138, height: 138, borderRadius: '50%', border: `2px dashed ${T.lineStrong}`,
                  display: 'grid', placeItems: 'center', boxSizing: 'border-box',
                }}>
                  {PWIcon2.plus(30, T.sage)}
                </span>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 17, marginTop: 12 }}>{MEAL_LABELS[mealTypeNow]}</div>
                <div style={{ fontSize: 14, color: T.inkMute, marginTop: 3 }}>Not logged</div>
              </button>
            )}
          </div>
          {sortedMeals.length === 0 && (
            <div style={{ fontSize: 15, color: T.inkMute, marginTop: -8, marginBottom: 14 }}>
              {isReadOnly ? 'No meals logged on this day.' : 'Nothing logged yet today.'}
            </div>
          )}
        </>
      )}

      {/* Log again */}
      {!isReadOnly && quickAddChips.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <h2 style={{ ...headingStyle, marginBottom: 12 }}>Log again</h2>
          <div className="pw-hscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 20px 6px', margin: '0 -20px' }}>
            {quickAddChips.map((c) => (
              <button key={c.id} onClick={() => onQuickAdd(c)} disabled={busyChip === c.id} style={{
                flex: '0 0 auto', minHeight: 48, display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 16px 6px 8px', background: '#fff', border: `1.5px solid ${T.line}`, borderRadius: T.rPill,
                cursor: busyChip === c.id ? 'default' : 'pointer', fontFamily: T.fontBody, color: T.ink,
                opacity: busyChip === c.id ? 0.7 : 1,
              }}>
                {busyChip === c.id ? (
                  <span aria-hidden="true" style={{
                    width: 32, height: 32, display: 'grid', placeItems: 'center',
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${T.ink}`, borderTopColor: 'transparent',
                      animation: 'pw-spin 0.8s linear infinite',
                    }} />
                  </span>
                ) : (
                  <PWPlate src={c.photo_url} name={c.name} size={32} rim={false} />
                )}
                <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meal detail view */}
      <PWMealView
        meal={viewingMeal}
        onClose={() => setViewingMeal(null)}
        onEdit={() => { const m = viewingMeal; setViewingMeal(null); onEditMeal && onEditMeal(m); }}
        origin="dashboard"
      />

      <PWNav active="today" onToday={() => {}} onHistory={onHistory} onScan={onAddMeal} onLibrary={onLibrary} onYou={onYou} />
    </div>
  );
}
