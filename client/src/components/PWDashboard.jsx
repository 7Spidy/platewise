// client/src/components/PWDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWRing, PWIcon2, BottomNav, getGreeting, isoDate } from '../tokens.jsx';

const MEAL_TYPES  = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };

function detectMealType() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

function stepperLabel(dateOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dateOffset);
  if (dateOffset === 0) {
    return 'Today, ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (dateOffset === -1) {
    return 'Yesterday, ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function PWDashboard({ onAddMeal, onHistory, onLibrary, onEditMeal, refreshSignal }) {
  const [dateOffset, setDateOffset]     = useState(0);
  const [meals, setMeals]               = useState(null);
  const [savedMeals, setSavedMeals]     = useState([]);
  const [settings, setSettings]         = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [draftTargets, setDraftTargets] = useState(null);
  const [busyChip, setBusyChip]         = useState(null);
  const [error, setError]               = useState(null);

  const isReadOnly = dateOffset !== 0;

  const load = async () => {
    try {
      const [mealsRes, savedRes, settingsRes] = await Promise.all([
        fetch(`/api/meals?date=${isoDate(dateOffset)}`),
        fetch('/api/saved-meals'),
        fetch('/api/settings'),
      ]);
      if (mealsRes.ok)    setMeals(await mealsRes.json());
      if (savedRes.ok)    setSavedMeals(await savedRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {
      setError('Could not load dashboard');
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

  const mealsByType = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const m of meals || []) {
      const key = MEAL_TYPES.includes(m.meal_type) ? m.meal_type : 'snack';
      grouped[key].push(m);
    }
    return grouped;
  }, [meals]);

  const onQuickAdd = async (saved) => {
    if (isReadOnly) return;
    setBusyChip(saved.id);
    try {
      await fetch('/api/saved-meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: saved.id, bumpUse: true }),
      });
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saved.name, calories: saved.calories,
          macros:  { carbs: saved.carbs_g, protein: saved.protein_g, fat: saved.fat_g },
          other:   { fiber: saved.fiber_g, sugar: saved.sugar_g, sodium: saved.sodium_mg },
          ingredients: saved.ingredients,
          mealType: detectMealType(),
        }),
      });
      await load();
    } catch {
      setError('Could not log that item');
    } finally {
      setBusyChip(null);
    }
  };

  const saveTargets = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCalories: Number(draftTargets.target_calories),
          targetProteinG: Number(draftTargets.target_protein_g),
          targetCarbsG:   Number(draftTargets.target_carbs_g),
          targetFatG:     Number(draftTargets.target_fat_g),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error || 'Could not save targets');
        return;
      }
      setSettings(await res.json());
      setShowSettings(false);
    } catch {
      setError('Could not save targets');
    }
  };

  const targets = settings || { target_calories: 2200, target_protein_g: 180, target_carbs_g: 200, target_fat_g: 70 };
  const remaining = Math.max(0, targets.target_calories - Math.round(totals.calories));

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '28px 20px 100px', boxSizing: 'border-box', position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{
            fontFamily: T.heading,
            fontSize: 24, fontWeight: 700, color: T.ink,
            letterSpacing: '-0.3px', lineHeight: 1.2,
          }}>
            {getGreeting()}
          </div>
        </div>
        <button
          onClick={() => { setDraftTargets({ ...targets }); setShowSettings(true); }}
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#fff',
            border: `1px solid ${T.line}`, display: 'grid', placeItems: 'center',
            cursor: 'pointer', boxShadow: T.shadowSoft,
          }}>
          {PWIcon2.gear(16)}
        </button>
      </div>

      {/* ── Date Stepper ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button
          onClick={() => setDateOffset((o) => o - 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          {PWIcon2.chevLeft(20, T.green)}
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: T.inkSoft }}>
          {stepperLabel(dateOffset)}
        </span>
        <button
          onClick={() => setDateOffset((o) => Math.min(0, o + 1))}
          disabled={dateOffset === 0}
          style={{
            background: 'none', border: 'none', cursor: dateOffset === 0 ? 'default' : 'pointer',
            padding: 4, opacity: dateOffset === 0 ? 0.3 : 1,
            pointerEvents: dateOffset === 0 ? 'none' : 'auto',
          }}
        >
          {PWIcon2.chevRight(20, T.green)}
        </button>
      </div>

      {/* ── Read-only banner ── */}
      {isReadOnly && (
        <div style={{
          background: T.amber50, border: `1px solid ${T.amber}`, borderRadius: 12,
          padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ fontSize: 12.5, color: T.amber, fontWeight: 500 }}>
            📅 Viewing a past day, read only
          </span>
          <button
            onClick={() => setDateOffset(0)}
            style={{
              background: T.amber, color: '#fff', border: 'none', borderRadius: 8,
              padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: T.font, whiteSpace: 'nowrap',
            }}
          >
            Back to today
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: T.red, fontSize: 12.5, marginBottom: 10 }}>{error}</div>
      )}

      {/* ── Calorie Ring ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <PWRing
          value={totals.calories}
          target={targets.target_calories}
          size={160} stroke={13} color={T.green}
          label={
            <span style={{
              fontFamily: T.heading,
              fontSize: 30, fontWeight: 700, color: T.ink, letterSpacing: '-0.5px',
            }}>
              {Math.round(totals.calories).toLocaleString()}
            </span>
          }
          sub={
            <span style={{ fontSize: 11, color: T.inkMute }}>
              {remaining > 0 ? `${remaining} kcal left` : 'Goal reached'}
            </span>
          }
        />
      </div>

      {/* ── Macro Pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[
          { label: 'Protein', value: totals.protein,  target: targets.target_protein_g },
          { label: 'Carbs',   value: totals.carbs,    target: targets.target_carbs_g },
          { label: 'Fat',     value: totals.fat,      target: targets.target_fat_g },
        ].map(({ label, value, target: tgt }) => (
          <div key={label} style={{
            flex: 1, background: T.lineSoft, borderRadius: 12, padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{Math.round(value)}g</div>
            <div style={{ fontSize: 9.5, color: T.inkMute, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{
              height: 3, background: T.line, borderRadius: 2, marginTop: 6, overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(100, tgt > 0 ? (value / tgt) * 100 : 0)}%`,
                height: '100%', background: T.green, borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Add (hidden in read-only mode) ── */}
      {!isReadOnly && quickAddChips.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={sectionLabelStyle}>Quick Add</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {quickAddChips.map((c) => (
              <button key={c.id} onClick={() => onQuickAdd(c)} disabled={busyChip === c.id} style={{
                flex: '0 0 auto', minWidth: 80,
                background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12,
                padding: '10px 12px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: T.font,
                boxShadow: T.shadowSoft, opacity: busyChip === c.id ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {busyChip === c.id ? '✓ Added' : c.name}
                </span>
                <span style={{ fontSize: 10.5, color: T.green, fontWeight: 700 }}>{Math.round(c.calories)} cal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Meal Sections ── */}
      {meals === null && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>Loading…</div>
      )}
      {meals && meals.length === 0 && (
        <div style={{
          background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 16,
          padding: '24px 20px', textAlign: 'center', color: T.inkMute, fontSize: 13,
        }}>
          {isReadOnly ? 'No meals logged on this day.' : 'Nothing logged yet today — tap + to add your first meal.'}
        </div>
      )}
      {meals && meals.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadowSoft }}>
          {MEAL_TYPES.map((type, idx) => {
            const entries = mealsByType[type];
            return (
              <div key={type} style={{
                borderBottom: idx < MEAL_TYPES.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {MEAL_LABELS[type]}
                  </div>
                  {!isReadOnly && (
                    <button onClick={onAddMeal} style={{
                      width: 22, height: 22, background: entries.length ? T.green : T.lineSoft,
                      borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 2v6M2 5h6" stroke={entries.length ? '#fff' : T.inkFaint} strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                {entries.length > 0 ? entries.map((m) => (
                  <button key={m.id} onClick={() => onEditMeal && onEditMeal(m)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', padding: '8px 16px 10px',
                    cursor: onEditMeal ? 'pointer' : 'default', fontFamily: T.font,
                    textAlign: 'left', width: '100%',
                  }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: T.ink }}>{m.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>{Math.round(m.calories)}</span>
                  </button>
                )) : (
                  <div style={{ fontSize: 12.5, color: T.inkFaint, padding: '0 16px 12px' }}>Nothing logged yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav
        active="home"
        onHome={undefined}
        onAdd={onAddMeal}
        onHistory={onHistory}
        onLibrary={onLibrary}
      />

      {/* ── Settings Popover ── */}
      {showSettings && draftTargets && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: 20,
        }} onClick={() => setShowSettings(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 320, boxShadow: T.shadow,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: T.heading, fontSize: 18, fontWeight: 700, color: T.ink }}>Daily Targets</div>
            {[
              ['target_calories', 'Calories (kcal)', 800],
              ['target_protein_g', 'Protein (g)', 20],
              ['target_carbs_g', 'Carbs (g)', 20],
              ['target_fat_g', 'Fat (g)', 10],
            ].map(([key, label, minVal]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input
                  type="number"
                  min={minVal}
                  value={draftTargets[key]}
                  onChange={(e) => setDraftTargets((d) => ({ ...d, [key]: e.target.value }))}
                  style={{
                    border: `1.5px solid ${T.line}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 15, fontFamily: T.font,
                    color: T.ink, outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowSettings(false)} style={{
                flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${T.line}`,
                background: '#fff', cursor: 'pointer', fontFamily: T.font, fontSize: 14, color: T.inkSoft,
              }}>Cancel</button>
              <button onClick={saveTargets} style={{
                flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                background: T.green, color: '#fff', fontWeight: 700,
                cursor: 'pointer', fontFamily: T.font, fontSize: 14,
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionLabelStyle = {
  fontSize: 10.5, fontWeight: 700, color: T.inkMute,
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10,
};
