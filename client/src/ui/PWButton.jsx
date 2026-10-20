import React from 'react';
import { T } from '../tokens.jsx';

const VARIANTS = {
  primary:   { background: T.ink,        color: T.onAccent, border: `1.5px solid ${T.ink}` },
  secondary: { background: '#fff',       color: T.ink,      border: `1.5px solid ${T.ink}` },
  soft:      { background: T.tint,       color: T.ink,      border: '1.5px solid transparent' },
  danger:    { background: T.dangerTint, color: T.danger,   border: '1.5px solid transparent' },
};

export default function PWButton({ variant = 'primary', children, disabled, busy, onClick, type = 'button', style, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      style={{
        height: 56, borderRadius: 28, fontSize: 17, fontWeight: 600, fontFamily: T.fontBody,
        padding: '0 24px', cursor: disabled || busy ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...v, ...style,
      }}
      {...rest}
    >
      <span style={{ visibility: busy ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {children}
      </span>
      {busy && (
        <span aria-hidden="true" style={{
          position: 'absolute', width: 20, height: 20, borderRadius: '50%',
          border: `2.5px solid ${v.color}`, borderTopColor: 'transparent',
          animation: 'pw-spin 0.8s linear infinite',
        }} />
      )}
    </button>
  );
}
