// client/src/components/PWHistory.jsx
import React, { useEffect, useState } from 'react';
import { T, PWIcon2, BottomNav, isoDate } from '../tokens.jsx';

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
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function PWHistory({ onHome, onAddMeal, onLibrary, onBack, onEditMeal }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [days, setDays]           = useState(null);
  const [openDay, setOpenDay]     = useState(null);
  const [target, setTarget]       = useState(2200);
  const [error, setError]         = useState(null);

  const weekEnd = addDays(weekStart, 6);
  const isAtCurrentWeek = weekStart.getTime() >= startOfWeek(new Date()).getTime();

  const load = async () => {
    try {
      const [histRes, settingsRes] = await Promise.all([
        fetch(`/api/meals-history?start=${isoDate(weekStart)}&end=${isoDate(weekEnd)}`),
        fetch('/api/settings'),
      ]);
      if (histRes.ok) {
        const data = await histRes.json();
        setDays(data.days);
        if (data.days.length) setOpenDay(data.days[0].date);
      }
      if (settingsRes.ok) setTarget((await settingsRes.json()).target_calories || 2200);
    } catch {
      setError('Could not load history');
    }
  };

  useEffect(() => { load(); }, [weekStart]);

  const calColor = (cal) => {
    if (cal === 0)              return T.inkFaint;
    if (cal <= target)          return T.green;
    if (cal <= target * 1.1)    return T.amber;
    return T.red;
  };

  const calBarColor = (cal) => {
    if (cal === 0)              return T.lineSoft;
    if (cal <= target)          return T.green;
    if (cal <= target * 1.1)    return T.amber;
    return T.red;
  };

  // Build full 7-day week, most recent first
  const allDays = [];
  for (let i = 0; i < 7; i++) {
    const d = isoDate(addDays(weekStart, i));
    const existing = (days || []).find((x) => x.date === d);
    allDays.push(existing || { date: d, total_calories: 0, meals: [] });
  }
  allDays.sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 100px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <div style={{ fontFamily: T.heading, fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
          History
        </div>
      </div>

      {/* Week navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12, padding: '9px 14px',
        boxShadow: T.shadowSoft,
      }}>
        <button onClick={() => setWeekStart((w) => addDays(w, -7))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {PWIcon2.chevLeft(14, T.green)}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft }}>{fmtRange(weekStart, weekEnd)}</span>
        {isAtCurrentWeek
          ? <div style={{ width: 22, height: 22 }} />
          : (
            <button onClick={() => setWeekStart((w) => addDays(w, 7))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {PWIcon2.chevRight(14, T.green)}
            </button>
          )}
      </div>

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}
      {days === null && !error && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>Loading…</div>
      )}

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days !== null && allDays.map((day) => {
          const isOpen = openDay === day.date;
          const pct    = target > 0 ? Math.min(1, day.total_calories / target) : 0;
          return (
            <div key={day.date} style={{
              background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden',
              boxShadow: T.shadowSoft,
            }}>
              <button onClick={() => setOpenDay(isOpen ? null : day.date)} style={{
                width: '100%', display: 'flex', flexDirection: 'column',
                padding: '12px 16px 10px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: T.font, gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                    <span style={{
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.15s', display: 'inline-flex',
                    }}>
                      {PWIcon2.chevDown(11, T.green)}
                    </span>
                    {fmtDayLabel(day.date)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: calColor(day.total_calories) }}>
                    {day.total_calories > 0 ? `${Math.round(day.total_calories)} kcal` : '—'}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: T.lineSoft, borderRadius: 2, width: '100%', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct * 100}%`, height: '100%',
                    background: calBarColor(day.total_calories), borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {day.meals.length === 0 && (
                    <div style={{ fontSize: 12, color: T.inkFaint }}>— no meals logged</div>
                  )}
                  {day.meals.map((m) => (
                    <button key={m.id} onClick={() => onEditMeal(m)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: T.lineSoft, border: 'none', borderRadius: 10, padding: '9px 12px',
                      cursor: 'pointer', fontFamily: T.font, textAlign: 'left', width: '100%',
                    }}>
                      <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>
                        {m.name}
                        <span style={{ color: T.inkFaint, fontWeight: 400 }}>
                          {' '}· {new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.green }}>{Math.round(m.calories)} cal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <BottomNav
        active="history"
        onHome={onHome || onBack}
        onAdd={onAddMeal}
        onHistory={undefined}
        onLibrary={onLibrary}
      />
    </div>
  );
}
