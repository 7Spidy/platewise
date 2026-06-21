// client/src/components/PWReview.jsx
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { T, PWIcon2 } from '../tokens.jsx';

export default function PWReview({ data, draft, onBack, onSaved }) {
  const [food, setFood] = useState(data);
  const cardRef = useRef(null);
  const [exportToast, setExportToast] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);
  const [error, setError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', quantity: '', unit: 'g' });

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
      const updated = await res.json();
      setFood(updated);
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
      i === editingIdx ? { ...ing, quantity: Number(draftQty) || ing.quantity, unit: draftUnit || ing.unit } : ing
    );
    setEditingIdx(null);
    recalc(next);
  };

  const removeIngredient = (idx) => {
    const next = food.ingredients.filter((_, i) => i !== idx);
    if (next.length === 0) return; // keep at least one
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
          name: food.name,
          serving: food.serving,
          calories: food.calories,
          macros: food.macros,
          other: food.other,
          ingredients: food.ingredients,
          healthScore: food.healthScore,
          fact: food.fact,
          tips: food.tips,
          mismatch: food.mismatch,
          mealType: (draft.mealType || '').toLowerCase(),
          imageBase64: draft.imageBase64,
          mimeType: draft.mimeType,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'Could not save meal');
      }
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
          name: food.name,
          ingredients: food.ingredients,
          calories: food.calories,
          proteinG: food.macros.protein,
          carbsG: food.macros.carbs,
          fatG: food.macros.fat,
          fiberG: food.other.fiber,
          sodiumMg: food.other.sodium,
          sugarG: food.other.sugar,
        }),
      });
      setSavedToLib(true);
    } catch (e) {
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
    } catch (e) {
      setExportToast('Export failed');
    }
    setTimeout(() => setExportToast(null), 2200);
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Review &amp; Confirm</div>
        </div>
        <button onClick={onExport} title="Export as image" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.inkMute }}>⭳</button>
      </div>

      {exportToast && <div style={{ fontSize: 11.5, color: T.greenInk, textAlign: 'right' }}>{exportToast}</div>}

      <div ref={cardRef} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: 12 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
          background: draft.photo ? `url(${draft.photo}) center/cover` : `linear-gradient(135deg,#FDE68A,#FCA5A5)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{!draft.photo && '🍽️'}</div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{food.name}</div>
          <div style={{ fontSize: 11, color: T.greenInk, fontWeight: 600, display: 'flex', gap: 4, alignItems: 'center' }}>
            ● ● ● {food.healthScore >= 7 ? 'High confidence' : food.healthScore >= 4 ? 'Medium confidence' : 'Low confidence'}
          </div>
        </div>
      </div>

      {food.mismatch && (
        <div style={{ background: T.amber50, color: T.amber, borderRadius: 10, padding: '9px 12px', fontSize: 12 }}>
          ⚠ The photo may not match the name/details you entered.
        </div>
      )}

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
          Ingredients — tap qty to edit
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {food.ingredients.map((ing, idx) => (
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

        {addingNew ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={newIng.name} onChange={(e) => setNewIng((n) => ({ ...n, name: e.target.value }))}
              style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
            <input placeholder="Qty" value={newIng.quantity} onChange={(e) => setNewIng((n) => ({ ...n, quantity: e.target.value }))}
              style={{ width: 55, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
            <input placeholder="g" value={newIng.unit} onChange={(e) => setNewIng((n) => ({ ...n, unit: e.target.value }))}
              style={{ width: 40, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
            <button onClick={commitNewIngredient} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 12 }}>Add</button>
          </div>
        ) : (
          <button onClick={() => setAddingNew(true)} style={{ background: 'none', border: 'none', color: T.green, fontSize: 12, fontWeight: 600, marginTop: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add ingredient
          </button>
        )}
      </div>

      {recalculating && <div style={{ fontSize: 12, color: T.inkMute, textAlign: 'center' }}>Recalculating…</div>}

      <div style={{ background: T.lineSoft, borderRadius: 10, padding: '10px 6px', display: 'flex', justifyContent: 'space-around' }}>
        <Stat v={Math.round(food.calories)} l="kcal" />
        <Stat v={`${Math.round(food.macros.protein)}g`} l="protein" />
        <Stat v={`${Math.round(food.macros.carbs)}g`} l="carbs" />
        <Stat v={`${Math.round(food.macros.fat)}g`} l="fat" />
      </div>

      {error && <div style={{ background: T.red50, color: T.red, borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>⚠ {error}</div>}

      <button onClick={onSaveToLibrary} disabled={savedToLib} style={{
        background: '#fff', border: `1px solid ${T.line}`, color: savedToLib ? T.greenInk : T.ink,
        borderRadius: 10, padding: '11px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>{savedToLib ? '✓ Saved to Quick Library' : 'Save to Quick Library'}</button>

      <button onClick={onSaveMeal} disabled={saving} style={{
        background: T.green, color: '#fff', border: 'none', borderRadius: 10,
        padding: '13px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>{saving ? 'Saving…' : 'Save Meal →'}</button>
    </div>
  );
}

function Stat({ v, l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{v}</span>
      <span style={{ fontSize: 9, color: T.inkFaint }}>{l}</span>
    </div>
  );
}
