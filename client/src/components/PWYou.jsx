// client/src/components/PWYou.jsx — profile, targets, scans, export, help, feedback, sign out
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, PWIcon2 } from '../tokens.jsx';
import PWNav from '../ui/PWNav.jsx';
import PWSheet from '../ui/PWSheet.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWLeader from '../ui/PWLeader.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWHowItWorks from './PWHowItWorks.jsx';
import PWFeedbackSheet from './PWFeedbackSheet.jsx';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from './PWOnboarding.jsx';

const cmToInches = (cm) => Math.round((cm / 2.54) * 10) / 10;
const kgToLbs = (kg) => Math.round((kg * 2.20462) * 10) / 10;

const EXPORT_OPTIONS = [
  { label: 'All time', value: 'all' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last 30 days', value: '30' },
];

const fieldLabel = { display: 'block', fontSize: 14, color: T.inkSoft, marginBottom: 6 };
const fieldInput = {
  width: '100%', height: 52, border: 'none', borderRadius: T.rInput, background: T.tint,
  padding: '0 16px', fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none',
};

export default function PWYou({ onToday, onHistory, onScan, onLibrary }) {
  const navigate = useNavigate();
  const [settings, setSettings]   = useState(null);
  const [scans, setScans]         = useState(null);
  const [sheet, setSheet]         = useState(null); // targets | profile | export | how | feedback
  const [error, setError]         = useState(null);

  // targets
  const [draftTargets, setDraftTargets] = useState(null);
  // profile
  const [profileForm, setProfileForm]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]     = useState('');
  // export
  const [exportLoading, setExportLoading] = useState(false);
  const [exportNotice, setExportNotice]   = useState(null);
  const [signingOut, setSigningOut]       = useState(false);

  const loadSettings = async () => {
    try {
      const r = await fetch('/api/me/settings');
      if (r.ok) setSettings(await r.json());
    } catch {
      setError('Could not load your settings');
    }
  };

  useEffect(() => {
    loadSettings();
    fetch('/api/me/scan-remaining')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setScans)
      .catch(() => setScans(null));
  }, []);

  const targets = settings || { target_calories: 2200, target_protein_g: 180, target_carbs_g: 200, target_fat_g: 70 };

  // ── Targets ──────────────────────────────────────────────────────────────
  const openTargets = () => { setDraftTargets({ ...targets }); setSheet('targets'); };

  const saveTargets = async () => {
    try {
      const res = await fetch('/api/me/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCalories: Number(draftTargets.target_calories),
          targetProteinG: Number(draftTargets.target_protein_g),
          targetCarbsG:   Number(draftTargets.target_carbs_g),
          targetFatG:     Number(draftTargets.target_fat_g),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error || 'Could not save targets');
        setSheet(null);
        return;
      }
      const updated = await res.json();
      setSettings((prev) => ({ ...prev, ...updated }));
      setSheet(null);
    } catch {
      setError('Could not save targets');
      setSheet(null);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────
  async function handleExportData(range) {
    setSheet(null);
    setExportLoading(true);
    setExportNotice(null);
    try {
      const res = await fetch(`/api/me/export?range=${range}`);
      if (res.status === 429) {
        const data = await res.json();
        setExportNotice(data.message || 'You can only export once per hour. Try again soon.');
        return;
      }
      if (!res.ok) {
        setExportNotice('Export failed. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const rangeLabel = range === 'all' ? 'all' : `last${range}`;
      a.download = `platewise-export-${rangeLabel}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportNotice('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }

  // ── Profile ──────────────────────────────────────────────────────────────
  async function openProfileEditor() {
    setProfileError('');
    setProfileLoading(true);
    setProfileForm(null);
    setSheet('profile');
    try {
      const r = await fetch('/api/me/profile');
      const data = await r.json();
      const unit_pref = data.unit_pref || 'metric';
      const height = data.height_cm != null
        ? (unit_pref === 'imperial' ? cmToInches(data.height_cm) : data.height_cm)
        : '';
      const weight = data.weight_kg != null
        ? (unit_pref === 'imperial' ? kgToLbs(data.weight_kg) : data.weight_kg)
        : '';
      setProfileForm({
        name: data.name || '',
        gender: data.gender || '',
        age: data.age ?? '',
        height,
        weight,
        unit_pref,
        activity_level: data.activity_level || '',
        goal: data.goal || 'maintain',
      });
    } catch {
      setProfileError('Could not load profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProfile() {
    setProfileError('');
    if (!profileForm.gender || !profileForm.age || !profileForm.height || !profileForm.weight || !profileForm.activity_level) {
      setProfileError('Please fill in all required fields');
      return;
    }
    setProfileLoading(true);
    try {
      const r = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name || undefined,
          gender: profileForm.gender,
          age: profileForm.age,
          height: profileForm.height,
          weight: profileForm.weight,
          unit_pref: profileForm.unit_pref,
          activity_level: profileForm.activity_level,
          goal: profileForm.goal,
        }),
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        setProfileError(b.error || 'Could not save profile');
        return;
      }
      setSheet(null);
      await loadSettings();
    } catch {
      setProfileError('Could not save profile');
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Sign out ─────────────────────────────────────────────────────────────
  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/me/logout', { method: 'POST' });
    } catch { /* still leave */ }
    navigate('/login', { replace: true });
  }

  const initial = (settings?.name || '?').trim().charAt(0).toUpperCase() || '?';

  const row = (label, onClick, { color = T.ink, busy = false } = {}) => (
    <button
      key={label}
      onClick={onClick}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        minHeight: 56, background: 'none', border: 'none', borderBottom: `1px solid ${T.line}`,
        cursor: busy ? 'default' : 'pointer', fontFamily: T.fontBody, fontSize: 17, color, padding: 0,
        textAlign: 'left', opacity: busy ? 0.6 : 1,
      }}
    >
      <span>{busy ? 'Working…' : label}</span>
      {PWIcon2.chevRight(18, color === T.danger ? T.danger : T.inkMute)}
    </button>
  );

  const profileSheet = (
    <PWSheet title="Edit profile" onClose={() => setSheet(null)} labelledBy="pw-profile-title">
      {profileLoading && !profileForm ? (
        <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 15, padding: '24px 0' }}>Loading…</div>
      ) : profileForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={fieldLabel} htmlFor="pf-name">Name (optional)</label>
            <input id="pf-name" type="text" value={profileForm.name} style={fieldInput}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <span style={fieldLabel}>Gender</span>
            <PWPills fill label="Gender" value={profileForm.gender}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
              onChange={(g) => setProfileForm((f) => ({ ...f, gender: g }))} />
          </div>
          <div>
            <label style={fieldLabel} htmlFor="pf-age">Age</label>
            <input id="pf-age" type="number" min="10" max="120" value={profileForm.age} style={fieldInput}
              onChange={(e) => setProfileForm((f) => ({ ...f, age: e.target.value }))} />
          </div>
          <div>
            <label style={fieldLabel} htmlFor="pf-height">Height ({profileForm.unit_pref === 'imperial' ? 'in' : 'cm'})</label>
            <input id="pf-height" type="number" min="0" value={profileForm.height} style={fieldInput}
              onChange={(e) => setProfileForm((f) => ({ ...f, height: e.target.value }))} />
          </div>
          <div>
            <label style={fieldLabel} htmlFor="pf-weight">Weight ({profileForm.unit_pref === 'imperial' ? 'lbs' : 'kg'})</label>
            <input id="pf-weight" type="number" min="0" step="0.1" value={profileForm.weight} style={fieldInput}
              onChange={(e) => setProfileForm((f) => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <span style={fieldLabel}>Activity level</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY_OPTIONS.map((o) => {
                const on = profileForm.activity_level === o.value;
                return (
                  <button key={o.value} onClick={() => setProfileForm((f) => ({ ...f, activity_level: o.value }))} style={{
                    background: on ? T.tintStrong : T.tint, border: `2px solid ${on ? T.ink : 'transparent'}`,
                    borderRadius: T.rInput, padding: '12px 14px', minHeight: 44, cursor: 'pointer',
                    textAlign: 'left', fontFamily: T.fontBody,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{o.label}</div>
                    <div style={{ fontSize: 14, color: T.inkSoft, marginTop: 2 }}>{o.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span style={fieldLabel}>Goal</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOAL_OPTIONS.map((o) => {
                const on = profileForm.goal === o.value;
                return (
                  <button key={o.value} onClick={() => setProfileForm((f) => ({ ...f, goal: o.value }))} style={{
                    background: on ? T.tintStrong : T.tint, border: `2px solid ${on ? T.ink : 'transparent'}`,
                    borderRadius: T.rInput, padding: '12px 14px', minHeight: 48, cursor: 'pointer',
                    textAlign: 'left', fontFamily: T.fontBody, display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{o.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {profileError && (
            <div style={{ color: T.danger, fontSize: 14, background: T.dangerTint, borderRadius: 12, padding: '10px 14px' }}>{profileError}</div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <PWButton variant="secondary" onClick={() => setSheet(null)} style={{ flex: 1 }}>Cancel</PWButton>
            <PWButton variant="primary" onClick={saveProfile} busy={profileLoading} style={{ flex: 1 }}>Save</PWButton>
          </div>
        </div>
      ) : (
        <div style={{ color: T.danger, fontSize: 14, background: T.dangerTint, borderRadius: 12, padding: '10px 14px' }}>
          {profileError || 'Could not load profile'}
        </div>
      )}
    </PWSheet>
  );

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      padding: '36px 20px 120px', boxSizing: 'border-box', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div aria-hidden="true" style={{
          width: 64, height: 64, borderRadius: '50%', background: T.tint, display: 'grid', placeItems: 'center',
          fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 'normal', margin: 0, lineHeight: 1.15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{settings?.name || 'You'}</h1>
          <div style={{ fontSize: 15, color: T.inkMute, marginTop: 2 }}>Free beta</div>
        </div>
      </div>

      {error && (
        <div style={{ color: T.danger, fontSize: 14, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>{error}</div>
      )}
      {exportNotice && (
        <div style={{
          color: T.danger, fontSize: 14, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
        }}>
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} aria-label="Dismiss" style={{
            background: 'none', border: 'none', cursor: 'pointer', width: 44, height: 44, margin: '-10px -10px -10px 0',
            display: 'grid', placeItems: 'center',
          }}>{PWIcon2.close(16, T.danger)}</button>
        </div>
      )}

      {/* Daily targets */}
      <section style={{ background: T.tint, borderRadius: T.rPanel, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: 0 }}>Daily targets</h2>
          <button onClick={openTargets} style={{
            minHeight: 44, padding: '0 18px', borderRadius: 22, background: '#fff', border: 'none',
            fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, color: T.ink, cursor: 'pointer',
          }}>Edit</button>
        </div>
        <PWLeader label="Calories" value={Math.round(targets.target_calories)} unit="kcal" />
        <PWLeader label="Protein" value={Math.round(targets.target_protein_g)} unit="g" />
        <PWLeader label="Carbs" value={Math.round(targets.target_carbs_g)} unit="g" />
        <PWLeader label="Fat" value={Math.round(targets.target_fat_g)} unit="g" />
      </section>

      {/* Scans */}
      {scans && Number.isFinite(scans.limit) && (
        <section style={{ background: T.tint, borderRadius: T.rPanel, padding: '20px 22px', marginBottom: 16 }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: '0 0 12px' }}>Scans</h2>
          {scans.limit <= 20 && (
            <div aria-hidden="true" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {Array.from({ length: scans.limit }, (_, i) => (
                <span key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: i < scans.remaining ? T.sage : 'transparent',
                  border: `2px solid ${i < scans.remaining ? T.sage : T.lineStrong}`,
                }} />
              ))}
            </div>
          )}
          <div style={{ fontSize: 16, color: T.inkSoft, lineHeight: 1.45 }}>
            {scans.blocked ? (
              <>
                Out of scans until{' '}
                <strong style={{ color: T.ink }}>
                  {scans.nextAvailableAt
                    ? new Date(scans.nextAvailableAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                    : 'later'}
                </strong>.
              </>
            ) : (
              <>
                <strong style={{ color: T.ink }}>{scans.remaining} of {scans.limit}</strong> left. More free up as older scans age out.
              </>
            )}
          </div>
        </section>
      )}

      {/* Rows */}
      <div style={{ borderTop: `1px solid ${T.line}` }}>
        {row('Edit profile', openProfileEditor)}
        {row('Export data', () => setSheet('export'), { busy: exportLoading })}
        {row('How it works', () => setSheet('how'))}
        {row('Send feedback', () => setSheet('feedback'))}
        {row('Sign out', signOut, { color: T.danger, busy: signingOut })}
      </div>

      <PWNav active="you" onToday={onToday} onHistory={onHistory} onScan={onScan} onLibrary={onLibrary} onYou={() => {}} />

      {/* Sheets */}
      {sheet === 'targets' && draftTargets && (
        <PWSheet title="Daily targets" onClose={() => setSheet(null)} labelledBy="pw-targets-title">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['target_calories', 'Calories (kcal)', 800],
              ['target_protein_g', 'Protein (g)', 20],
              ['target_carbs_g', 'Carbs (g)', 20],
              ['target_fat_g', 'Fat (g)', 10],
            ].map(([key, label, minVal]) => (
              <div key={key}>
                <label style={fieldLabel} htmlFor={`t-${key}`}>{label}</label>
                <input id={`t-${key}`} type="number" min={minVal} value={draftTargets[key]} style={fieldInput}
                  onChange={(e) => setDraftTargets((d) => ({ ...d, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <PWButton variant="secondary" onClick={() => setSheet(null)} style={{ flex: 1 }}>Cancel</PWButton>
              <PWButton variant="primary" onClick={saveTargets} style={{ flex: 1 }}>Save</PWButton>
            </div>
          </div>
        </PWSheet>
      )}
      {sheet === 'profile' && profileSheet}
      {sheet === 'export' && (
        <PWSheet title="Export data" onClose={() => setSheet(null)} labelledBy="pw-export-title">
          <p style={{ margin: '0 0 14px', fontSize: 15, color: T.inkSoft, lineHeight: 1.5 }}>
            Download your meal log as a file. You can export once an hour.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {EXPORT_OPTIONS.map((opt) => (
              <PWButton key={opt.value} variant="soft" onClick={() => handleExportData(opt.value)} style={{ width: '100%' }}>
                {opt.label}
              </PWButton>
            ))}
          </div>
        </PWSheet>
      )}
      {sheet === 'how' && <PWHowItWorks onClose={() => setSheet(null)} />}
      {sheet === 'feedback' && <PWFeedbackSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
