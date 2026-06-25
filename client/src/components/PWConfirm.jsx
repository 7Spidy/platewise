// client/src/components/PWConfirm.jsx — reusable delete-confirmation modal
import React from 'react';
import { T } from '../tokens.jsx';

export default function PWConfirm({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, padding: 24,
          width: '100%', maxWidth: 320, boxShadow: T.shadow,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ fontFamily: T.heading, fontSize: 17, fontWeight: 700, color: T.ink }}>
          {title}
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px', borderRadius: 12,
              border: `1px solid ${T.line}`, background: '#fff',
              cursor: 'pointer', fontFamily: T.font, fontSize: 14, color: T.inkSoft,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px', borderRadius: 12,
              border: 'none', background: T.red, color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontFamily: T.font, fontSize: 14,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
