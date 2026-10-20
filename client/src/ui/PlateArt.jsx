import React from 'react';

// Static, simplified plate illustrations (thali, poha, chai) for the Landing and auth screens.
// No remote images; purely decorative.

function Base({ children, cup }) {
  return (
    <>
      {cup && <rect x="246" y="134" width="50" height="32" rx="16" fill="#fff" stroke="#DCE3D8" strokeWidth="5" />}
      <circle cx="150" cy="157" r={cup ? 112 : 140} fill="rgba(23,54,42,0.07)" />
      <circle cx="150" cy={cup ? 150 : 150} r={cup ? 112 : 140} fill="#fff" stroke="#E1E8DE" strokeWidth="3" />
      {!cup && <circle cx="150" cy="150" r="120" fill="none" stroke="#EEF2EC" strokeWidth="3" />}
      {children}
    </>
  );
}

const ART = {
  thali: (
    <Base>
      <circle cx="150" cy="150" r="52" fill="#F3E3B0" stroke="#E2C77A" strokeWidth="4" />
      <circle cx="150" cy="150" r="30" fill="#E7B54A" />
      <circle cx="92" cy="96" r="30" fill="#F5F0E6" stroke="#E6DCC6" strokeWidth="4" />
      <circle cx="210" cy="92" r="28" fill="#C9553A" />
      <circle cx="210" cy="92" r="14" fill="#E07A50" />
      <circle cx="96" cy="206" r="28" fill="#7FA873" />
      <circle cx="96" cy="206" r="14" fill="#9DBF8F" />
      <ellipse cx="212" cy="208" rx="34" ry="26" fill="#D9A866" stroke="#C48E4A" strokeWidth="4" />
    </Base>
  ),
  poha: (
    <Base>
      <circle cx="150" cy="150" r="82" fill="#F2D54E" stroke="#DDBB2E" strokeWidth="4" />
      <circle cx="120" cy="128" r="9" fill="#C9553A" />
      <circle cx="176" cy="112" r="8" fill="#7FA873" />
      <circle cx="170" cy="170" r="10" fill="#C98F5A" />
      <circle cx="124" cy="176" r="8" fill="#7FA873" />
      <circle cx="150" cy="148" r="7" fill="#C98F5A" />
      <circle cx="196" cy="146" r="6" fill="#C9553A" />
      <ellipse cx="150" cy="88" rx="22" ry="10" fill="#fff" opacity="0.35" />
    </Base>
  ),
  chai: (
    <Base cup>
      <circle cx="150" cy="150" r="88" fill="#C98F5A" stroke="#B1763F" strokeWidth="4" />
      <circle cx="150" cy="150" r="64" fill="#D9A877" opacity="0.7" />
      <ellipse cx="122" cy="118" rx="26" ry="12" fill="#fff" opacity="0.28" />
    </Base>
  ),
};

export default function PlateArt({ kind = 'thali', size = 120, style }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} aria-hidden="true" style={{ display: 'block', ...style }}>
      {ART[kind] || ART.thali}
    </svg>
  );
}
