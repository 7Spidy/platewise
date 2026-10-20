// client/src/components/PWConfirm.jsx — reusable confirmation dialog (props unchanged)
import React from 'react';
import { T } from '../tokens.jsx';
import PWSheet from '../ui/PWSheet.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWConfirm({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <PWSheet title={title} onClose={onCancel} labelledBy="pw-confirm-title">
      <p style={{ margin: '0 0 20px', fontSize: 16, color: T.inkSoft, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <PWButton variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</PWButton>
        <PWButton variant="danger" onClick={onConfirm} style={{ flex: 1 }}>{confirmLabel}</PWButton>
      </div>
    </PWSheet>
  );
}
