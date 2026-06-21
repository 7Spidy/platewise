// client/src/components/PWLibrary.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

export default function PWLibrary({ onBack }) {
  const [tab, setTab] = useState('ingredients'); // 'ingredients' | 'meals'
  const [ingredients, setIngredients] = useState([]);
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', defaultUnit: 'g', calories: '', proteinG: '', carbsG: '', fatG: '' });
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [iRes, mRes] = await Promise.all([fetch('/api/saved-ingredients'), fetch('/api/saved-meals')]);
      if (iRes.ok) setIngredients(await iRes.json());
      if (mRes.ok) setMeals(await mRes.json());
    } catch (e) {
      setError('Could not load library');
    }
  };

  useEffect(() => { load(); }, []);

  const filteredIngredients = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [ingredients, search]
  );
  const filteredMeals = useMemo(
    () => meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [meals, search]
  );

  const deleteIngredient = async (id) => {
    await fetch('/api/saved-ingredients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };
  const deleteMeal = async (id) => {
    await fetch('/api/saved-meals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const submitNewIngredient = async () => {
    if (!form.name.trim() || !form.calories) return;
    try {
      await fetch('/api/saved-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), defaultUnit: form.defaultUnit,
          calories: Number(form.calories), proteinG: Number(form.proteinG) || 0,
          carbsG: Number(form.carbsG) || 0, fatG: Number(form.fatG) || 0,
        }),
      });
      setShowAdd(false);
      setForm({ name: '', defaultUnit: 'g', calories: '', proteinG: '', carbsG: '', fatG: '' });
      load();
    } catch (e) {
      setError('Could not save ingredient');
    }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Saved Foods</div>
        </div>
        {tab === 'ingredients' && (
          <button onClick={() => setShowAdd((s) => !s)} style={{
            width: 32, height: 32, borderRadius: 10, background: T.lineSoft, border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18, color: T.ink,
          }}>＋</button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, padding: '8px 11px' }}>
        {PWIcon2.search(14)}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients or meals…"
          style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, background: 'transparent' }} />
      </div>

      <div style={{ display: 'flex', borderBottom: `2px solid ${T.line}` }}>
        {[['ingredients', 'Ingredients'], ['meals', 'Meals']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, textAlign: 'center', padding: '0 0 9px', background: 'none', border: 'none',
            borderBottom: tab === key ? `2px solid ${T.green}` : '2px solid transparent', marginBottom: -2,
            fontSize: 13, fontWeight: 600, color: tab === key ? T.greenInk : T.inkFaint, cursor: 'pointer', fontFamily: 'inherit',
          }}>{lbl}</button>
        ))}
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}

      {showAdd && tab === 'ingredients' && (
        <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={miniInput} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="Calories" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Unit (g)" value={form.defaultUnit} onChange={(e) => setForm((f) => ({ ...f, defaultUnit: e.target.value }))} style={{ ...miniInput, width: 70 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="Protein g" value={form.proteinG} onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Carbs g" value={form.carbsG} onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Fat g" value={form.fatG} onChange={(e) => setForm((f) => ({ ...f, fatG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
          </div>
          <button onClick={submitNewIngredient} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>Save ingredient</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tab === 'ingredients' && filteredIngredients.map((ing) => (
          <div key={ing.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{ing.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint }}>per {ing.default_unit || 'unit'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{Math.round(ing.calories)} cal</div>
                <div style={{ fontSize: 10.5, color: T.inkMute }}>{Math.round(ing.protein_g)}g protein</div>
              </div>
              <button onClick={() => deleteIngredient(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{PWIcon2.trash(13)}</button>
            </div>
          </div>
        ))}
        {tab === 'meals' && filteredMeals.map((m) => (
          <div key={m.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{m.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint }}>{(m.ingredients || []).length} ingredients · used {m.use_count}×</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{Math.round(m.calories)} cal</div>
              <button onClick={() => deleteMeal(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{PWIcon2.trash(13)}</button>
            </div>
          </div>
        ))}
        {tab === 'ingredients' && filteredIngredients.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 12.5, marginTop: 20 }}>No saved ingredients yet.</div>
        )}
        {tab === 'meals' && filteredMeals.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 12.5, marginTop: 20 }}>No saved meals yet — use "Save to library" from AI Review.</div>
        )}
      </div>
    </div>
  );
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: '10px 12px',
};

const miniInput = {
  border: `1px solid ${T.line}`, borderRadius: 7, padding: '7px 9px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
};
