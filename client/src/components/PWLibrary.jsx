// client/src/components/PWLibrary.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import { logSavedMeal } from '../lib/mealType.js';
import useLongPress from '../lib/useLongPress.js';
import PWNav from '../ui/PWNav.jsx';
import PWPlate from '../ui/PWPlate.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWLeader from '../ui/PWLeader.jsx';
import PWConfirm from './PWConfirm.jsx';

const COL_GAP = 14;

export default function PWLibrary({ onHome, onAddMeal, onHistory, onBack, onYou }) {
  const [tab, setTab]             = useState('meals');
  const [meals, setMeals]         = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [busyId, setBusyId]       = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type, id, name }
  const gridRef = useRef(null);
  const [colW, setColW] = useState(150);
  const toastTimer = useRef(null);

  const load = async () => {
    try {
      const [mRes, iRes] = await Promise.all([fetch('/api/saved-meals'), fetch('/api/saved-ingredients')]);
      if (mRes.ok) setMeals(await mRes.json());
      if (iRes.ok) setIngredients(await iRes.json());
    } catch {
      setError('Could not load library');
    }
  };

  useEffect(() => { load(); return () => clearTimeout(toastTimer.current); }, []);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const measure = () => setColW(Math.max(100, Math.floor((el.clientWidth - COL_GAP) / 2)));
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [tab]);

  const q = search.trim().toLowerCase();
  const filteredMeals = useMemo(() => meals.filter((m) => m.name.toLowerCase().includes(q)), [meals, q]);
  const filteredIngredients = useMemo(() => ingredients.filter((i) => i.name.toLowerCase().includes(q)), [ingredients, q]);

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const url = confirmTarget.type === 'meal' ? '/api/saved-meals' : '/api/saved-ingredients';
    try {
      await fetch(url, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmTarget.id }),
      });
    } catch {
      setError('Could not remove that item');
    }
    setConfirmTarget(null);
    load();
  };

  const showToast = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  const onLog = async (m) => {
    setBusyId(m.id);
    setError(null);
    try {
      await logSavedMeal(m);
      showToast('Logged');
      await load();
    } catch {
      setError('Could not log that meal');
    } finally {
      setBusyId(null);
    }
  };

  const pressProps = useLongPress((target) => setConfirmTarget(target));

  const removeButton = (target, label) => (
    <button className="pw-sr-only" onClick={() => setConfirmTarget(target)}>Remove {label}</button>
  );

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      padding: '28px 20px 120px', boxSizing: 'border-box',
    }}>

      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 'normal', margin: '0 0 16px', lineHeight: 1.15 }}>Library</h1>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 16px',
        background: T.tint, borderRadius: T.rInput, marginBottom: 14,
      }}>
        {PWIcon2.search(18, T.inkMute)}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search library"
          placeholder={tab === 'meals' ? 'Search meals' : 'Search ingredients'}
          style={{
            border: 'none', outline: 'none', fontSize: 16, fontFamily: T.fontBody,
            flex: 1, minWidth: 0, background: 'transparent', color: T.ink,
          }}
        />
      </div>

      <PWPills fill label="Library section" value={tab} onChange={setTab}
        options={[
          { value: 'meals', label: `Meals ${meals.length}` },
          { value: 'ingredients', label: `Ingredients ${ingredients.length}` },
        ]} />

      {error && <div style={{ color: T.danger, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', fontSize: 14, marginTop: 14 }}>{error}</div>}

      {tab === 'meals' ? (
        <>
          <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: COL_GAP, rowGap: 22, marginTop: 22 }}>
            {filteredMeals.map((m) => {
              const press = pressProps({ type: 'meal', id: m.id, name: m.name });
              return (
                <div key={m.id} aria-label={m.name} {...press} style={{ ...press.style, position: 'relative', minWidth: 0 }}>
                  <div style={{ position: 'relative', width: colW, margin: '0 auto' }}>
                    <PWPlate src={m.photo_url} name={m.name} size={colW} />
                    <button
                      onClick={() => onLog(m)}
                      disabled={busyId === m.id}
                      aria-label={`Log ${m.name}`}
                      style={{
                        position: 'absolute', right: -2, bottom: -2, width: 44, height: 44, padding: 0,
                        background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                      }}
                    >
                      <span style={{
                        width: 40, height: 40, borderRadius: '50%', background: T.ink, border: '3px solid #fff', boxSizing: 'border-box',
                        display: 'grid', placeItems: 'center', boxShadow: T.shadowSoft, opacity: busyId === m.id ? 0.6 : 1,
                      }}>
                        {PWIcon2.plus(16, '#fff')}
                      </span>
                    </button>
                  </div>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 17, marginTop: 12, lineHeight: 1.25,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{m.name}</div>
                  <div style={{ fontSize: 14, color: T.inkMute, marginTop: 3 }}>
                    {Math.round(m.calories)} kcal, used {m.use_count || 0} {m.use_count === 1 ? 'time' : 'times'}
                  </div>
                  {removeButton({ type: 'meal', id: m.id, name: m.name }, m.name)}
                </div>
              );
            })}
          </div>
          {filteredMeals.length === 0 && (
            <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 15, marginTop: 32 }}>
              {meals.length === 0 ? 'No saved meals yet. Use Save on the review screen.' : 'No meals match your search.'}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: 14 }}>
          {filteredIngredients.map((i) => {
            const target = { type: 'ingredient', id: i.id, name: i.name };
            const press = pressProps(target);
            return (
              <div key={i.id} {...press} style={{ ...press.style, borderBottom: `1px solid ${T.line}` }}>
                <PWLeader label={i.name} value={`${Math.round(i.calories)} kcal`} unit={`per ${i.default_unit || 'serving'}`} />
                {removeButton(target, i.name)}
              </div>
            );
          })}
          {filteredIngredients.length === 0 && (
            <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 15, marginTop: 32 }}>
              {ingredients.length === 0 ? 'No saved ingredients yet.' : 'No ingredients match your search.'}
            </div>
          )}
        </div>
      )}

      {(filteredMeals.length > 0 && tab === 'meals' || filteredIngredients.length > 0 && tab === 'ingredients') && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 14, marginTop: 24 }}>Press and hold to remove.</div>
      )}

      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(96px + env(safe-area-inset-bottom))',
          background: T.ink, color: T.onAccent, borderRadius: T.rPill, padding: '12px 22px', fontSize: 15, fontWeight: 600,
          boxShadow: T.shadowSoft, zIndex: 30, animation: 'pwFadeUp 0.2s ease both',
        }}>{toast}</div>
      )}

      <PWConfirm
        open={!!confirmTarget}
        title="Remove from library?"
        message={confirmTarget ? `Remove ${confirmTarget.name} from your library? This can't be undone.` : ''}
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      <PWNav active="library" onToday={onHome || onBack} onHistory={onHistory} onScan={onAddMeal} onLibrary={() => {}} onYou={onYou} />
    </div>
  );
}
