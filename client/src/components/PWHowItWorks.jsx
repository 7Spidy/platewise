import React from 'react';
import { T } from '../tokens.jsx';
import PWSheet from '../ui/PWSheet.jsx';
import PWButton from '../ui/PWButton.jsx';

const STEPS = [
  { n: '1', t: 'Add a meal',            d: 'Snap a photo or just describe what you ate. Both work, with or without a photo attached.' },
  { n: '2', t: 'Claude does the math',  d: 'Claude vision breaks the meal into ingredients and estimates calories, macros and micros.' },
  { n: '3', t: 'Review and tweak',      d: 'Nudge any ingredient quantity and the totals update on the spot.' },
  { n: '4', t: 'Save and track',        d: 'It lands on Today under the right meal type, measured against your daily targets.' },
];

export default function PWHowItWorks({ onClose }) {
  return (
    <PWSheet title="How Platewise works" onClose={onClose} labelledBy="pw-how-title">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((s) => (
          <li key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 18, background: T.tint }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 18, color: T.onAccent, background: T.ink,
              width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>{s.n}</span>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{s.t}</span>
              <span style={{ display: 'block', fontSize: 15, color: T.inkSoft, lineHeight: 1.5 }}>{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 18 }}>
        <PWButton variant="primary" onClick={onClose} style={{ width: '100%' }}>Got it</PWButton>
      </div>
    </PWSheet>
  );
}
