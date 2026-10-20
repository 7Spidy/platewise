import React, { useState, useEffect } from 'react';
import { T, getFoodEmoji } from '../tokens.jsx';
import { plateContent } from '../lib/plate.js';

export default function PWPlate({ src, name, size = 138, rim = true, shadow = true, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  const content = failed ? plateContent(null, name, getFoodEmoji) : plateContent(src, name, getFoodEmoji);
  const inset = rim ? size * 0.04 : 0;
  const inner = (
    <div style={{
      position: 'absolute', inset, borderRadius: '50%', overflow: 'hidden',
      background: content.kind === 'emoji' ? T.tint : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {content.kind === 'photo' ? (
        <img
          src={content.value}
          alt={alt ?? name ?? ''}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: '50%', display: 'block' }}
        />
      ) : (
        <span role="img" aria-label={alt ?? name ?? 'Meal'} style={{ fontSize: size * 0.38, lineHeight: 1 }}>
          {content.value}
        </span>
      )}
    </div>
  );

  if (!rim) {
    return <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, borderRadius: '50%' }}>{inner}</div>;
  }

  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0, borderRadius: '50%',
      background: '#fff', border: `3px solid ${T.line}`, boxSizing: 'border-box',
      boxShadow: shadow ? T.plateShadow : 'none',
    }}>
      <div style={{
        position: 'absolute', inset: size * 0.07 - 3, borderRadius: '50%',
        border: '2px solid #EEF2EC', pointerEvents: 'none',
      }} />
      {inner}
    </div>
  );
}
