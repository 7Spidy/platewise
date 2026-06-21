// client/src/components/PWLibrary.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

export default function PWLibrary({ onBack }) {
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await fetch('/api/saved-meals');
      if (res.ok) setMeals(await res.json());
    } catch (e) {
      setError('Could not load library');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [meals, search]
  );

  const deleteMeal = async (id) => {
    await fetch('/api/saved-meals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
        <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Saved Foods</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, padding: '8px 11px' }}>
        {PWIcon2.search(14)}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved meals…"
          style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, background: 'transparent' }} />
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((m) => (
          <div key={m.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{m.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint }}>
                {(m.ingredients || []).length} ingredients · used {m.use_count}×
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{Math.round(m.calories)} cal</div>
                <div style={{ fontSize: 10.5, color: T.inkMute }}>{Math.round(m.protein_g)}g protein</div>
              </div>
              <button onClick={() => deleteMeal(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{PWIcon2.trash(13)}</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 12.5, marginTop: 20 }}>
            No saved meals yet — use "Save to Quick Library" from AI Review.
          </div>
        )}
      </div>
    </div>
  );
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: '10px 12px',
};
