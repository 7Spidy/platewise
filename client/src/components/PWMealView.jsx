// client/src/components/PWMealView.jsx — read-only meal detail modal
import React from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

function fmt(val, unit) {
  return val != null ? `${Math.round(val)}${unit}` : '—';
}

export default function PWMealView({ meal, onClose, onEdit, onShare }) {
  if (!meal) return null;

  const timeLabel = new Date(meal.created_at).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
  const typeLine = [timeLabel, meal.meal_type].filter(Boolean).join(' · ');

  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.35)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 100, padding: '0 0 0 0',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: T.shadow,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Photo or placeholder */}
        {meal.photo_url
          ? <img
              src={meal.photo_url}
              alt={meal.name}
              style={{
                width: '100%', height: 200, objectFit: 'cover',
                borderRadius: '20px 20px 0 0', flexShrink: 0,
              }}
            />
          : <div style={{
              width: '100%', height: 160, borderRadius: '20px 20px 0 0',
              background: T.lineSoft, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {PWIcon2.plate(48, T.inkFaint)}
            </div>
        }

        {/* Content */}
        <div style={{ padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name + meta */}
          <div>
            <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {meal.name}
            </div>
            {typeLine && (
              <div style={{ fontSize: 12, color: T.inkMute, marginTop: 4 }}>{typeLine}</div>
            )}
          </div>

          {/* Calories */}
          <div style={{ fontFamily: T.heading, fontSize: 36, fontWeight: 700, color: T.green, lineHeight: 1 }}>
            {Math.round(meal.calories)}
            <span style={{ fontSize: 14, fontWeight: 400, color: T.inkMute, fontFamily: T.font }}> kcal</span>
          </div>

          {/* Macros */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Carbs',   value: meal.carbs_g,   unit: 'g', color: T.amber },
              { label: 'Protein', value: meal.protein_g, unit: 'g', color: T.sage },
              { label: 'Fat',     value: meal.fat_g,     unit: 'g', color: T.fat },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{
                flex: 1, background: T.lineSoft, borderRadius: 10, padding: '9px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{fmt(value, unit)}</div>
                <div style={{ fontSize: 9.5, color: T.inkMute, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Micros */}
          <div style={{ background: T.lineSoft, borderRadius: 12, overflow: 'hidden' }}>
            {[
              ['Fiber',  meal.fiber_g,   'g'],
              ['Sugar',  meal.sugar_g,   'g'],
              ['Sodium', meal.sodium_mg, 'mg'],
            ].map(([label, val, unit], i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: i < 2 ? `1px solid ${T.line}` : 'none',
              }}>
                <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{fmt(val, unit)}</span>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Ingredients
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ingredients.map((ing, i) => (
                  <div key={i} style={{ fontSize: 13, color: T.inkSoft, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{ing.name}</span>
                    <span style={{ color: T.inkFaint }}>{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={onEdit}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1.5px solid ${T.line}`, background: '#fff',
                cursor: 'pointer', fontFamily: T.font, fontSize: 14,
                fontWeight: 600, color: T.inkSoft,
              }}
            >
              Edit
            </button>
            <button
              onClick={onShare}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: 'none', background: T.green, color: '#fff',
                cursor: 'pointer', fontFamily: T.font, fontSize: 14,
                fontWeight: 700,
              }}
            >
              Share PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
