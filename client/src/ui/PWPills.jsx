import React from 'react';
import { T } from '../tokens.jsx';

export default function PWPills({ options, value, onChange, fill = false, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 8, flexWrap: fill ? 'nowrap' : 'wrap' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            style={{
              height: 44, borderRadius: 22, fontSize: 15, fontWeight: 500, fontFamily: T.fontBody,
              flex: fill ? '1 1 0' : '0 0 auto', minWidth: 0, padding: fill ? '0 4px' : '0 18px',
              whiteSpace: 'nowrap', cursor: 'pointer',
              background: on ? T.ink : '#fff', color: on ? T.onAccent : T.inkSoft,
              border: `1.5px solid ${on ? T.ink : T.line}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
