import React, { useId } from 'react';
import { T } from '../tokens.jsx';

// A small plate that fills from the bottom as the day's calories approach target.
export default function PWDayPlate({ fraction, over, isToday, selected, size = 38, label }) {
  const id = useId();
  const f = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
  const fillH = f * 34;
  const fill = over ? '#D8B060' : isToday ? '#B9D2B0' : '#7FA873';
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '6px 4px', borderRadius: 14, background: selected ? T.tint : 'transparent',
    }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <clipPath id={id}><circle cx="20" cy="20" r="17" /></clipPath>
        </defs>
        <circle cx="20" cy="20" r="17" fill="#fff" />
        <g clipPath={`url(#${id})`}>
          <rect x="3" y={37 - fillH} width="34" height={fillH} fill={fill} />
        </g>
        <circle cx="20" cy="20" r="17" fill="none" stroke={over ? T.gold : T.lineStrong} strokeWidth="2" />
      </svg>
      {label != null && (
        <span style={{ fontSize: 13, color: selected ? T.ink : T.inkMute, fontWeight: selected || isToday ? 600 : 400, fontFamily: T.fontBody }}>
          {label}
        </span>
      )}
    </span>
  );
}
