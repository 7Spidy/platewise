import React from 'react';
import { T } from '../tokens.jsx';
import PlateArt from './PlateArt.jsx';

// Shared shell for Login, Forgot password, Reset password and Accept invite.
export default function PWAuthLayout({ title, subtitle, children, plate = 'thali' }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.ink }}>
      <div style={{ background: T.tint, padding: '28px 20px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 24 }}>Platewise</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -60, marginTop: 14, position: 'relative' }}>
          <PlateArt kind={plate} size={120} />
        </div>
      </div>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '80px 20px 40px' }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 'normal', margin: 0, lineHeight: 1.15, textAlign: 'center' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 16, color: T.inkSoft, lineHeight: 1.5, textAlign: 'center', margin: '8px 0 0' }}>{subtitle}</p>}
        <div style={{ marginTop: 26 }}>{children}</div>
      </div>
    </div>
  );
}

export function AuthField({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 14, color: T.inkSoft, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export const authInput = {
  width: '100%', boxSizing: 'border-box', height: 52, padding: '0 16px', borderRadius: T.rInput,
  border: 'none', background: T.tint, fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none',
};

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" style={{ background: T.dangerTint, borderRadius: 14, padding: '12px 16px', color: T.danger, fontSize: 14 }}>
      {children}
    </div>
  );
}

export const authLink = {
  background: 'none', border: 'none', color: T.ink, cursor: 'pointer', fontSize: 15, fontFamily: T.fontBody,
  textDecoration: 'underline', padding: 0, minHeight: 44,
};
