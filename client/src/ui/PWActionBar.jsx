import React from 'react';

// Bottom action bar: sticks to the bottom of the viewport/column with a white fade behind it.
export default function PWActionBar({ children }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 15, marginTop: 24,
      background: 'linear-gradient(to top, #fff 72%, rgba(255,255,255,0))',
      padding: '22px 20px calc(16px + env(safe-area-inset-bottom))',
      display: 'flex', gap: 12,
    }}>
      {children}
    </div>
  );
}
