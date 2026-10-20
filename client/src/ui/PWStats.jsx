import React, { useEffect, useRef, useState } from 'react';
import { T } from '../tokens.jsx';

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Four-column strip: kcal, protein, carbs, fat. `animate` tints changed numbers briefly.
export default function PWStats({ calories, protein, carbs, fat, animate = false }) {
  const items = [
    { k: 'kcal', v: calories, l: 'kcal' },
    { k: 'protein', v: protein, l: 'protein' },
    { k: 'carbs', v: carbs, l: 'carbs' },
    { k: 'fat', v: fat, l: 'fat' },
  ].map((i) => ({ ...i, shown: i.v == null ? '–' : Math.round(i.v) }));

  const prev = useRef(null);
  const [flash, setFlash] = useState({});

  useEffect(() => {
    const cur = Object.fromEntries(items.map((i) => [i.k, i.shown]));
    if (animate && prev.current && !reducedMotion()) {
      const changed = {};
      for (const k of Object.keys(cur)) if (cur[k] !== prev.current[k]) changed[k] = true;
      if (Object.keys(changed).length) {
        setFlash(changed);
        const t = setTimeout(() => setFlash({}), 700);
        prev.current = cur;
        return () => clearTimeout(t);
      }
    }
    prev.current = cur;
  });

  return (
    <div style={{ display: 'flex', margin: '0 20px', fontFamily: T.fontBody }}>
      {items.map((i, idx) => (
        <div key={i.k} style={{
          flex: 1, textAlign: 'center', padding: '6px 4px',
          borderLeft: idx > 0 ? `1px solid ${T.line}` : 'none',
        }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 24, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
            color: flash[i.k] ? T.goldInk : T.ink, transition: 'color 0.3s ease',
          }}>
            {i.shown}{i.k !== 'kcal' && i.v != null ? <span style={{ fontSize: 15 }}>g</span> : null}
          </div>
          <div style={{ fontSize: 13, color: T.inkMute, marginTop: 3 }}>{i.l}</div>
        </div>
      ))}
    </div>
  );
}
