// client/src/components/PWHistory.jsx
import React, { useEffect, useState } from 'react';
import { T, PWIcon2, isoDate } from '../tokens.jsx';

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}
function fmtRange(start, end) {
  const f = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${f(start)} – ${f(end)}`;
}
function fmtDayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PWHistory({ onBack, onEditMeal }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [days, setDays] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [target, setTarget] = useState(2200);
  const [error, setError] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [loggingAgain, setLoggingAgain] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', quantity: '', unit: 'g' });
  const [recalculating, setRecalculating] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const weekEnd = addDays(weekStart, 6);
  const today = isoDate(new Date());

  const load = async () => {
    try {
      const [histRes, settingsRes] = await Promise.all([
        fetch(`/api/meals-history?start=${isoDate(weekStart)}&end=${isoDate(weekEnd)}`),
        fetch('/api/settings'),
      ]);
      if (histRes.ok) {
        const data = await histRes.json();
        setDays(data.days);
        const firstPast = data.days.find((d) => d.date <= today);
        if (firstPast) setOpenDay(firstPast.date);
        else if (data.days.length) setOpenDay(data.days[0].date);
      }
      if (settingsRes.ok) setTarget((await settingsRes.json()).target_calories || 2200);
    } catch (e) {
      setError('Could not load history');
    }
  };

  useEffect(() => { load(); }, [weekStart]);

  const calColor = (cal) => {
    if (cal === 0) return T.inkFaint;
    if (cal <= target) return T.greenInk;
    if (cal <= target * 1.1) return T.amber;
    return T.red;
  };

  const allDays = [];
  for (let i = 0; i < 7; i++) {
    const d = isoDate(addDays(weekStart, i));
    if (d > today) continue; // skip future dates
    const existing = (days || []).find((x) => x.date === d);
    allDays.push(existing || { date: d, total_calories: 0, meals: [] });
  }
  allDays.sort((a, b) => (a.date < b.date ? 1 : -1));

  const onLogAgain = async () => {
    setLoggingAgain(true);
    setDetailError(null);
    try {
      const res = await fetch('/api/log-again', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedMeal.id }),
      });
      if (!res.ok) throw new Error('Could not log again');
      setSelectedMeal(null);
      load();
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setLoggingAgain(false);
    }
  };

  const recalcIngredients = async (ingredients) => {
    setRecalculating(true);
    setDetailError(null);
    try {
      const desc = ingredients.map((i) => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedMeal.name, details: `Ingredients: ${desc}` }),
      });
      if (!res.ok) throw new Error('Could not recalculate');
      const updated = await res.json();
      setSelectedMeal((m) => ({ ...m, ingredients: updated.ingredients, calories: updated.calories }));
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setRecalculating(false);
    }
  };

  const commitNewIngredient = () => {
    if (!newIng.name.trim() || !newIng.quantity) return;
    const next = [...(selectedMeal.ingredients || []), { ...newIng, quantity: Number(newIng.quantity) }];
    setAddingNew(false);
    setNewIng({ name: '', quantity: '', unit: 'g' });
    recalcIngredients(next);
  };

  if (selectedMeal) {
    const m = selectedMeal;
    const ingredients = m.ingredients || [];
    return (
      <div style={{
        width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
        padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { setSelectedMeal(null); setAddingNew(false); setDetailError(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Meal Details</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onLogAgain} disabled={loggingAgain}
              style={{ background: 'none', border: `1px solid ${T.line}`, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, color: T.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loggingAgain ? '…' : '↻ Log again'}
            </button>
            <button onClick={() => onEditMeal(m)}
              style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 999, padding: '5px 13px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Edit
            </button>
          </div>
        </div>

        {m.photo_url && (
          <div style={{ height: 180, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.line}` }}>
            <img src={m.photo_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{m.name}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>
            {new Date(m.created_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            <Stat v={Math.round(m.calories)} l="kcal" />
            <Stat v={`${Math.round(m.protein_g || 0)}g`} l="protein" />
            <Stat v={`${Math.round(m.carbs_g || 0)}g`} l="carbs" />
            <Stat v={`${Math.round(m.fat_g || 0)}g`} l="fat" />
          </div>
        </div>

        {ingredients.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Ingredients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ingredients.map((ing, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff', border: `1px solid ${T.lineSoft}`, borderRadius: 9, padding: '8px 11px',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{ing.name}</span>
                  <span style={{ fontSize: 12.5, color: T.inkMute }}>{ing.quantity}{ing.unit}</span>
                </div>
              ))}
            </div>
            {addingNew ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input autoFocus placeholder="Name" value={newIng.name} onChange={(e) => setNewIng((n) => ({ ...n, name: e.target.value }))}
                  style={{ flex: 1, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
                <input placeholder="Qty" value={newIng.quantity} onChange={(e) => setNewIng((n) => ({ ...n, quantity: e.target.value }))}
                  style={{ width: 55, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
                <input placeholder="g" value={newIng.unit} onChange={(e) => setNewIng((n) => ({ ...n, unit: e.target.value }))}
                  style={{ width: 40, border: `1px solid ${T.line}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit' }} />
                <button onClick={commitNewIngredient}
                  style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 12 }}>Add</button>
              </div>
            ) : (
              <button onClick={() => setAddingNew(true)}
                style={{ background: 'none', border: 'none', color: T.green, fontSize: 12, fontWeight: 600, marginTop: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add ingredient
              </button>
            )}
            {recalculating && <div style={{ fontSize: 12, color: T.inkMute, textAlign: 'center', marginTop: 6 }}>Recalculating…</div>}
          </div>
        )}

        {detailError && (
          <div style={{ background: T.red50, color: T.red, borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>⚠ {detailError}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.chevLeft(18)}</button>
        <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>History</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, padding: '8px 12px' }}>
        <button onClick={() => setWeekStart((w) => addDays(w, -7))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{PWIcon2.chevLeft(14)}</button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>{fmtRange(weekStart, weekEnd)}</span>
        <button
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          disabled={isoDate(addDays(weekStart, 7)) > today}
          style={{ background: 'none', border: 'none', cursor: isoDate(addDays(weekStart, 7)) > today ? 'default' : 'pointer', opacity: isoDate(addDays(weekStart, 7)) > today ? 0.3 : 1 }}>
          {PWIcon2.chevRight(14, T.ink)}
        </button>
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}
      {days === null && !error && <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>Loading…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days !== null && allDays.map((day) => {
          const isOpen = openDay === day.date;
          return (
            <div key={day.date} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
              <button onClick={() => setOpenDay(isOpen ? null : day.date)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: T.ink }}>
                  <span style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', display: 'inline-flex' }}>{PWIcon2.chevDown(11)}</span>
                  {fmtDayLabel(day.date)}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: calColor(day.total_calories) }}>
                  {day.total_calories > 0 ? `${Math.round(day.total_calories)} kcal` : '—'}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {day.meals.length === 0 && (
                    <div style={{ fontSize: 12, color: T.inkFaint, padding: '4px 0' }}>— no meals logged</div>
                  )}
                  {day.meals.map((m) => (
                    <button key={m.id} onClick={() => setSelectedMeal(m)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: T.lineSoft, border: 'none', borderRadius: 8, padding: '7px 10px',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    }}>
                      <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 500 }}>
                        {m.name}
                        <span style={{ color: T.inkFaint, fontWeight: 400 }}> · {new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                      </span>
                      <span style={{ fontSize: 12, color: T.inkMute }}>{Math.round(m.calories)} cal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
