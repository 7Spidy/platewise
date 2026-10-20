// client/src/components/PWFactLoader.jsx — the Analyzing view
import React, { useState, useEffect, useRef } from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import { FOOD_FACTS } from '../lib/foodFacts.js';
import PWPlate from '../ui/PWPlate.jsx';

const FALLBACK = "Good food takes a moment to digest, and so does this analysis.";

const STEPS = ['Looking at your meal', 'Estimating portions', 'Calculating nutrition'];

function randomIdx(exclude) {
  if (!FOOD_FACTS.length) return -1;
  if (FOOD_FACTS.length === 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * FOOD_FACTS.length); } while (idx === exclude);
  return idx;
}

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: T.sage, display: 'grid', placeItems: 'center' }}>
        {PWIcon2.check(14, '#fff')}
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span style={{
        width: 24, height: 24, borderRadius: '50%', boxSizing: 'border-box',
        border: `3px solid ${T.gold}`, borderTopColor: 'transparent', animation: 'pw-spin 0.9s linear infinite',
      }} />
    );
  }
  return <span style={{ width: 24, height: 24, borderRadius: '50%', boxSizing: 'border-box', border: `2px solid ${T.lineStrong}` }} />;
}

export default function PWFactLoader({ label, photoSrc, name }) {
  const [factIdx, setFactIdx] = useState(() => randomIdx(-1));
  const [visible, setVisible] = useState(true);
  const [step3, setStep3]     = useState(false);
  const lastIdx = useRef(factIdx);

  useEffect(() => {
    let swap;
    const interval = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        const next = randomIdx(lastIdx.current);
        lastIdx.current = next;
        setFactIdx(next);
        setVisible(true);
      }, 200);
    }, 5000);
    const t3 = setTimeout(() => setStep3(true), 4000);
    return () => { clearInterval(interval); clearTimeout(swap); clearTimeout(t3); };
  }, []);

  const fact = FOOD_FACTS.length > 0 && factIdx >= 0 ? FOOD_FACTS[factIdx] : FALLBACK;
  const states = ['done', step3 ? 'done' : 'active', step3 ? 'active' : 'pending'];

  const panel = Math.min(340, (typeof window !== 'undefined' ? window.innerWidth : 400) - 40);
  const plate = Math.round(panel * 0.62);

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', inset: 0, background: '#fff', zIndex: 100, overflowY: 'auto',
      display: 'flex', justifyContent: 'center', fontFamily: T.fontBody,
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '40px 20px 32px', boxSizing: 'border-box', textAlign: 'center' }}>
        <h2 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 'normal', margin: '0 0 22px', color: T.ink }}>
          {label || 'Reading your plate'}
        </h2>

        <div style={{
          width: panel, height: panel, margin: '0 auto', background: T.tint, borderRadius: 34,
          display: 'grid', placeItems: 'center', position: 'relative',
        }}>
          <svg className="pw-orbit" width={panel * 0.84} height={panel * 0.84} viewBox="0 0 100 100"
            aria-hidden="true" style={{ position: 'absolute' }}>
            <circle cx="50" cy="50" r="48" fill="none" stroke={T.lineStrong} strokeWidth="0.8" strokeDasharray="0.6 2.2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="48" fill="none" stroke={T.gold} strokeWidth="2.4" strokeLinecap="round"
              pathLength="100" strokeDasharray="18 82" transform="rotate(-90 50 50)" />
          </svg>
          <PWPlate src={photoSrc} name={name} size={plate} />
        </div>

        <ul style={{ listStyle: 'none', margin: '24px auto 22px', padding: 0, maxWidth: 280, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((s, i) => (
            <li key={s} style={{
              display: 'flex', alignItems: 'center', gap: 12, fontSize: 16,
              color: states[i] === 'pending' ? T.inkMute : T.ink, fontWeight: states[i] === 'active' ? 600 : 400,
            }}>
              <StepIcon state={states[i]} />
              {s}
            </li>
          ))}
        </ul>

        <div style={{ background: T.goldTint, borderRadius: T.rCard, padding: '18px 20px', textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.goldInk, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Did you know
          </div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 19, lineHeight: 1.4, color: T.factInk,
            opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease',
          }}>
            {fact}
          </div>
        </div>
      </div>
    </div>
  );
}
