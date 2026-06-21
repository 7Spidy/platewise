// client/src/components/PWDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWRing, PWIcon2, isoDate } from '../tokens.jsx';

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_TYPE_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };


export default function PWDashboard({ onAddMeal, onHistory, onLibrary, onEditMeal, refreshSignal }) {
  const [meals, setMeals] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [draftTargets, setDraftTargets] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [mealsRes, settingsRes] = await Promise.all([
        fetch(`/api/meals?date=${isoDate()}`),
        fetch('/api/settings'),
      ]);
      if (mealsRes.ok) setMeals(await mealsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (e) {
      setError('Could not load dashboard');
    }
  };

  useEffect(() => { load(); }, [refreshSignal]);

  const totals = useMemo(() => {
    const m = meals || [];
    return {
      calories: m.reduce((s, x) => s + (x.calories || 0), 0),
      protein:  m.reduce((s, x) => s + (Number(x.protein_g) || 0), 0),
      carbs:    m.reduce((s, x) => s + (Number(x.carbs_g) || 0), 0),
      fat:      m.reduce((s, x) => s + (Number(x.fat_g) || 0), 0),
    };
  }, [meals]);

  const mealsByType = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const m of meals || []) {
      const key = MEAL_TYPES.includes(m.meal_type) ? m.meal_type : 'snack';
      grouped[key].push(m);
    }
    return grouped;
  }, [meals]);

  const saveTargets = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCalories: Number(draftTargets.target_calories),
          targetProteinG: Number(draftTargets.target_protein_g),
          targetCarbsG: Number(draftTargets.target_carbs_g),
          targetFatG: Number(draftTargets.target_fat_g),
        }),
      });
      if (res.ok) setSettings(await res.json());
      setShowSettings(false);
    } catch (e) {
      setError('Could not save targets');
    }
  };

  const targets = settings || { target_calories: 2200, target_protein_g: 180, target_carbs_g: 200, target_fat_g: 70 };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '28px 20px 100px', boxSizing: 'border-box', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: T.ink }}>Today</div>
          <div style={{ fontSize: 12, color: T.inkMute, marginTop: 2 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onLibrary} style={navBtnStyle}>Saved Foods</button>
          <button onClick={onHistory} style={navBtnStyle}>History</button>
          <button onClick={() => { setDraftTargets({ ...targets }); setShowSettings(true); }}
            style={{
              width: 34, height: 34, borderRadius: 10, background: T.lineSoft, border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>{PWIcon2.gear(16)}</button>
        </div>
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      {/* Calorie ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <PWRing
          value={totals.calories} target={targets.target_calories} size={150} stroke={12} color={T.green}
          label={<span style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>{Math.round(totals.calories)}</span>}
          sub={<span style={{ fontSize: 11, color: T.inkMute }}>kcal of {targets.target_calories}</span>}
        />
      </div>

      {/* Macro rings */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
        <MacroRing label="PROTEIN" value={totals.protein} target={targets.target_protein_g} />
        <MacroRing label="CARBS" value={totals.carbs} target={targets.target_carbs_g} />
        <MacroRing label="FAT" value={totals.fat} target={targets.target_fat_g} />
      </div>

      {/* Meal sections */}
      {meals === null && <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>Loading…</div>}
      {meals && meals.length === 0 && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>
          🍽️ No meals logged yet today — tap + to add one.
        </div>
      )}
      {meals && meals.length > 0 && MEAL_TYPES.map((type) => (
        mealsByType[type].length > 0 && (
          <div key={type} style={{ marginBottom: 16 }}>
            <div style={sectionLabelStyle}>{MEAL_TYPE_LABEL[type].toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mealsByType[type].map((m) => (
                <button key={m.id} onClick={() => onEditMeal && onEditMeal(m)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 10,
                  padding: '9px 12px', cursor: onEditMeal ? 'pointer' : 'default', fontFamily: 'inherit',
                  textAlign: 'left', width: '100%',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{m.name}</span>
                  <span style={{ fontSize: 12.5, color: T.inkMute }}>{Math.round(m.calories)} cal</span>
                </button>
              ))}
            </div>
          </div>
        )
      ))}

      {/* FAB */}
      <button onClick={onAddMeal} style={{
        position: 'fixed', bottom: 28, right: 24, width: 56, height: 56, borderRadius: 28,
        background: T.green, border: 'none', display: 'grid', placeItems: 'center',
        boxShadow: '0 8px 20px rgba(22,163,74,0.4)', cursor: 'pointer', zIndex: 20,
      }}>{PWIcon2.plus(24)}</button>

      {/* Settings popover */}
      {showSettings && draftTargets && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.35)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
        }} onClick={() => setShowSettings(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: 320,
            display: 'flex', flexDirection: 'column', gap: 12, boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Daily targets</div>
            {[
              ['target_calories', 'Calories (kcal)'],
              ['target_protein_g', 'Protein (g)'],
              ['target_carbs_g', 'Carbs (g)'],
              ['target_fat_g', 'Fat (g)'],
            ].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: T.inkMute, fontWeight: 600 }}>{label}</label>
                <input type="number" value={draftTargets[key]}
                  onChange={(e) => setDraftTargets((d) => ({ ...d, [key]: e.target.value }))}
                  style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: '7px 10px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => setShowSettings(false)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${T.line}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={saveTargets} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: T.green, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroRing({ label, value, target }) {
  return (
    <PWRing
      value={value} target={target} size={70} stroke={6} color={T.green}
      label={<span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{Math.round(value)}g</span>}
      sub={<span style={{ fontSize: 8.5, color: T.inkMute, fontWeight: 600, letterSpacing: 0.3 }}>{label}<br/>/{target}g</span>}
    />
  );
}

const navBtnStyle = {
  background: 'none', border: 'none', fontSize: 11.5, fontWeight: 600,
  color: T.inkMute, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 4px',
};

const sectionLabelStyle = {
  fontSize: 10.5, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6,
  textTransform: 'uppercase', marginBottom: 8,
};
