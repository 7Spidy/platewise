import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWLeader from '../ui/PWLeader.jsx';

const STEPS = ['name', 'gender', 'age', 'height', 'weight', 'activity', 'goal'];
const STEP_TITLES = ['What should we call you?', 'Your gender', 'Your age', 'Your height', 'Your weight', 'How active are you?', 'What is your goal?'];
const STEP_HELP = [
  'This is optional. We use it for your greeting.',
  'Used to estimate how much energy your body needs.',
  'Used to estimate how much energy your body needs.',
  'Pick your units, then enter your height.',
  'Pick your units, then enter your weight.',
  'Choose what best matches a typical week.',
  'We will set your calorie and macro targets to match.',
];

export const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  label: 'Sedentary',  desc: 'Little or no exercise' },
  { value: 'light',     label: 'Light',      desc: '1 to 3 days a week' },
  { value: 'moderate',  label: 'Moderate',   desc: '3 to 5 days a week' },
  { value: 'very',      label: 'Very active', desc: '6 to 7 days a week' },
];

export const GOAL_OPTIONS = [
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
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.ink, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, maxWidth: 440, width: '100%', margin: '0 auto', padding: '48px 20px 24px', boxSizing: 'border-box' }}>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 'normal', margin: 0, lineHeight: 1.15 }}>Your daily targets</h1>
          <p style={{ fontSize: 16, color: T.inkSoft, lineHeight: 1.5, margin: '8px 0 22px' }}>
            Based on your stats. You can adjust these anytime on the You screen.
          </p>

          <section style={{ background: T.tint, borderRadius: T.rPanel, padding: '16px 22px' }}>
            <PWLeader label="Calories" value={target.calories} unit="kcal" />
            <PWLeader label="Carbs" value={target.carbs_g} unit="g" />
            <PWLeader label="Protein" value={target.protein_g} unit="g" />
            <PWLeader label="Fat" value={target.fat_g} unit="g" />
          </section>

          {target.clamped && (
            <div style={{ background: T.goldTint, color: T.factInk, borderRadius: T.rCard, padding: '14px 18px', fontSize: 15, marginTop: 16 }}>
              Calories floored at 1200 kcal for safety.
            </div>
          )}
        </div>
        <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: `1px solid ${T.line}`, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 440, margin: '0 auto' }}>
            <PWButton variant="primary" onClick={() => { if (onComplete) onComplete(); else navigate('/app'); }} style={{ width: '100%' }}>
              Start tracking
            </PWButton>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const optionCard = (selected) => ({
    background: selected ? T.tintStrong : T.tint,
    border: `2px solid ${selected ? T.ink : 'transparent'}`,
    borderRadius: T.rInput, padding: '14px 16px', minHeight: 56,
    cursor: 'pointer', textAlign: 'left', fontFamily: T.fontBody, color: T.ink,
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: 440, width: '100%', margin: '0 auto', padding: '32px 20px 24px', boxSizing: 'border-box' }}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
            style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{
                width: 14, height: 14, borderRadius: '50%', boxSizing: 'border-box',
                background: i <= step ? T.sage : 'transparent',
                border: `2px solid ${i <= step ? T.sage : T.lineStrong}`,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 14, color: T.inkMute }}>Step {step + 1} of {STEPS.length}</div>
        </div>

        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 'normal', margin: '0 0 8px', lineHeight: 1.15 }}>
          {STEP_TITLES[step]}
        </h1>
        <p style={{ fontSize: 16, color: T.inkSoft, lineHeight: 1.5, margin: '0 0 22px' }}>{STEP_HELP[step]}</p>

        {/* Step content */}
        {currentStep === 'name' && (
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Optional, e.g. Avi"
            aria-label="Your name"
            autoFocus
            style={inputStyle(T)}
          />
        )}

        {currentStep === 'gender' && (
          <PWPills fill label="Gender" value={form.gender} onChange={(g) => set('gender', g)}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
        )}

        {currentStep === 'age' && (
          <input
            type="number"
            inputMode="numeric"
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="e.g. 28"
            aria-label="Age"
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
              inputMode="decimal"
              value={form.height}
              onChange={(e) => set('height', e.target.value)}
              placeholder={form.unit_pref === 'imperial' ? 'e.g. 70 (inches)' : 'e.g. 175 (cm)'}
              aria-label="Height"
              min="0"
              autoFocus
              style={{ ...inputStyle(T), marginTop: 14 }}
            />
            <div style={{ fontSize: 14, color: T.inkMute, marginTop: 8 }}>
              {form.unit_pref === 'metric' ? 'Centimetres' : 'Inches'}
            </div>
          </div>
        )}

        {currentStep === 'weight' && (
          <div>
            <UnitToggle value={form.unit_pref} onChange={(v) => set('unit_pref', v)} />
            <input
              type="number"
              inputMode="decimal"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder={form.unit_pref === 'imperial' ? 'e.g. 160 (lbs)' : 'e.g. 72 (kg)'}
              aria-label="Weight"
              min="0"
              step="0.1"
              autoFocus
              style={{ ...inputStyle(T), marginTop: 14 }}
            />
            <div style={{ fontSize: 14, color: T.inkMute, marginTop: 8 }}>
              {form.unit_pref === 'metric' ? 'Kilograms' : 'Pounds'}
            </div>
          </div>
        )}

        {currentStep === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACTIVITY_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => set('activity_level', o.value)} aria-pressed={form.activity_level === o.value}
                style={optionCard(form.activity_level === o.value)}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 14, color: T.inkSoft, marginTop: 2 }}>{o.desc}</div>
              </button>
            ))}
          </div>
        )}

        {currentStep === 'goal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GOAL_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => set('goal', o.value)} aria-pressed={form.goal === o.value}
                style={{ ...optionCard(form.goal === o.value), display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{o.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{o.label}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" style={{ background: T.dangerTint, borderRadius: 14, padding: '12px 16px', color: T.danger, fontSize: 14, marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: `1px solid ${T.line}`, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', gap: 12 }}>
          {step > 0 && (
            <PWButton variant="secondary" onClick={() => setStep((s) => s - 1)} style={{ flex: 1 }}>Back</PWButton>
          )}
          <PWButton variant="primary" onClick={handleNext} disabled={!canAdvance()} busy={loading} style={{ flex: 1.5 }}>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
          </PWButton>
        </div>
      </div>
    </div>
  );
}

function UnitToggle({ value, onChange }) {
  return (
    <PWPills label="Units" value={value} onChange={onChange}
      options={[{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]} />
  );
}

function inputStyle(T) {
  return {
    width: '100%', boxSizing: 'border-box', height: 56,
    padding: '0 18px', borderRadius: T.rInput,
    border: 'none', background: T.tint, fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none',
  };
}
