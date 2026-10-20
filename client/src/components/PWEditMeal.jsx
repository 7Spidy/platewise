// client/src/components/PWEditMeal.jsx
import React, { useState } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import PWFactLoader from './PWFactLoader.jsx';
import PWConfirm from './PWConfirm.jsx';
import PWHero from '../ui/PWHero.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWActionBar from '../ui/PWActionBar.jsx';
import PWIngredients from '../ui/PWIngredients.jsx';
import { scaleIngredient, removeIngredient } from '../lib/scaleIngredients.js';

const MEAL_TYPES  = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PWEditMeal({ meal, onBack, onSaved }) {
  const [name, setName]           = useState(meal.name);
  const [ingredients, setIngredients] = useState(meal.ingredients || null);
  const [calories, setCalories]   = useState(meal.calories);
  const [macros, setMacros]       = useState({ carbs: meal.carbs_g || 0, protein: meal.protein_g || 0, fat: meal.fat_g || 0 });
  const [other, setOther]         = useState({ fiber: meal.fiber_g || 0, sugar: meal.sugar_g || 0, sodium: meal.sodium_mg || 0 });
  const [loggedAt, setLoggedAt]   = useState(toLocalInputValue(meal.created_at));
  const [mealType, setMealType]   = useState(MEAL_TYPES.includes(meal.meal_type) ? meal.meal_type : 'snack');
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingNames, setPendingNames]           = useState([]);
  const [newIngredientDraft, setNewIngredientDraft] = useState('');

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

  // Local edits: no network. Unit changes still use the AI path.
  const applyLocal = (result) => {
    setIngredients(result.ingredients);
    setCalories(result.calories);
    setMacros(result.macros);
    setOther(result.other);
  };
  const currentState = () => ({ ingredients, calories, macros, other });
  const onScale = (idx, qty) => applyLocal(scaleIngredient(currentState(), idx, qty));
  const onRemove = (idx) => applyLocal(removeIngredient(currentState(), idx));
  const onUnitChange = (idx, qty, unit) => {
    recalc(ingredients.map((ing, i) => (i === idx ? { ...ing, quantity: qty, unit } : ing)));
  };

  const addPending = () => {
    const trimmed = newIngredientDraft.trim();
    if (!trimmed) return;
    setPendingNames((p) => [...p, trimmed]);
    setNewIngredientDraft('');
  };
  const removePending = (idx) => setPendingNames((p) => p.filter((_, i) => i !== idx));

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let currentIngredients = ingredients;
      let currentCalories    = calories;
      let currentMacros      = macros;
      let currentOther       = other;

      if (pendingNames.length > 0) {
        setRecalculating(true);
        try {
          const existingParts = (ingredients || []).map((i) => `${i.quantity}${i.unit} ${i.name}`);
          const details = `Ingredients: ${[...existingParts, ...pendingNames].join(', ')}`;

          const doAnalyze = () => fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, details }),
          });

          let res = await doAnalyze();
          if (!res.ok) {
            await new Promise((r) => setTimeout(r, 500));
            res = await doAnalyze();
          }
          if (!res.ok) throw new Error('Could not recalculate');

          const updated = await res.json();
          currentIngredients = updated.ingredients;
          currentCalories    = updated.calories;
          currentMacros      = updated.macros;
          currentOther       = updated.other;
          setIngredients(currentIngredients);
          setCalories(currentCalories);
          setMacros(currentMacros);
          setOther(currentOther);
          setPendingNames([]);
        } finally {
          setRecalculating(false);
        }
      }

      const res = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meal.id, name, serving: meal.serving, calories: currentCalories,
          macros: currentMacros, other: currentOther, ingredients: currentIngredients,
          healthScore: meal.health_score, fact: meal.fact, tips: meal.tips,
          mismatch: meal.mismatch, mealType, loggedAt: new Date(loggedAt).toISOString(),
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
    setConfirmDelete(false);
    try {
      await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meal.id }),
      });
      onSaved();
    } catch {
      setError('Could not delete');
    }
  };

  const fieldLabel = { display: 'block', fontSize: 14, color: T.inkSoft, marginBottom: 6 };
  const sectionHead = { fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0, color: T.ink };
  const busy = saving || recalculating;

  const addIngredientUI = (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        value={newIngredientDraft}
        onChange={(e) => setNewIngredientDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addPending()}
        placeholder="Add ingredient"
        aria-label="Add ingredient"
        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
      />
      <PWButton variant="primary" onClick={addPending} disabled={!newIngredientDraft.trim()} style={{ height: 52, padding: '0 20px', fontSize: 16 }}>
        Add
      </PWButton>
    </div>
  );

  const pendingListUI = pendingNames.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      {pendingNames.map((pName, idx) => (
        <div key={`pending-${idx}`} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          background: T.tint, border: `2px dashed ${T.lineStrong}`, borderRadius: T.rInput, padding: '6px 6px 6px 14px',
        }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 500, color: T.ink }}>{pName}</span>
            <span style={{ display: 'block', fontSize: 14, color: T.inkMute }}>Pending. Will calculate on save.</span>
          </span>
          <button onClick={() => removePending(idx)} aria-label={`Remove ${pName}`} style={{
            width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            {PWIcon2.trash(18, T.danger)}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    }}>
      <PWHero onBack={onBack} src={meal.photo_url} name={name} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <label htmlFor="pw-edit-name" style={fieldLabel}>Name</label>
          <input id="pw-edit-name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label htmlFor="pw-edit-when" style={fieldLabel}>Date and time</label>
          <input id="pw-edit-when" type="datetime-local" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} style={inputStyle} />
        </div>

        <section>
          <h2 style={{ ...sectionHead, marginBottom: 12 }}>Meal</h2>
          <PWPills fill label="Meal type" value={mealType} onChange={setMealType}
            options={MEAL_TYPES.map((m) => ({ value: m, label: MEAL_LABELS[m] }))} />
        </section>

        <section>
          {ingredients ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={sectionHead}>Ingredients</h2>
                <span style={{ fontSize: 15, color: T.inkMute }}>Tap to adjust</span>
              </div>
              <PWIngredients ingredients={ingredients} onScale={onScale} onRemove={onRemove} onUnitChange={onUnitChange} />
            </>
          ) : (
            <div style={{ fontSize: 15, color: T.inkSoft, background: T.tint, borderRadius: T.rInput, padding: '14px 16px', lineHeight: 1.45 }}>
              This meal was logged before per-ingredient tracking. Edit the totals directly below.
            </div>
          )}
          {pendingListUI}
          {addIngredientUI}
        </section>

        <section>
          <h2 style={{ ...sectionHead, marginBottom: 12 }}>Totals</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <NumField label="Calories" value={calories} onChange={setCalories} />
            <NumField label="Protein g" value={macros.protein} onChange={(v) => setMacros((m) => ({ ...m, protein: v }))} />
            <NumField label="Carbs g"   value={macros.carbs}   onChange={(v) => setMacros((m) => ({ ...m, carbs:   v }))} />
            <NumField label="Fat g"     value={macros.fat}     onChange={(v) => setMacros((m) => ({ ...m, fat:     v }))} />
          </div>
        </section>

        {error && (
          <div style={{ background: T.dangerTint, color: T.danger, borderRadius: 14, padding: '12px 16px', fontSize: 15 }}>{error}</div>
        )}

        <PWButton variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy} style={{ width: '100%' }}>
          Delete meal
        </PWButton>
      </div>

      <PWActionBar>
        <PWButton variant="primary" onClick={onSave} disabled={busy} busy={saving} style={{ width: '100%' }}>
          Save changes
        </PWButton>
      </PWActionBar>

      <PWConfirm
        open={confirmDelete}
        title="Delete this meal?"
        message="This can't be undone."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {recalculating && <PWFactLoader label="Recalculating" photoSrc={meal.photo_url} name={name} />}
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, padding: '0 6px', textAlign: 'center' }}
      />
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', height: 52,
  background: T.tint, border: 'none', borderRadius: T.rInput, padding: '0 16px',
  fontSize: 16, fontFamily: 'inherit', color: T.ink, outline: 'none',
};
