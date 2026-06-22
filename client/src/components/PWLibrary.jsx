// client/src/components/PWLibrary.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { T, PWIcon2, BottomNav } from '../tokens.jsx';

export default function PWLibrary({ onHome, onAddMeal, onHistory, onBack }) {
  const [tab, setTab]           = useState('ingredients');
  const [ingredients, setIngredients] = useState([]);
  const [meals, setMeals]       = useState([]);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ name: '', defaultUnit: 'g', calories: '', proteinG: '', carbsG: '', fatG: '' });
  const [error, setError]       = useState(null);

  const load = async () => {
    try {
      const [iRes, mRes] = await Promise.all([
        fetch('/api/saved-ingredients'),
        fetch('/api/saved-meals'),
      ]);
      if (iRes.ok) setIngredients(await iRes.json());
      if (mRes.ok) setMeals(await mRes.json());
    } catch {
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
    await fetch('/api/saved-ingredients', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const deleteMeal = async (id) => {
    await fetch('/api/saved-meals', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
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
    } catch {
      setError('Could not save ingredient');
    }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 100px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.heading, fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
          Library
        </div>
        {tab === 'ingredients' && (
          <button onClick={() => setShowAdd((s) => !s)} style={{
            width: 34, height: 34, borderRadius: 10, background: showAdd ? T.green : T.lineSoft,
            border: 'none', display: 'grid', placeItems: 'center',
            cursor: 'pointer', color: showAdd ? '#fff' : T.ink, fontSize: 20,
          }}>＋</button>
        )}
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
          placeholder="Search ingredients or meals…"
          style={{
            border: 'none', outline: 'none', fontSize: 14,
            fontFamily: T.font, flex: 1, background: 'transparent', color: T.ink,
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${T.lineSoft}` }}>
        {[['ingredients', 'Ingredients'], ['meals', 'Meals']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, textAlign: 'center', padding: '0 0 10px',
            background: 'none', border: 'none',
            borderBottom: tab === key ? `2.5px solid ${T.green}` : '2.5px solid transparent',
            marginBottom: -2,
            fontSize: 13.5, fontWeight: 600,
            color: tab === key ? T.green : T.inkFaint,
            cursor: 'pointer', fontFamily: T.font,
            transition: 'color 0.15s ease',
          }}>{lbl}</button>
        ))}
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}

      {/* Add ingredient form */}
      {showAdd && tab === 'ingredients' && (
        <div style={{
          background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14,
          padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
          boxShadow: T.shadowSoft,
        }}>
          <div style={{ fontFamily: T.heading, fontSize: 15, fontWeight: 700, color: T.ink }}>New Ingredient</div>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={miniInput} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Calories" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Unit (g)" value={form.defaultUnit} onChange={(e) => setForm((f) => ({ ...f, defaultUnit: e.target.value }))} style={{ ...miniInput, width: 70 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Protein g" value={form.proteinG} onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Carbs g" value={form.carbsG} onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
            <input placeholder="Fat g" value={form.fatG} onChange={(e) => setForm((f) => ({ ...f, fatG: e.target.value }))} style={{ ...miniInput, flex: 1 }} />
          </div>
          <button onClick={submitNewIngredient} style={{
            background: T.green, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: T.font,
          }}>Save ingredient</button>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tab === 'ingredients' && filteredIngredients.map((ing) => (
          <div key={ing.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{ing.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 2 }}>per {ing.default_unit || 'unit'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{Math.round(ing.calories)} cal</div>
                <div style={{ fontSize: 10.5, color: T.inkMute }}>{Math.round(ing.protein_g)}g protein</div>
              </div>
              <button onClick={() => deleteIngredient(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {PWIcon2.trash(14)}
              </button>
            </div>
          </div>
        ))}

        {tab === 'meals' && filteredMeals.map((m) => (
          <div key={m.id} style={rowStyle}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{m.name}</div>
              <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 2 }}>
                {(m.ingredients || []).length} ingredients · used {m.use_count}×
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{Math.round(m.calories)} cal</div>
              <button onClick={() => deleteMeal(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {PWIcon2.trash(14)}
              </button>
            </div>
          </div>
        ))}

        {tab === 'ingredients' && filteredIngredients.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 24 }}>
            No saved ingredients yet.
          </div>
        )}
        {tab === 'meals' && filteredMeals.length === 0 && (
          <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 24 }}>
            No saved meals yet — use "Save to library" from AI Review.
          </div>
        )}
      </div>

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

const miniInput = {
  border: `1.5px solid ${T.line}`, borderRadius: 8,
  padding: '8px 10px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none',
  color: '#271A0F',
};
