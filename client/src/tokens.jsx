// client/src/tokens.js
// Design tokens lifted directly from the NutriLog mockup palette.
export const PW_TOKENS = {
  bg:        '#F9FAFB',
  card:      '#FFFFFF',
  ink:       '#111827',
  inkSoft:   '#374151',
  inkMute:   '#6B7280',
  inkFaint:  '#9CA3AF',
  line:      '#E5E7EB',
  lineSoft:  '#F3F4F6',

  green:     '#16A34A',
  greenInk:  '#15803D',
  greenSoft: '#DCFCE7',
  green50:   '#F0FDF4',

  amber:     '#D97706',
  amber50:   '#FFFBEB',
  red:       '#DC2626',
  red50:     '#FEF2F2',
  blue:      '#2563EB',
  blue50:    '#EFF6FF',

  carbs:     '#2563EB',
  protein:   '#D97706',
  fat:       '#DC2626',

  shadow:     '0 1px 2px rgba(17,24,39,0.04), 0 8px 28px rgba(17,24,39,0.06)',
  shadowSoft: '0 1px 2px rgba(17,24,39,0.04), 0 4px 16px rgba(17,24,39,0.04)',
  font: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'DM Mono', 'Fira Code', monospace",
};

export const T = PW_TOKENS; // short alias used inside the new screen files

export function fmtDay(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Image compression — 600px max, always JPEG, with error handling
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
      const mimeType = 'image/jpeg';
      resolve({ base64, mimeType });
    };

    img.src = url;
  });
}

// Small reusable progress ring used on the Dashboard
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
        alignItems: 'center', justifyContent: 'center', lineHeight: 1.15,
      }}>
        {label}
        {sub}
      </div>
    </div>
  );
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
};
