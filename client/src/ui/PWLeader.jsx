import React from 'react';
import { T } from '../tokens.jsx';

export default function PWLeader({ label, value, unit, onClick, right, strong = true }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'baseline', gap: 8, padding: '9px 0', fontSize: 16,
        width: '100%', textAlign: 'left', color: T.ink, fontFamily: T.fontBody,
        background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>
        {label}
      </span>
      <span aria-hidden="true" style={{
        flex: '1 1 auto', minWidth: 12, borderBottom: '2px dotted rgba(23,54,42,0.22)',
        transform: 'translateY(-4px)',
      }} />
      <span style={{ fontWeight: strong ? 600 : 400, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {value}
        {unit ? <span style={{ color: T.inkMute, fontSize: 15, fontWeight: 400 }}> {unit}</span> : null}
      </span>
      {right}
    </Tag>
  );
}
