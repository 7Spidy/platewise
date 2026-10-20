import React, { useRef, useState } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import PWLeader from './PWLeader.jsx';
import PWButton from './PWButton.jsx';
import { stepFor } from '../lib/scaleIngredients.js';

const round2 = (n) => Math.round(n * 100) / 100;

const inputStyle = {
  height: 48, border: 'none', borderRadius: 14, background: '#fff', padding: '0 14px',
  fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none', minWidth: 0,
};

function StepButton({ label, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} style={{
      width: 44, height: 44, background: 'none', border: 'none', padding: 0, flexShrink: 0,
      display: 'grid', placeItems: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1,
    }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', background: T.tint, display: 'grid', placeItems: 'center' }}>
        {children}
      </span>
    </button>
  );
}

// Ingredient rows with local +/- steppers. Same-unit quantity changes go through onScale (no AI);
// unit changes go through onUnitChange (AI recalculation).
export default function PWIngredients({ ingredients, onScale, onRemove, onUnitChange }) {
  const base = useRef(new Map());
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftUnit, setDraftUnit] = useState('');

  const origOf = (ing) => {
    const key = `${ing.name}|${ing.unit}`;
    if (!base.current.has(key)) base.current.set(key, ing.quantity);
    return base.current.get(key);
  };

  const start = (idx) => {
    setEditingIdx(idx);
    setDraftQty(String(ingredients[idx].quantity));
    setDraftUnit(ingredients[idx].unit);
  };

  const commit = () => {
    const idx = editingIdx;
    const ing = ingredients[idx];
    const qty = Number(draftQty) || ing.quantity;
    const unit = draftUnit.trim() || ing.unit;
    setEditingIdx(null);
    if (unit !== ing.unit) onUnitChange(idx, qty, unit);
    else if (qty !== ing.quantity) onScale(idx, qty);
  };

  return (
    <div>
      {ingredients.map((ing, idx) => {
        if (editingIdx === idx) {
          return (
            <div key={idx} style={{ background: T.tint, borderRadius: T.rInput, padding: 14, margin: '6px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{ing.name}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input autoFocus inputMode="decimal" aria-label="Quantity" value={draftQty}
                  onChange={(e) => setDraftQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                  style={{ ...inputStyle, flex: 1 }} />
                <input aria-label="Unit" value={draftUnit}
                  onChange={(e) => setDraftUnit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                  style={{ ...inputStyle, width: 90 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <PWButton variant="primary" onClick={commit} style={{ height: 48, flex: 1, fontSize: 16 }}>Done</PWButton>
                <PWButton variant="secondary" onClick={() => setEditingIdx(null)} style={{ height: 48, fontSize: 16 }}>Cancel</PWButton>
                {ingredients.length > 1 && (
                  <button onClick={() => { setEditingIdx(null); onRemove(idx); }} style={{
                    minHeight: 48, padding: '0 8px', background: 'none', border: 'none', color: T.danger,
                    fontSize: 16, fontWeight: 600, fontFamily: T.fontBody, cursor: 'pointer',
                  }}>Remove</button>
                )}
              </div>
            </div>
          );
        }
        const step = stepFor(ing.unit, origOf(ing));
        const down = round2(ing.quantity - step);
        const up = round2(ing.quantity + step);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.line}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <PWLeader label={ing.name} value={ing.quantity} unit={ing.unit} onClick={() => start(idx)} strong={false} />
            </div>
            <StepButton label={`Decrease ${ing.name}`} disabled={down < step} onClick={() => onScale(idx, down)}>
              {PWIcon2.minus(16, T.ink)}
            </StepButton>
            <StepButton label={`Increase ${ing.name}`} onClick={() => onScale(idx, up)}>
              {PWIcon2.plus(16, T.ink)}
            </StepButton>
          </div>
        );
      })}
    </div>
  );
}
