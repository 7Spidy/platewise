// client/src/components/PWReview.jsx
import React, { useState } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import { scaleIngredient, removeIngredient } from '../lib/scaleIngredients.js';
import PWFactLoader from './PWFactLoader.jsx';
import PWHero from '../ui/PWHero.jsx';
import PWStats from '../ui/PWStats.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWActionBar from '../ui/PWActionBar.jsx';
import PWIngredients from '../ui/PWIngredients.jsx';

const MEAL_TYPE_OPTIONS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((m) => ({ value: m, label: m }));

const sectionHead = { fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0, color: T.ink };
const addInput = {
  height: 48, border: 'none', borderRadius: 14, background: T.tint, padding: '0 14px',
  fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none', minWidth: 0,
};

export default function PWReview({ data, draft, onBack, onSaved }) {
  const [food, setFood]             = useState(data);
  const [mealType, setMealType]     = useState(draft.mealType);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);
  const [error, setError]           = useState(null);
  const [addingNew, setAddingNew]   = useState(false);
  const [newIng, setNewIng]         = useState({ name: '', quantity: '', unit: 'g' });

  // AI recalculation: only for added ingredients and unit changes.
  const recalc = async (ingredients) => {
    setRecalculating(true);
    setError(null);
    try {
      const desc = ingredients.map((i) => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: food.name, details: `Ingredients: ${desc}` }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error === 'scan_limit_reached' ? "You've used your scans for now." : (b.error || 'Could not recalculate'));
      }
      setFood(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setRecalculating(false);
    }
  };

  // Local edits: no network.
  const onScale = (idx, qty) => setFood((f) => ({ ...f, ...scaleIngredient(f, idx, qty) }));
  const onRemove = (idx) => setFood((f) => ({ ...f, ...removeIngredient(f, idx) }));
  const onUnitChange = (idx, qty, unit) => {
    recalc(food.ingredients.map((ing, i) => (i === idx ? { ...ing, quantity: qty, unit } : ing)));
  };

  const commitNewIngredient = () => {
    if (!newIng.name.trim() || !newIng.quantity) return;
    const next = [...food.ingredients, { ...newIng, quantity: Number(newIng.quantity) }];
    setAddingNew(false);
    setNewIng({ name: '', quantity: '', unit: 'g' });
    recalc(next);
  };

  const onSaveMeal = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: food.name, serving: food.serving, calories: food.calories,
          macros: food.macros, other: food.other, ingredients: food.ingredients,
          healthScore: food.healthScore, fact: food.fact, tips: food.tips,
          mismatch: food.mismatch,
          mealType: (mealType || '').toLowerCase(),
          imageBase64: draft.imageBase64, mimeType: draft.mimeType,
        }),
      });
      if (!res.ok) throw new Error('Could not save meal');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onSaveToLibrary = async () => {
    try {
      await fetch('/api/saved-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: food.name, ingredients: food.ingredients, calories: food.calories,
          proteinG: food.macros.protein, carbsG: food.macros.carbs, fatG: food.macros.fat,
          fiberG: food.other.fiber, sodiumMg: food.other.sodium, sugarG: food.other.sugar,
        }),
      });
      setSavedToLib(true);
    } catch {
      setError('Could not save to library');
    }
  };

  const busy = recalculating || saving;

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    }}>
      <PWHero onBack={onBack} src={draft.photo} name={food.name} />

      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 'normal', margin: 0, lineHeight: 1.15 }}>{food.name}</h1>
        {food.serving && <div style={{ fontSize: 15, color: T.inkMute, marginTop: 6 }}>{food.serving}</div>}
      </div>

      {food.mismatch && (
        <div style={{
          background: T.goldTint, color: T.factInk, borderRadius: T.rCard, padding: '14px 18px',
          margin: '16px 20px 0', fontSize: 15, lineHeight: 1.45,
        }}>
          The photo doesn't look like {food.name}. Check the ingredients before logging.
        </div>
      )}

      <div style={{ margin: '22px 0' }}>
        <PWStats calories={food.calories} protein={food.macros.protein} carbs={food.macros.carbs} fat={food.macros.fat} animate />
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 26 }}>

        <section>
          <h2 style={{ ...sectionHead, marginBottom: 12 }}>Meal</h2>
          <PWPills fill label="Meal type" value={mealType} onChange={setMealType} options={MEAL_TYPE_OPTIONS} />
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={sectionHead}>Ingredients</h2>
            <span style={{ fontSize: 15, color: T.inkMute }}>Tap to adjust</span>
          </div>
          <PWIngredients ingredients={food.ingredients} onScale={onScale} onRemove={onRemove} onUnitChange={onUnitChange} />

          {addingNew ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input aria-label="Ingredient name" placeholder="Name" value={newIng.name}
                onChange={(e) => setNewIng((n) => ({ ...n, name: e.target.value }))} style={{ ...addInput, flex: 1 }} />
              <input aria-label="Quantity" placeholder="Qty" inputMode="decimal" value={newIng.quantity}
                onChange={(e) => setNewIng((n) => ({ ...n, quantity: e.target.value }))} style={{ ...addInput, width: 64 }} />
              <input aria-label="Unit" placeholder="g" value={newIng.unit}
                onChange={(e) => setNewIng((n) => ({ ...n, unit: e.target.value }))} style={{ ...addInput, width: 56 }} />
              <PWButton variant="primary" onClick={commitNewIngredient} style={{ height: 48, padding: '0 16px', fontSize: 16 }}>Add</PWButton>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, background: 'none', border: 'none',
              color: T.sageInk, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: T.fontBody, padding: 0, marginTop: 4,
            }}>
              {PWIcon2.plus(18, T.sageInk)} Add ingredient
            </button>
          )}
        </section>

        <section style={{ display: 'flex', gap: 10 }}>
          {[
            ['Fiber', food.other.fiber, 'g'],
            ['Sugar', food.other.sugar, 'g'],
            ['Sodium', food.other.sodium, 'mg'],
          ].map(([l, v, u]) => (
            <div key={l} style={{ flex: 1, border: `1.5px solid ${T.line}`, borderRadius: T.rInput, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{Math.round(v)} {u}</div>
              <div style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </section>

        {food.fact && (
          <section style={{ background: T.goldTint, borderRadius: T.rCard, padding: '18px 20px' }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 18, lineHeight: 1.4, color: T.factInk }}>{food.fact}</div>
          </section>
        )}

        {Array.isArray(food.tips) && food.tips.length > 0 && (
          <section>
            <h2 style={{ ...sectionHead, marginBottom: 6 }}>Healthier swaps</h2>
            {food.tips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0',
                borderBottom: i < food.tips.length - 1 ? `1px solid ${T.line}` : 'none', fontSize: 16, lineHeight: 1.4,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{PWIcon2.check(20, T.sage)}</span>
                <span>{tip}</span>
              </div>
            ))}
          </section>
        )}

        {error && (
          <div style={{ background: T.dangerTint, color: T.danger, borderRadius: 14, padding: '12px 16px', fontSize: 15 }}>{error}</div>
        )}
      </div>

      <PWActionBar>
        <PWButton variant="secondary" onClick={onSaveToLibrary} disabled={savedToLib || busy} style={{ flex: 1 }}>
          {savedToLib ? 'Saved' : 'Save'}
        </PWButton>
        <PWButton variant="primary" onClick={onSaveMeal} disabled={busy} busy={saving} style={{ flex: 1.5 }}>
          Log meal
        </PWButton>
      </PWActionBar>

      {recalculating && <PWFactLoader label="Recalculating" photoSrc={draft.photo} name={food.name} />}
    </div>
  );
}
