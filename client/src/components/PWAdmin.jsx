import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: `1px solid ${T.line}`, boxShadow: T.shadowSoft,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, fontFamily: T.heading, letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.inkMute, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function PWAdmin() {
  const navigate = useNavigate();
  const [users, setUsers]         = useState([]);
  const [waitlist, setWaitlist]   = useState([]);
  const [feedback, setFeedback]   = useState([]);
  const [trend, setTrend]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [addEmail, setAddEmail]   = useState('');
  const [addMsg, setAddMsg]       = useState('');
  const [grantMap, setGrantMap]   = useState({}); // userId → amount input

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, w, f, t] = await Promise.all([
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/waitlist').then((r) => r.json()),
        fetch('/api/admin/feedback').then((r) => r.json()),
        fetch('/api/admin/usage-trend').then((r) => r.json()),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setWaitlist(Array.isArray(w) ? w : []);
      setFeedback(Array.isArray(f) ? f : []);
      setTrend(Array.isArray(t) ? t : []);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived stats
  const scans30d    = users.reduce((s, u) => s + Number(u.scans_30d ?? 0), 0);
  const cost30d     = users.reduce((s, u) => s + Number(u.cost_inr_30d ?? 0), 0);
  const costTotal   = users.reduce((s, u) => s + Number(u.cost_inr_lifetime ?? 0), 0);
  const avgCost     = users.length > 0 ? (costTotal / users.length).toFixed(2) : '0.00';
  const pending     = waitlist.filter((w) => w.status === 'pending');

  async function handleWaitlistAction(id, action) {
    const r = await fetch('/api/admin/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (action === 'approve') {
      const d = await r.json();
      if (d.emailSent === false) {
        setAddMsg(`Approved, but invite email failed to send: ${d.emailError ?? 'unknown error'}`);
      }
    }
    load();
  }

  async function handleAddEmail(e) {
    e.preventDefault();
    setAddMsg('');
    const r = await fetch('/api/admin/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail }),
    });
    const d = await r.json();
    if (!r.ok) {
      setAddMsg(d.error ?? 'Error');
    } else if (d.emailSent === false) {
      setAddMsg(`Invite created, but email failed to send: ${d.emailError ?? 'unknown error'}`);
    } else {
      setAddMsg('Invite sent!');
    }
    if (r.ok) setAddEmail('');
  }

  async function handleGrantScans(userId) {
    const amount = Number(grantMap[userId]);
    if (!amount || amount < 1) return;
    const r = await fetch('/api/admin/grant-scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    if (r.ok) {
      setGrantMap((m) => ({ ...m, [userId]: '' }));
      load();
    }
  }

  const fmtInr = (v) => `₹${Number(v ?? 0).toFixed(2)}`;
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

  const sectionHead = (title) => (
    <div style={{ fontFamily: T.heading, fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 14, marginTop: 28, letterSpacing: '-0.3px' }}>
      {title}
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, color: T.inkMute }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${T.line}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 18, color: T.ink, letterSpacing: '-0.3px' }}>
          Platewise Admin
        </div>
        <button onClick={() => navigate('/app')} style={{
          background: 'none', border: `1px solid ${T.line}`, borderRadius: 8,
          padding: '5px 12px', fontSize: 12.5, color: T.inkMute, cursor: 'pointer', fontFamily: T.font,
        }}>
          Go to app
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <StatCard label="Scans (30d)" value={scans30d} />
          <StatCard label="Cost (30d)" value={fmtInr(cost30d)} />
          <StatCard label="Cost (lifetime)" value={fmtInr(costTotal)} />
          <StatCard label="Avg cost / user" value={`₹${avgCost}`} />
        </div>

        {/* Trend chart */}
        {sectionHead('Scans per day (14d)')}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${T.line}`, padding: '16px 8px', boxShadow: T.shadowSoft }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.inkFaint }} />
              <YAxis tick={{ fontSize: 10, fill: T.inkFaint }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontFamily: T.font, fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }}
                formatter={(v) => [v, 'Scans']}
              />
              <Bar dataKey="scans" fill={T.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Users table */}
        {sectionHead('Users')}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadowSoft }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                  {['Email', 'Scans (30d)', 'Cost (30d)', 'Cost (lifetime)', 'Target', 'Joined', 'Last active', '+ Scans'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.inkMute, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const limit = 99 + (u.bonus_scans ?? 0);
                  const pct = Math.min((u.scans_30d / limit) * 100, 100);
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                      <td style={{ padding: '10px 14px', color: T.ink }}>
                        <div>{u.name || '—'}</div>
                        <div style={{ color: T.inkMute, fontSize: 11 }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{u.scans_30d} / {limit}</div>
                        <div style={{ marginTop: 4, height: 4, background: T.lineSoft, borderRadius: 2, width: 80 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? T.red : T.green, borderRadius: 2 }} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: T.ink }}>{fmtInr(u.cost_inr_30d)}</td>
                      <td style={{ padding: '10px 14px', color: T.ink }}>{fmtInr(u.cost_inr_lifetime)}</td>
                      <td style={{ padding: '10px 14px', color: T.ink }}>{u.calorie_target ? `${u.calorie_target} kcal` : '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.inkMute, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: '10px 14px', color: T.inkMute, whiteSpace: 'nowrap' }}>{fmtDate(u.last_active_at)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="n"
                            value={grantMap[u.id] ?? ''}
                            onChange={(e) => setGrantMap((m) => ({ ...m, [u.id]: e.target.value }))}
                            style={{ width: 48, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.line}`, fontSize: 12, fontFamily: T.font, color: T.ink }}
                          />
                          <button
                            onClick={() => handleGrantScans(u.id)}
                            style={{
                              background: T.green, color: '#fff', border: 'none',
                              borderRadius: 6, padding: '4px 10px', fontSize: 12,
                              cursor: 'pointer', fontFamily: T.font, fontWeight: 600,
                            }}
                          >
                            Grant
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending waitlist */}
        {sectionHead(`Pending requests (${pending.length})`)}
        {pending.length === 0 ? (
          <div style={{ color: T.inkMute, fontSize: 13 }}>No pending requests.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((w) => (
              <div key={w.id} style={{
                background: '#fff', borderRadius: 12, border: `1px solid ${T.line}`,
                padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                boxShadow: T.shadowSoft,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: T.ink }}>{w.email}</div>
                  <div style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{fmtDate(w.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleWaitlistAction(w.id, 'approve')}
                    style={{
                      background: T.sage, color: '#fff', border: 'none', borderRadius: 8,
                      padding: '6px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: T.font, fontWeight: 600,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleWaitlistAction(w.id, 'reject')}
                    style={{
                      background: T.red50, color: T.red, border: `1px solid ${T.red}`, borderRadius: 8,
                      padding: '6px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: T.font, fontWeight: 600,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Direct add email */}
        {sectionHead('Add email directly')}
        <form onSubmit={handleAddEmail} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={{
              flex: 1, maxWidth: 320, padding: '9px 12px', borderRadius: 9,
              border: `1.5px solid ${T.line}`, fontSize: 13.5, fontFamily: T.font, color: T.ink, background: T.bg,
            }}
          />
          <button type="submit" style={{
            background: T.green, color: '#fff', border: 'none', borderRadius: 9,
            padding: '9px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
          }}>
            Send invite
          </button>
          {addMsg && (
            <span style={{ fontSize: 13, color: addMsg === 'Invite sent!' ? T.sage : T.red }}>{addMsg}</span>
          )}
        </form>

        {/* Feedback */}
        {sectionHead('Feedback')}
        {feedback.length === 0 ? (
          <div style={{ color: T.inkMute, fontSize: 13 }}>No feedback yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feedback.map((f) => (
              <div key={f.id} style={{
                background: '#fff', borderRadius: 12, border: `1px solid ${T.line}`,
                padding: '12px 16px', boxShadow: T.shadowSoft,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    background: f.type === 'scan' ? T.amber50 : T.blue50,
                    color: f.type === 'scan' ? T.amber : T.blue,
                    border: `1px solid ${f.type === 'scan' ? T.amber : T.blue}`,
                    borderRadius: 6, padding: '1px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  }}>
                    {f.type === 'scan' ? 'SCAN' : 'APP'}
                  </span>
                  <span style={{ fontSize: 12, color: T.inkMute }}>
                    {f.name || f.email} · {fmtDate(f.created_at)}
                  </span>
                  {f.meal_name && (
                    <span style={{ fontSize: 12, color: T.inkSoft }}>· {f.meal_name}</span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5 }}>{f.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
