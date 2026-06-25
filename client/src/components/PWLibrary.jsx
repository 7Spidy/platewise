// client/src/components/PWLibrary.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWIcon2, BottomNav } from '../tokens.jsx';
import PWConfirm from './PWConfirm.jsx';

export default function PWLibrary({ onHome, onAddMeal, onHistory, onBack }) {
  const [meals, setMeals]   = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type, id, name }

  const load = async () => {
    try {
      const mRes = await fetch('/api/saved-meals');
      if (mRes.ok) setMeals(await mRes.json());
    } catch {
      setError('Could not load library');
    }
  };

  useEffect(() => { load(); }, []);

  const filteredMeals = useMemo(
    () => meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [meals, search]
  );

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'meal') {
      await fetch('/api/saved-meals', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmTarget.id }),
      });
    } else if (confirmTarget.type === 'ingredient') {
      await fetch('/api/saved-ingredients', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmTarget.id }),
      });
    }
    setConfirmTarget(null);
    load();
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 100px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* Header */}
      <div style={{ fontFamily: T.heading, fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
        Library
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: `1.5px solid ${T.line}`, borderRadius: 12, padding: '10px 14px',
        boxShadow: T.shadowSoft,
      }}>
        {PWIcon2.search(15)}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals…"
          style={{
            border: 'none', outline: 'none', fontSize: 14,
            fontFamily: T.font, flex: 1, background: 'transparent', color: T.ink,
          }}
        />
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}

      {/* Meals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {filteredMeals.map((m) => (
          <div key={m.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{m.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 2 }}>
                {(m.ingredients || []).length} ingredients · used {m.use_count}×
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{Math.round(m.calories)} cal</div>
              <button
                onClick={() => setConfirmTarget({ type: 'meal', id: m.id, name: m.name })}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {PWIcon2.trash(14)}
              </button>
            </div>
          </div>
        ))}

        {filteredMeals.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 24 }}>
            No saved meals yet — use "Save to library" from AI Review.
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <PWConfirm
        open={!!confirmTarget}
        title="Delete from library?"
        message={confirmTarget ? `"${confirmTarget.name}" will be permanently removed. This can't be undone.` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Bottom Nav */}
      <BottomNav
        active="library"
        onHome={onHome || onBack}
        onAdd={onAddMeal}
        onHistory={onHistory}
        onLibrary={undefined}
      />
    </div>
  );
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 12,
  padding: '12px 14px', boxShadow: '0 1px 3px rgba(39,26,15,0.04)',
};
