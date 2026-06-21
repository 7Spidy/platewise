// client/src/components/PWEditMeal.jsx
import React, { useState } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_TYPE_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PWEditMeal({ meal, onBack, onSaved }) {
  const [name, setName] = useState(meal.name);
  const [ingredients, setIngredients] = useState(meal.ingredients || null);
  const [calories, setCalories] = useState(meal.calories);
  const [macros, setMacros] = useState({ carbs: meal.carbs_g || 0, protein: meal.protein_g || 0, fat: meal.fat_g || 0 });
  const [other, setOther] = useState({ fiber: meal.fiber_g || 0, sugar: meal.sugar_g || 0, sodium: meal.sodium_mg || 0 });
  const [loggedAt, setLoggedAt] = useState(toLocalInputValue(meal.created_at));
  const [mealType, setMealType] = useState(MEAL_TYPES.includes(meal.meal_type) ? meal.meal_type : 'snack');
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const [loggingAgain, setLoggingAgain] = useState(false);

  const onLogAgain = async () => {
    setLoggingAgain(true);
    setError(null);
    try {
      const res = await fetch('/api/log-again', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meal.id }),
      });
      if (!res.ok) throw new Error('Could not log again');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoggingAgain(false);
    }
  };

  const recalc = async (nextIngredients) => {
    setRecalculating(true);
    setError(null);
    try {
      const desc = nextIngredients.map((i) => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, details: `Ingredients: ${desc}` }),
      });
      if (!res.ok) throw new Error('Could not recalculate');
      const updated = await res.json();
      setIngredients(updated.ingredients);
      setCalories(updated.calories);
      setMacros(updated.macros);
      setOther(updated.other);
    } catch (e) {
      setError(e.message);
    } finally {
      setRecalculating(false);
    }
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setDraftQty(String(ingredients[idx].quantity));
    setDraftUnit(ingredients[idx].unit);
  };
  const commitEdit = () => {
    const next = ingredients.map((ing, i) =>
      i === editingIdx ? { ...ing, quantity: Number(draftQty) || ing.quantity, unit: draftUnit || ing.unit } : ing
    );
    setEditingIdx(null);
    recalc(next);
  };
  const removeIngredient = (idx) => {
    const next = ingredients.filter((_, i) => i !== idx);
    if (next.length === 0) return;
    recalc(next);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meal.id, name, serving: meal.serving, calories,
          macros, other, ingredients,
          healthScore: meal.health_score, fact: meal.fact, tips: meal.tips, mismatch: meal.mismatch,
          mealType, loggedAt: new Date(loggedAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Could not save changes');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('Delete this logged meal? This cannot be undone.')) return;
    try {
      await fetch('/api/meals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: meal.id }) });
      onSaved();
    } catch (e) {
      setError('Could not delete');
    }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Edit Meal</div>
        </div>
        <button onClick={onLogAgain} disabled={loggingAgain} title="Log again as a new entry for today"
          style={{ background: 'none', border: `1px solid ${T.line}`, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, color: T.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
          {loggingAgain ? '…' : '↻ Log again'}
        </button>
      </div>

      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </Field>

      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Date &amp; time" full>
          <input type="datetime-local" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Meal type" full>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={inputStyle}>
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_TYPE_LABEL[m]}</option>)}
          </select>
        </Field>
      </div>

      {ingredients ? (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Ingredients — tap qty to edit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ingredients.map((ing, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 9, padding: '8px 11px',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{ing.name}</span>
                {editingIdx === idx ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input autoFocus value={draftQty} onChange={(e) => setDraftQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                      style={{ width: 50, border: `1px solid ${T.line}`, borderRadius: 6, padding: '3px 6px', fontSize: 12.5, fontFamily: 'inherit' }} />
                    <input value={draftUnit} onChange={(e) => setDraftUnit(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                      style={{ width: 40, border: `1px solid ${T.line}`, borderRadius: 6, padding: '3px 6px', fontSize: 12.5, fontFamily: 'inherit' }} />
                    <button onClick={commitEdit} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, padding: '4px 7px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => removeIngredient(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{PWIcon2.trash(13)}</button>
                  </div>
                ) : (
                  <div onClick={() => startEdit(idx)} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: 12.5, color: T.inkMute }}>{ing.quantity}{ing.unit}</span>
                    {PWIcon2.edit(12)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {recalculating && <div style={{ fontSize: 12, color: T.inkMute, textAlign: 'center', marginTop: 6 }}>Recalculating…</div>}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: T.inkFaint }}>
          This meal was logged before per-ingredient tracking — edit totals directly below.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <NumField label="Calories" value={calories} onChange={setCalories} />
        <NumField label="Protein g" value={macros.protein} onChange={(v) => setMacros((m) => ({ ...m, protein: v }))} />
        <NumField label="Carbs g" value={macros.carbs} onChange={(v) => setMacros((m) => ({ ...m, carbs: v }))} />
        <NumField label="Fat g" value={macros.fat} onChange={(v) => setMacros((m) => ({ ...m, fat: v }))} />
      </div>

      {error && <div style={{ background: T.red50, color: T.red, borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>⚠ {error}</div>}

      <button onClick={onSave} disabled={saving} style={{
        background: T.green, color: '#fff', border: 'none', borderRadius: 10,
        padding: '13px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>{saving ? 'Saving…' : 'Save changes'}</button>

      <button onClick={onDelete} style={{
        background: '#fff', border: `1px solid ${T.red}`, color: T.red, borderRadius: 10,
        padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>Delete meal</button>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: full ? 1 : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase' }}>{label}</label>
      <input type="number" value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, padding: '7px 8px', fontSize: 12.5, textAlign: 'center' }} />
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#fff', border: `1px solid ${T.line}`,
  borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: T.ink, outline: 'none',
};
