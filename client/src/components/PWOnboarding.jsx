import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';

const STEPS = ['name', 'gender', 'age', 'height', 'weight', 'activity', 'goal'];
const STEP_LABELS = ['Your name', 'Gender', 'Age', 'Height', 'Weight', 'Activity level', 'Goal'];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  label: 'Sedentary',  desc: 'Little or no exercise' },
  { value: 'light',     label: 'Light',      desc: '1–3 days/week' },
  { value: 'moderate',  label: 'Moderate',   desc: '3–5 days/week' },
  { value: 'very',      label: 'Very active', desc: '6–7 days/week' },
];

const GOAL_OPTIONS = [
  { value: 'lose',     label: 'Lose weight',    icon: '📉' },
  { value: 'maintain', label: 'Maintain weight', icon: '⚖️' },
  { value: 'gain',     label: 'Gain weight',     icon: '📈' },
];

export default function PWOnboarding({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', gender: '', age: '', height: '', weight: '',
    unit_pref: 'metric', activity_level: '', goal: 'maintain',
  });
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function canAdvance() {
    const s = STEPS[step];
    if (s === 'name') return true; // optional
    if (s === 'gender') return !!form.gender;
    if (s === 'age') return form.age && Number(form.age) >= 10 && Number(form.age) <= 120;
    if (s === 'height') return form.height && Number(form.height) > 0;
    if (s === 'weight') return form.weight && Number(form.weight) > 0;
    if (s === 'activity') return !!form.activity_level;
    if (s === 'goal') return !!form.goal;
    return true;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // Final submit
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          gender: form.gender,
          age: Number(form.age),
          height: Number(form.height),
          weight: Number(form.weight),
          unit_pref: form.unit_pref,
          activity_level: form.activity_level,
          goal: form.goal,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setTarget(data.target);
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  // Show result screen after successful submission
  if (target) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg, fontFamily: T.font,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '32px 28px',
          width: '100%', maxWidth: 380, boxShadow: T.shadow, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
            Your daily targets
          </div>
          <div style={{ fontSize: 13, color: T.inkMute, marginBottom: 24 }}>
            Based on your stats. You can adjust these anytime in Settings.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            <StatRow label="Calories" value={`${target.calories} kcal`} color={T.green} />
            <StatRow label="Carbs" value={`${target.carbs_g}g`} color={T.carbs} />
            <StatRow label="Protein" value={`${target.protein_g}g`} color={T.protein} />
            <StatRow label="Fat" value={`${target.fat_g}g`} color={T.fat} />
          </div>

          {target.clamped && (
            <div style={{
              background: T.amber50, border: `1px solid ${T.amber}`, borderRadius: 10,
              padding: '10px 14px', fontSize: 12, color: T.amber, marginBottom: 20,
            }}>
              Calories floored at 1200 kcal for safety.
            </div>
          )}

          <button
            onClick={() => { if (onComplete) onComplete(); else navigate('/app'); }}
            style={{
              background: T.green, color: '#fff', border: 'none', borderRadius: 10,
              padding: '13px 0', width: '100%', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font,
            }}
          >
            Start tracking
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, fontFamily: T.font,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380, boxShadow: T.shadow,
      }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMute }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <div style={{ fontSize: 11, color: T.inkFaint }}>{STEP_LABELS[step]}</div>
          </div>
          <div style={{ height: 4, background: T.lineSoft, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: T.green, borderRadius: 4,
              width: `${progress}%`, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        <div style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 20 }}>
          {STEP_LABELS[step]}
        </div>

        {/* Step content */}
        {currentStep === 'name' && (
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Optional — e.g. Avi"
            autoFocus
            style={inputStyle(T)}
          />
        )}

        {currentStep === 'gender' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['male', 'female', 'other'].map((g) => (
              <OptionButton key={g} selected={form.gender === g} onClick={() => set('gender', g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </OptionButton>
            ))}
          </div>
        )}

        {currentStep === 'age' && (
          <input
            type="number"
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="e.g. 28"
            min="10" max="120"
            autoFocus
            style={inputStyle(T)}
          />
        )}

        {currentStep === 'height' && (
          <div>
            <UnitToggle value={form.unit_pref} onChange={(v) => set('unit_pref', v)} />
            <input
              type="number"
              value={form.height}
              onChange={(e) => set('height', e.target.value)}
              placeholder={form.unit_pref === 'imperial' ? 'e.g. 70 (inches)' : 'e.g. 175 (cm)'}
              min="0"
              autoFocus
              style={{ ...inputStyle(T), marginTop: 12 }}
            />
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 6 }}>
              {form.unit_pref === 'metric' ? 'Centimetres' : 'Inches'}
            </div>
          </div>
        )}

        {currentStep === 'weight' && (
          <div>
            <UnitToggle value={form.unit_pref} onChange={(v) => set('unit_pref', v)} />
            <input
              type="number"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder={form.unit_pref === 'imperial' ? 'e.g. 160 (lbs)' : 'e.g. 72 (kg)'}
              min="0"
              step="0.1"
              autoFocus
              style={{ ...inputStyle(T), marginTop: 12 }}
            />
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 6 }}>
              {form.unit_pref === 'metric' ? 'Kilograms' : 'Pounds'}
            </div>
          </div>
        )}

        {currentStep === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => set('activity_level', o.value)}
                style={{
                  background: form.activity_level === o.value ? T.greenSoft : T.bg,
                  border: `1.5px solid ${form.activity_level === o.value ? T.green : T.line}`,
                  borderRadius: 10, padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: form.activity_level === o.value ? T.green : T.ink }}>
                  {o.label}
                </div>
                <div style={{ fontSize: 12, color: T.inkMute, marginTop: 2 }}>{o.desc}</div>
              </button>
            ))}
          </div>
        )}

        {currentStep === 'goal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => set('goal', o.value)}
                style={{
                  background: form.goal === o.value ? T.greenSoft : T.bg,
                  border: `1.5px solid ${form.goal === o.value ? T.green : T.line}`,
                  borderRadius: 10, padding: '13px 16px',
                  cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{o.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: form.goal === o.value ? T.green : T.ink }}>
                  {o.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: T.red50, border: `1px solid ${T.red}`, borderRadius: 8, padding: '9px 12px', color: T.red, fontSize: 13, marginTop: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: T.bg, border: `1.5px solid ${T.line}`, borderRadius: 10,
                padding: '11px 18px', fontSize: 14, fontWeight: 600,
                color: T.inkSoft, cursor: 'pointer', fontFamily: T.font,
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            style={{
              flex: 1, background: canAdvance() ? T.green : T.line, color: '#fff',
              border: 'none', borderRadius: 10, padding: '12px 0',
              fontSize: 14, fontWeight: 600,
              cursor: canAdvance() && !loading ? 'pointer' : 'default', fontFamily: T.font,
              opacity: loading ? 0.7 : 1, transition: 'background 0.2s',
            }}
          >
            {loading ? 'Saving…' : step === STEPS.length - 1 ? 'Calculate targets' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? T.greenSoft : T.bg,
        border: `1.5px solid ${selected ? T.green : T.line}`,
        borderRadius: 10, padding: '12px 16px',
        cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
        fontSize: 14, fontWeight: selected ? 600 : 400,
        color: selected ? T.green : T.ink, transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function UnitToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: T.bg, borderRadius: 8, padding: 3, gap: 3, width: 'fit-content' }}>
      {['metric', 'imperial'].map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          style={{
            padding: '5px 12px', border: 'none', borderRadius: 6,
            background: value === u ? '#fff' : 'transparent',
            color: value === u ? T.ink : T.inkMute,
            fontWeight: value === u ? 600 : 400,
            fontSize: 12, cursor: 'pointer', fontFamily: T.font,
            boxShadow: value === u ? T.shadowSoft : 'none',
          }}
        >
          {u.charAt(0).toUpperCase() + u.slice(1)}
        </button>
      ))}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: T.bg, borderRadius: 10, padding: '10px 14px',
    }}>
      <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function inputStyle(T) {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${T.line}`,
    background: T.bg, fontSize: 15, fontFamily: T.font, color: T.ink, outline: 'none',
  };
}
