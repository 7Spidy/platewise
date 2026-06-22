// client/src/components/PWHistory.jsx
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { T, PWIcon2, BottomNav, isoDate } from '../tokens.jsx';
import PWConfirm from './PWConfirm.jsx';

function fmtDayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtXTick(dateStr, range) {
  const d = new Date(dateStr + 'T00:00:00');
  if (range <= 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function exportMealPdf(meal) {
  const cardW = 375, cardH = 600;
  const node = document.createElement('div');
  node.style.cssText = [
    `width:${cardW}px`, `height:${cardH}px`, 'background:#fff',
    "font-family:'Inter',system-ui,sans-serif", 'position:fixed',
    'top:-9999px', 'left:-9999px', 'padding:28px', 'box-sizing:border-box',
    'overflow:hidden',
  ].join(';');

  const photoHtml = meal.photo_url
    ? `<img src="${meal.photo_url}" crossorigin="anonymous"
         style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:16px;display:block" />`
    : `<div style="width:100%;height:160px;background:#F7F3EE;border-radius:12px;
         margin-bottom:16px;display:flex;align-items:center;justify-content:center;
         font-size:52px">🍽</div>`;

  const rows = [
    ['Carbs',   meal.carbs_g,   'g'],
    ['Protein', meal.protein_g, 'g'],
    ['Fat',     meal.fat_g,     'g'],
    ['Fiber',   meal.fiber_g,   'g'],
    ['Sugar',   meal.sugar_g,   'g'],
    ['Sodium',  meal.sodium_mg, 'mg'],
  ].map(([label, val, unit], i) => `
    <tr style="background:${i % 2 === 0 ? '#F7F3EE' : '#fff'}">
      <td style="padding:7px 10px;color:#5C4030;font-size:13px">${label}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600;color:#271A0F;font-size:13px">
        ${val != null ? Math.round(val) + unit : '—'}
      </td>
    </tr>`).join('');

  node.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <div style="width:26px;height:26px;background:#C4674A;border-radius:7px"></div>
      <span style="font-size:15px;font-weight:700;color:#271A0F;letter-spacing:-0.3px">Platewise</span>
    </div>
    ${photoHtml}
    <div style="font-size:20px;font-weight:700;color:#271A0F;margin-bottom:3px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${meal.name}</div>
    <div style="font-size:12px;color:#9A7A66;margin-bottom:14px">
      ${[meal.serving, meal.meal_type].filter(Boolean).join(' · ')}
    </div>
    <div style="font-size:44px;font-weight:700;color:#C4674A;margin-bottom:16px;line-height:1">
      ${Math.round(meal.calories)}<span style="font-size:15px;font-weight:400;color:#9A7A66"> kcal</span>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">${rows}</table>
    <div style="font-size:10px;color:#C4B4A4;text-align:center">
      Exported ${new Date().toLocaleDateString()} · Platewise
    </div>`;

  document.body.appendChild(node);
  try {
    const png = await toPng(node, { width: cardW, height: cardH, pixelRatio: 2 });
    const pdf = new jsPDF({ unit: 'px', format: [cardW, cardH] });
    pdf.addImage(png, 'PNG', 0, 0, cardW, cardH);
    pdf.save(`platewise-${slugify(meal.name)}.pdf`);
  } finally {
    document.body.removeChild(node);
  }
}

const LEGEND = [
  { key: 'total_calories',  label: 'Calories', color: T.green,  dash: '' },
  { key: 'total_protein_g', label: 'Protein',  color: T.sage,   dash: '5 5' },
  { key: 'total_carbs_g',   label: 'Carbs',    color: T.amber,  dash: '2 3' },
  { key: 'total_fat_g',     label: 'Fat',      color: T.fat,    dash: '8 3 2 3' },
];

export default function PWHistory({ onHome, onAddMeal, onLibrary, onBack, onEditMeal }) {
  const [range, setRange]               = useState(7);
  const [days, setDays]                 = useState(null);
  const [openDay, setOpenDay]           = useState(null);
  const [target, setTarget]             = useState(2200);
  const [error, setError]               = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = async () => {
    try {
      const start = isoDate(-(range - 1));
      const end   = isoDate(0);
      const [histRes, settingsRes] = await Promise.all([
        fetch(`/api/meals-history?start=${start}&end=${end}`),
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

  useEffect(() => { load(); }, [range]);

  const calColor = (cal) => {
    if (cal === 0)           return T.inkFaint;
    if (cal <= target)       return T.green;
    if (cal <= target * 1.1) return T.amber;
    return T.red;
  };

  const calBarColor = (cal) => {
    if (cal === 0)           return T.lineSoft;
    if (cal <= target)       return T.green;
    if (cal <= target * 1.1) return T.amber;
    return T.red;
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    await fetch('/api/meals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmTarget.id }),
    });
    setConfirmTarget(null);
    load();
  };

  // Chart data sorted oldest-first for left-to-right rendering
  const chartData = days ? [...days].reverse() : [];
  // Determine tick interval for x-axis to avoid crowding
  const tickCount = range <= 7 ? 1 : 5;

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 100px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>

      {/* Header */}
      <div style={{ fontFamily: T.heading, fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
        History
      </div>

      {/* 7D / 30D toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[7, 30].map((r) => (
          <button key={r} onClick={() => setRange(r)} style={{
            padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: T.font, fontSize: 12.5, fontWeight: 700,
            background: range === r ? T.green : T.lineSoft,
            color: range === r ? '#fff' : T.inkMute,
            transition: 'all 0.15s ease',
          }}>
            {r}D
          </button>
        ))}
      </div>

      {/* Trend chart */}
      {days !== null && (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${T.line}`, padding: '14px 6px 10px', boxShadow: T.shadowSoft }}>
          {/* Custom legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingLeft: 10, marginBottom: 10 }}>
            {LEGEND.map(({ label, color, dash }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="22" height="10">
                  <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="2"
                    strokeDasharray={dash || undefined} />
                </svg>
                <span style={{ fontSize: 11, color: T.inkSoft, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.lineSoft} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: T.inkFaint }}
                tickFormatter={(d) => fmtXTick(d, range)}
                interval={tickCount - 1}
              />
              <YAxis yAxisId="cal" orientation="left"  tick={{ fontSize: 9, fill: T.inkFaint }} width={34} />
              <YAxis yAxisId="grams" orientation="right" tick={{ fontSize: 9, fill: T.inkFaint }} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: `1px solid ${T.line}`, borderRadius: 8 }}
                labelFormatter={(d) => fmtDayLabel(d)}
              />
              <Line yAxisId="cal"   dataKey="total_calories"  stroke={T.green} strokeWidth={2} dot={false} />
              <Line yAxisId="grams" dataKey="total_protein_g" stroke={T.sage}  strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              <Line yAxisId="grams" dataKey="total_carbs_g"   stroke={T.amber} strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
              <Line yAxisId="grams" dataKey="total_fat_g"     stroke={T.fat}   strokeWidth={1.5} dot={false} strokeDasharray="8 3 2 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}
      {days === null && !error && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, marginTop: 30 }}>Loading…</div>
      )}

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days !== null && days.map((day) => {
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
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: T.lineSoft, borderRadius: 10, padding: '8px 10px',
                    }}>
                      {/* Thumbnail */}
                      {m.photo_url
                        ? <img src={m.photo_url} alt="" style={{
                            width: 44, height: 44, objectFit: 'cover', borderRadius: 10,
                            flexShrink: 0,
                          }} />
                        : <div style={{
                            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                            background: T.lineSoft, border: `1px solid ${T.line}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {PWIcon2.plate(20, T.inkFaint)}
                          </div>
                      }
                      {/* Info */}
                      <button onClick={() => onEditMeal && onEditMeal(m)} style={{
                        flex: 1, background: 'none', border: 'none', padding: 0,
                        cursor: onEditMeal ? 'pointer' : 'default', fontFamily: T.font,
                        textAlign: 'left', minWidth: 0,
                      }}>
                        <div style={{ fontSize: 13, color: T.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}
                          <span style={{ color: T.inkFaint, fontWeight: 400 }}>
                            {' '}· {new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.green, marginTop: 1 }}>
                          {Math.round(m.calories)} cal
                        </div>
                      </button>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => exportMealPdf(m)}
                          title="Export PDF"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                          {PWIcon2.share(15, T.green)}
                        </button>
                        <button
                          onClick={() => setConfirmTarget(m)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                          {PWIcon2.trash(14)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <PWConfirm
        open={!!confirmTarget}
        title="Delete this meal?"
        message={confirmTarget ? `"${confirmTarget.name}" will be removed from your history. This can't be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />

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
