// client/src/components/PWReview.jsx
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { T, PWIcon2 } from '../tokens.jsx';

export default function PWReview({ data, draft, onBack, onSaved }) {
  const [food, setFood]             = useState(data);
  const cardRef                     = useRef(null);
  const [exportToast, setExportToast]   = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);
  const [error, setError]           = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQty, setDraftQty]     = useState('');
  const [draftUnit, setDraftUnit]   = useState('');
  const [addingNew, setAddingNew]   = useState(false);
  const [newIng, setNewIng]         = useState({ name: '', quantity: '', unit: 'g' });

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
        throw new Error(b.error || 'Could not recalculate');
      }
      setFood(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setRecalculating(false);
    }
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setDraftQty(String(food.ingredients[idx].quantity));
    setDraftUnit(food.ingredients[idx].unit);
  };

  const commitEdit = () => {
    const next = food.ingredients.map((ing, i) =>
      i === editingIdx
        ? { ...ing, quantity: Number(draftQty) || ing.quantity, unit: draftUnit || ing.unit }
        : ing
    );
    setEditingIdx(null);
    recalc(next);
  };

  const removeIngredient = (idx) => {
    const next = food.ingredients.filter((_, i) => i !== idx);
    if (next.length === 0) return;
    recalc(next);
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
          mealType: (draft.mealType || '').toLowerCase(),
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

  const onExport = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#FFFFFF', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `platewise-${food.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setExportToast('Downloaded ✓');
    } catch {
      setExportToast('Export failed');
    }
    setTimeout(() => setExportToast(null), 2200);
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{
            width: 34, height: 34, borderRadius: 10, background: T.lineSoft,
            border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            {PWIcon2.chevLeft(16, T.green)}
          </button>
          <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
            Review
          </div>
        </div>
        <button onClick={onExport} title="Export as image" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: T.inkMute, padding: 4,
        }}>⭳</button>
      </div>

      {exportToast && (
        <div style={{ fontSize: 11.5, color: T.green, textAlign: 'right' }}>{exportToast}</div>
      )}

      {/* Meal identity card */}
      <div ref={cardRef} style={{
        display: 'flex', gap: 12, alignItems: 'center',
        background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, padding: 14,
        boxShadow: T.shadowSoft,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: draft.photo ? `url(${draft.photo}) center/cover` : T.lineSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {!draft.photo && '🍽️'}
        </div>
        <div>
          <div style={{ fontFamily: T.heading, fontSize: 16, fontWeight: 700, color: T.ink }}>{food.name}</div>
          <div style={{ fontSize: 11, color: T.green, fontWeight: 600, marginTop: 2 }}>
            {food.healthScore >= 7 ? 'High confidence' : food.healthScore >= 4 ? 'Medium confidence' : 'Low confidence'}
          </div>
        </div>
      </div>

      {food.mismatch && (
        <div style={{ background: T.amber50, color: T.amber, borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
          ⚠ The photo may not match the name/details you entered.
        </div>
      )}

      {/* Calorie + macro summary */}
      <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden', boxShadow: T.shadowSoft }}>
        <div style={{ textAlign: 'center', padding: '20px 20px 10px' }}>
          <div style={{ fontFamily: T.heading, fontSize: 52, fontWeight: 700, color: T.green, lineHeight: 1 }}>
            {Math.round(food.calories)}
          </div>
          <div style={{ fontSize: 12, color: T.inkMute, marginTop: 4 }}>calories</div>
        </div>
        <div style={{ display: 'flex', borderTop: `1px solid ${T.lineSoft}` }}>
          {[
            { v: `${Math.round(food.macros.protein)}g`, l: 'Protein' },
            { v: `${Math.round(food.macros.carbs)}g`,   l: 'Carbs'   },
            { v: `${Math.round(food.macros.fat)}g`,     l: 'Fat'     },
          ].map(({ v, l }, i) => (
            <div key={l} style={{
              flex: 1, textAlign: 'center', padding: '12px 8px',
              borderRight: i < 2 ? `1px solid ${T.lineSoft}` : 'none',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{v}</div>
              <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro bars */}
      <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, padding: '16px', boxShadow: T.shadowSoft }}>
        {[
          { label: 'Protein',       value: food.macros.protein, max: 200, color: T.green },
          { label: 'Carbohydrates', value: food.macros.carbs,   max: 300, color: T.amber },
          { label: 'Fat',           value: food.macros.fat,     max: 100, color: T.inkMute },
        ].map(({ label, value, max, color }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: T.inkMute }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{Math.round(value)}g</span>
            </div>
            <div style={{ height: 6, background: T.lineSoft, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (value / max) * 100)}%`, height: '100%',
                background: color, borderRadius: 3, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Ingredients — tap qty to edit
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {food.ingredients.map((ing, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: '9px 12px',
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: T.ink }}>{ing.name}</span>
              {editingIdx === idx ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input autoFocus value={draftQty} onChange={(e) => setDraftQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    style={miniInput} />
                  <input value={draftUnit} onChange={(e) => setDraftUnit(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    style={{ ...miniInput, width: 40 }} />
                  <button onClick={commitEdit} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, padding: '5px 8px', cursor: 'pointer' }}>✓</button>
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

        {addingNew ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input placeholder="Name" value={newIng.name} onChange={(e) => setNewIng((n) => ({ ...n, name: e.target.value }))}
              style={{ flex: 1, ...miniInput }} />
            <input placeholder="Qty" value={newIng.quantity} onChange={(e) => setNewIng((n) => ({ ...n, quantity: e.target.value }))}
              style={{ width: 55, ...miniInput }} />
            <input placeholder="g" value={newIng.unit} onChange={(e) => setNewIng((n) => ({ ...n, unit: e.target.value }))}
              style={{ width: 40, ...miniInput }} />
            <button onClick={commitNewIngredient} style={{
              background: T.green, color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 12,
            }}>Add</button>
          </div>
        ) : (
          <button onClick={() => setAddingNew(true)} style={{
            background: 'none', border: 'none', color: T.green, fontSize: 12.5,
            fontWeight: 600, marginTop: 8, cursor: 'pointer', fontFamily: T.font,
          }}>+ Add ingredient</button>
        )}
      </div>

      {recalculating && (
        <div style={{ fontSize: 12, color: T.inkMute, textAlign: 'center' }}>Recalculating…</div>
      )}

      {error && (
        <div style={{ background: T.red50, color: T.red, borderRadius: 12, padding: '10px 14px', fontSize: 12.5 }}>⚠ {error}</div>
      )}

      <button onClick={onSaveToLibrary} disabled={savedToLib} style={{
        background: '#fff', border: `1.5px solid ${savedToLib ? T.green : T.line}`,
        color: savedToLib ? T.green : T.inkSoft,
        borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: T.font,
      }}>
        {savedToLib ? '✓ Saved to library' : 'Save to library'}
      </button>

      <button onClick={onSaveMeal} disabled={saving} style={{
        background: T.green, color: '#fff', border: 'none', borderRadius: 14,
        padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        fontFamily: T.font, boxShadow: '0 6px 20px rgba(196,103,74,0.3)',
      }}>
        {saving ? 'Saving…' : 'Log this meal →'}
      </button>
    </div>
  );
}

const miniInput = {
  width: 50, border: `1.5px solid ${T.line}`, borderRadius: 7,
  padding: '4px 7px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
};
