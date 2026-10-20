// client/src/components/PWHistory.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { T, PWIcon2, isoDate, MACRO_COLORS } from '../tokens.jsx';
import PWNav from '../ui/PWNav.jsx';
import PWPlate from '../ui/PWPlate.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWLeader from '../ui/PWLeader.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWDayPlate from '../ui/PWDayPlate.jsx';
import PWConfirm from './PWConfirm.jsx';
import PWMealView from './PWMealView.jsx';

const dateOf = (s) => new Date(s + 'T00:00:00');

function fmtDayName(dateStr) {
  return dateOf(dateStr).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

function fmtXTick(dateStr, range) {
  const d = dateOf(dateStr);
  if (range <= 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtSpan(first, last) {
  const a = dateOf(first);
  const b = dateOf(last);
  const month = (d) => d.toLocaleDateString(undefined, { month: 'long' });
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} to ${b.getDate()} ${month(b)}`;
  }
  const short = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${short(a)} to ${short(b)}`;
}

const LEGEND = [
  { label: 'Calories', color: T.ink,                 dash: '' },
  { label: 'Protein',  color: MACRO_COLORS.protein,  dash: '5 5' },
  { label: 'Carbs',    color: MACRO_COLORS.carbs,    dash: '2 3' },
  { label: 'Fat',      color: MACRO_COLORS.fat,      dash: '8 3 2 3' },
];

const typeLabel = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Meal');

export default function PWHistory({ onHome, onAddMeal, onLibrary, onBack, onEditMeal, onYou }) {
  const [range, setRange]               = useState(7);
  const [days, setDays]                 = useState(null);
  const [selected, setSelected]         = useState(null);
  const [target, setTarget]             = useState(2200);
  const [error, setError]               = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [viewingMeal, setViewingMeal]     = useState(null);
  const [showTrend, setShowTrend]         = useState(false);

  const todayIso = isoDate(0);

  const load = async () => {
    try {
      const start = isoDate(-(range - 1));
      const end   = isoDate(0);
      const [histRes, settingsRes] = await Promise.all([
        fetch(`/api/meals-history?start=${start}&end=${end}`),
        fetch('/api/me/settings'),
      ]);
      if (histRes.ok) {
        const data = await histRes.json();
        setDays(data.days);
        setSelected((cur) => (cur && data.days.some((d) => d.date === cur) ? cur : (data.days[0]?.date ?? null)));
      }
      if (settingsRes.ok) setTarget((await settingsRes.json()).target_calories || 2200);
    } catch {
      setError('Could not load history');
    }
  };

  useEffect(() => { load(); }, [range]);

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

  // Oldest first for plates and chart.
  const ordered = useMemo(() => (days ? [...days].reverse() : []), [days]);

  const summary = useMemo(() => {
    if (!days) return null;
    const logged = days.filter((d) => d.meals.length > 0);
    const finished = logged.filter((d) => d.date !== todayIso);
    const avg = finished.length ? Math.round(finished.reduce((s, d) => s + d.total_calories, 0) / finished.length) : null;
    const overCount = logged.filter((d) => target > 0 && d.total_calories > target).length;
    const counts = new Map();
    for (const d of days) {
      for (const m of d.meals) {
        const key = (m.name || '').trim().toLowerCase();
        if (!key) continue;
        const cur = counts.get(key) || { name: m.name.trim(), n: 0 };
        cur.n += 1;
        counts.set(key, cur);
      }
    }
    let top = null;
    for (const v of counts.values()) if (!top || v.n > top.n) top = v;
    return { avg, overCount, loggedDays: logged.length, top };
  }, [days, target, todayIso]);

  const selectedDay = days?.find((d) => d.date === selected) || null;
  const tickCount = range <= 7 ? 1 : 5;

  const plateFor = (d) => {
    const fraction = target > 0 ? d.total_calories / target : 0;
    return { fraction, over: target > 0 && d.total_calories > target, isToday: d.date === todayIso };
  };

  // 30-day grid: Monday-first, leading blanks.
  const leadingBlanks = ordered.length ? (dateOf(ordered[0].date).getDay() + 6) % 7 : 0;

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      padding: '28px 20px 120px', boxSizing: 'border-box',
    }}>

      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 'normal', margin: 0, lineHeight: 1.15 }}>
        {range === 7 ? 'This week' : 'Last 30 days'}
      </h1>
      {ordered.length > 0 && (
        <div style={{ fontSize: 15, color: T.inkMute, margin: '4px 0 16px' }}>
          {fmtSpan(ordered[0].date, ordered[ordered.length - 1].date)}
        </div>
      )}

      <PWPills label="Range" value={range} onChange={(r) => { setRange(r); setShowTrend(false); }}
        options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }]} />

      {error && <div style={{ color: T.danger, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', fontSize: 14, marginTop: 14 }}>{error}</div>}
      {days === null && !error && (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 15, marginTop: 30 }}>Loading…</div>
      )}

      {days !== null && (
        <>
          {/* Day plates */}
          {range === 7 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px -4px 0' }}>
              {ordered.map((d) => (
                <button key={d.date} onClick={() => setSelected(d.date)} aria-pressed={selected === d.date}
                  aria-label={`${fmtDayName(d.date)}, ${Math.round(d.total_calories)} kcal`}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', minWidth: 44, minHeight: 44 }}>
                  <PWDayPlate {...plateFor(d)} selected={selected === d.date} size={38}
                    label={dateOf(d.date).toLocaleDateString(undefined, { weekday: 'short' })} />
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2, margin: '18px 0 0', justifyItems: 'center' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                <span key={i} aria-hidden="true" style={{ fontSize: 13, color: T.inkMute, paddingBottom: 4 }}>{l}</span>
              ))}
              {Array.from({ length: leadingBlanks }, (_, i) => <span key={`b${i}`} />)}
              {ordered.map((d) => (
                <button key={d.date} onClick={() => setSelected(d.date)} aria-pressed={selected === d.date}
                  aria-label={`${fmtDayName(d.date)}, ${Math.round(d.total_calories)} kcal`}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', minWidth: 44, minHeight: 44 }}>
                  <PWDayPlate {...plateFor(d)} selected={selected === d.date} size={30} label={dateOf(d.date).getDate()} />
                </button>
              ))}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <section style={{ background: T.tint, borderRadius: T.rCard, padding: '14px 20px', margin: '22px 0 14px' }}>
              <PWLeader label="Daily average" value={summary.avg != null ? summary.avg.toLocaleString() : '–'} unit={summary.avg != null ? 'kcal' : undefined} />
              <PWLeader label="Over target" value={`${summary.overCount} of ${summary.loggedDays}`} unit={summary.loggedDays === 1 ? 'day' : 'days'} />
              {summary.top && summary.top.n >= 2 && <PWLeader label="Most logged" value={summary.top.name} />}
            </section>
          )}

          {/* Trend */}
          <PWButton variant="soft" onClick={() => setShowTrend((v) => !v)} aria-expanded={showTrend} style={{ width: '100%', height: 48, fontSize: 16 }}>
            {showTrend ? 'Hide trend' : 'Show trend'}
          </PWButton>

          {showTrend && (
            <div style={{ border: `1.5px solid ${T.line}`, borderRadius: T.rCard, padding: '14px 6px 10px', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingLeft: 10, marginBottom: 10 }}>
                {LEGEND.map(({ label, color, dash }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="22" height="10" aria-hidden="true">
                      <line x1="0" y1="5" x2="22" y2="5" stroke={color} strokeWidth="2" strokeDasharray={dash || undefined} />
                    </svg>
                    <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="22" height="10" aria-hidden="true">
                    <line x1="0" y1="5" x2="22" y2="5" stroke={T.gold} strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  <span style={{ fontSize: 13, color: T.inkSoft }}>Target</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ordered} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.line} />
                  <XAxis dataKey="date" tick={{ fontSize: 13, fill: T.inkMute }}
                    tickFormatter={(d) => fmtXTick(d, range)} interval={tickCount - 1} />
                  <YAxis yAxisId="cal" orientation="left" tick={{ fontSize: 13, fill: T.inkMute }} width={40} />
                  <YAxis yAxisId="grams" orientation="right" tick={{ fontSize: 13, fill: T.inkMute }} width={34} />
                  <Tooltip
                    contentStyle={{ fontSize: 13, background: '#fff', border: 'none', borderRadius: 12, boxShadow: T.shadowSoft, color: T.ink }}
                    labelFormatter={(d) => fmtDayName(d)}
                  />
                  <ReferenceLine yAxisId="cal" y={target} stroke={T.gold} strokeDasharray="4 3" />
                  <Line yAxisId="cal"   dataKey="total_calories"  stroke={T.ink} strokeWidth={2} dot={false} />
                  <Line yAxisId="grams" dataKey="total_protein_g" stroke={MACRO_COLORS.protein} strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                  <Line yAxisId="grams" dataKey="total_carbs_g"   stroke={MACRO_COLORS.carbs}   strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
                  <Line yAxisId="grams" dataKey="total_fat_g"     stroke={MACRO_COLORS.fat}     strokeWidth={1.5} dot={false} strokeDasharray="8 3 2 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Selected day */}
          {selectedDay && (
            <section style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0 }}>{fmtDayName(selectedDay.date)}</h2>
                <span style={{ fontSize: 15, color: T.inkMute }}>{Math.round(selectedDay.total_calories).toLocaleString()} kcal</span>
              </div>
              {selectedDay.meals.length === 0 && (
                <div style={{ fontSize: 15, color: T.inkMute, padding: '8px 0' }}>Nothing logged.</div>
              )}
              {selectedDay.meals.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${T.line}` }}>
                  <button onClick={() => setViewingMeal(m)} style={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: T.fontBody, color: T.ink,
                  }}>
                    <PWPlate src={m.photo_url} name={m.name} size={54} shadow={false} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontFamily: T.fontDisplay, fontSize: 18, lineHeight: 1.25,
                      }}>{m.name}</span>
                      <span style={{ display: 'block', fontSize: 14, color: T.inkMute, marginTop: 2 }}>
                        {typeLabel(m.meal_type)}, {new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {Math.round(m.calories)}
                    </span>
                  </button>
                  <button onClick={() => setConfirmTarget(m)} aria-label={`Delete ${m.name}`} style={{
                    width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {PWIcon2.trash(20, T.danger)}
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* Meal detail view */}
      <PWMealView
        meal={viewingMeal}
        onClose={() => setViewingMeal(null)}
        onEdit={() => { const m = viewingMeal; setViewingMeal(null); onEditMeal && onEditMeal(m); }}
        origin="history"
        onLoggedAgain={() => { setViewingMeal(null); load(); }}
      />

      {/* Delete confirmation */}
      <PWConfirm
        open={!!confirmTarget}
        title="Delete this meal?"
        message={confirmTarget ? `"${confirmTarget.name}" will be removed from your history. This can't be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      <PWNav active="history" onToday={onHome || onBack} onHistory={() => {}} onScan={onAddMeal} onLibrary={onLibrary} onYou={onYou} />
    </div>
  );
}
