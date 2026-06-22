// client/src/tokens.jsx — Nourish theme: Terracotta · Cream · Sage
import React from 'react';

export const PW_TOKENS = {
  bg:        '#F7F3EE',
  card:      '#FFFFFF',
  ink:       '#271A0F',
  inkSoft:   '#5C4030',
  inkMute:   '#9A7A66',
  inkFaint:  '#C4B4A4',
  line:      '#E8DDD0',
  lineSoft:  '#EFE6DA',

  // Terracotta is the primary accent — kept on 'green' key for backward compat
  green:     '#C4674A',
  greenInk:  '#A0492E',
  greenSoft: '#F5ECE6',
  green50:   '#FAF7F4',

  sage:      '#5C8A50',
  sageSoft:  '#EAF2E6',

  amber:     '#C47830',
  amber50:   '#FFF8F0',
  red:       '#B42318',
  red50:     '#FEF2F2',
  blue:      '#2563EB',
  blue50:    '#EFF6FF',

  carbs:     '#C47830',
  protein:   '#5C8A50',
  fat:       '#9A7A66',

  shadow:     '0 1px 3px rgba(39,26,15,0.05), 0 8px 28px rgba(39,26,15,0.07)',
  shadowSoft: '0 1px 3px rgba(39,26,15,0.04), 0 4px 16px rgba(39,26,15,0.05)',
  fontDisplay: "'Fraunces', serif",
  fontBody:    "'Inter', system-ui, sans-serif",
  font:        "'Inter', system-ui, sans-serif",
  heading:     "'Fraunces', serif",
  mono:        "'DM Mono', 'Fira Code', monospace",
};

export const T = PW_TOKENS;

export function fmtDay(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isoDate(d) {
  if (typeof d === 'number') {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const date = d instanceof Date ? d : new Date();
  return date.toISOString().slice(0, 10);
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning, Avi';
  if (h >= 12 && h < 17) return 'Good afternoon, Avi';
  if (h >= 17 && h < 21) return 'Good evening, Avi';
  return 'Good night, Avi';
}

export function compressImage(file, maxPx = 600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image. The file may be corrupt or an unsupported format.'));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const base64   = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.src = url;
  });
}

export function PWRing({ value, target, size = 96, stroke = 9, color = T.green, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.lineSoft} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1.2,
      }}>
        {label}
        {sub}
      </div>
    </div>
  );
}

// Shared bottom navigation bar used by Dashboard, History, Library
export function BottomNav({ active, onHome, onAdd, onHistory, onLibrary }) {
  const col = (key) => active === key ? T.green : T.inkFaint;
  const fw  = (key) => active === key ? 700 : 500;
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      height: 72, background: T.card, borderTop: `1px solid ${T.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 12px 10px', zIndex: 20, boxSizing: 'border-box',
    }}>
      {/* Home */}
      <button onClick={onHome || undefined} style={navTabStyle(col('home'))}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M2 11L11 3l9 8v8h-5.5v-5h-7v5H2v-8z"
            fill={active === 'home' ? T.green : 'none'}
            stroke={col('home')} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 9.5, color: col('home'), fontWeight: fw('home'), fontFamily: T.font }}>Home</span>
      </button>

      {/* Add — floating center */}
      <button onClick={onAdd || undefined} style={{
        width: 48, height: 48, background: T.green, borderRadius: '50%', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, cursor: 'pointer', flexShrink: 0,
        boxShadow: '0 6px 20px rgba(196,103,74,0.38)',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* History */}
      <button onClick={onHistory || undefined} style={navTabStyle(col('history'))}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="3" width="18" height="17" rx="2.5"
            fill={active === 'history' ? T.green : 'none'}
            stroke={col('history')} strokeWidth="1.6" />
          <path d="M2 9h18M7 1v4M15 1v4"
            stroke={active === 'history' ? '#fff' : col('history')}
            strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 9.5, color: col('history'), fontWeight: fw('history'), fontFamily: T.font }}>History</span>
      </button>

      {/* Library */}
      <button onClick={onLibrary || undefined} style={navTabStyle(col('library'))}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="18" height="18" rx="2.5"
            fill={active === 'library' ? T.green : 'none'}
            stroke={col('library')} strokeWidth="1.6" />
          <path d="M6 8h10M6 12h6"
            stroke={active === 'library' ? '#fff' : col('library')}
            strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 9.5, color: col('library'), fontWeight: fw('library'), fontFamily: T.font }}>Library</span>
      </button>
    </div>
  );
}

function navTabStyle(color) {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '4px 10px',
  };
}

export const PWIcon2 = {
  gear: (size = 16, color = T.inkMute) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l1.9-1.1-2-3.4-2.1.8a8 8 0 0 0-1.7-1l-.3-2.3h-4l-.3 2.3a8 8 0 0 0-1.7 1l-2.1-.8-2 3.4L6.6 11a8 8 0 0 0 0 2l-1.9 1.1 2 3.4 2.1-.8a8 8 0 0 0 1.7 1l.3 2.3h4l.3-2.3a8 8 0 0 0 1.7-1l2.1.8 2-3.4-1.9-1.1Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (size = 18, color = '#fff') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  ),
  close: (size = 16, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  chevLeft: (size = 16, color = T.green) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevRight: (size = 16, color = T.inkMute) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 6L15 12L9 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevDown: (size = 12, color = T.inkMute) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: (size = 14, color = T.inkFaint) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2"/>
      <path d="M21 21L16.6 16.6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  edit: (size = 13, color = T.green) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (size = 14, color = T.red) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  camera: (size = 18, color = T.inkMute) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 4L7.5 6H4C2.9 6 2 6.9 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H16.5L15 4H9Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.6"/>
    </svg>
  ),
  plate: (size = 20, color = T.inkFaint) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="14" rx="9" ry="5" stroke={color} strokeWidth="1.6"/>
      <path d="M3 14c0 2.8 4 5 9 5s9-2.2 9-5" stroke={color} strokeWidth="1.6"/>
      <path d="M12 4v4M9 5.5C9 5.5 8 8 12 8s3-2.5 3-2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  share: (size = 14, color = T.green) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 3v12M8 7l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};
