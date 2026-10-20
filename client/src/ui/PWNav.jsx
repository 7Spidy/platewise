import React from 'react';
import { T, PWIcon2 } from '../tokens.jsx';

export default function PWNav({ active, onToday, onHistory, onScan, onLibrary, onYou }) {
  const tab = (key, label, onClick, icon) => {
    const on = active === key;
    const color = on ? T.ink : T.inkMute;
    return (
      <button
        key={key}
        onClick={onClick}
        aria-current={on ? 'page' : undefined}
        style={{
          flex: 1, minHeight: 56, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          color, fontFamily: T.fontBody, fontSize: 13, fontWeight: on ? 600 : 500, padding: 0,
        }}
      >
        {icon(23, color)}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <nav aria-label="Main" style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, boxSizing: 'border-box',
      height: 'calc(76px + env(safe-area-inset-bottom))',
      background: '#fff', borderTop: `1px solid ${T.line}`, zIndex: 20,
      display: 'flex', alignItems: 'center', padding: '0 4px env(safe-area-inset-bottom)',
    }}>
      {tab('today', 'Today', onToday, PWIcon2.today)}
      {tab('history', 'History', onHistory, PWIcon2.history)}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onScan}
          aria-label="Log a meal"
          style={{
            width: 64, height: 64, borderRadius: '50%', background: T.ink, border: '4px solid #fff',
            marginTop: -30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: T.shadowSoft, padding: 0,
          }}
        >
          {PWIcon2.camera(26, '#fff')}
        </button>
      </div>
      {tab('library', 'Library', onLibrary, PWIcon2.library)}
      {tab('you', 'You', onYou, PWIcon2.you)}
    </nav>
  );
}
