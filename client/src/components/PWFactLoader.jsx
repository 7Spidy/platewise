// client/src/components/PWFactLoader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { T } from '../tokens.jsx';
import { FOOD_FACTS } from '../lib/foodFacts.js';

const FALLBACK = "Good food takes a moment to digest, and so does this analysis.";

function randomIdx(exclude) {
  if (!FOOD_FACTS.length) return -1;
  if (FOOD_FACTS.length === 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * FOOD_FACTS.length); } while (idx === exclude);
  return idx;
}

export default function PWFactLoader({ label }) {
  const [factIdx, setFactIdx] = useState(() => randomIdx(-1));
  const [visible, setVisible] = useState(true);
  const lastIdx = useRef(factIdx);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const next = randomIdx(lastIdx.current);
        lastIdx.current = next;
        setFactIdx(next);
        setVisible(true);
      }, 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fact = FOOD_FACTS.length > 0 ? FOOD_FACTS[factIdx] : FALLBACK;

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '28px 22px',
      textAlign: 'center', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 14,
    }}>
      <style>{`
        @keyframes pw-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        border: `3px solid ${T.line}`,
        borderTopColor: T.green,
        animation: 'pw-spin 0.9s linear infinite',
        flexShrink: 0,
      }} />
      <div style={{
        fontFamily: T.heading, fontSize: 15, fontWeight: 700, color: T.ink,
      }}>
        {label || 'Analysing…'}
      </div>
      <div style={{
        fontSize: 13, color: T.inkSoft, lineHeight: 1.6,
        fontStyle: 'italic', minHeight: 40,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}>
        {fact}
      </div>
    </div>
  );
}
