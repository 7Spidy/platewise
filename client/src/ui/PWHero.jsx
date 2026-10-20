import React from 'react';
import { T, PWIcon2 } from '../tokens.jsx';
import PWPlate from './PWPlate.jsx';

// Tint band with a back button and a large plate hanging off its bottom edge.
export default function PWHero({ onBack, backLabel = 'Back', src, name, plateSize = 224, right }) {
  const hang = plateSize / 2;
  return (
    <div style={{ position: 'relative', marginBottom: hang + 16 }}>
      <div style={{
        background: T.tint, height: plateSize / 2 + 96 + 0, paddingTop: 'env(safe-area-inset-top)',
        position: 'relative',
      }}>
        {onBack && (
          <button onClick={onBack} aria-label={backLabel} style={{
            position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', left: 16,
            width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: T.shadowSoft,
          }}>
            {PWIcon2.chevLeft(18, T.ink)}
          </button>
        )}
        {right && (
          <div style={{ position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', right: 16 }}>{right}</div>
        )}
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: -hang, transform: 'translateX(-50%)' }}>
        <PWPlate src={src} name={name} size={plateSize} />
      </div>
    </div>
  );
}
