// client/src/tokens.jsx — Cookbook theme re-exports + shared helpers and icons
import React from 'react';

export { THEME as PW_TOKENS, THEME as T, TYPE, MACRO_COLORS } from './lib/theme.js';
import { THEME as T } from './lib/theme.js';

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

// Ordered list is irrelevant to matching, getFoodEmoji() always picks the
// longest matching keyword so more specific phrases naturally outrank generic ones
// (e.g. "chicken biryani" beats "chicken").
const FOOD_EMOJI_MAP = [
  ['chicken biryani', '🍚'], ['biryani', '🍚'], ['fried rice', '🍚'], ['rice', '🍚'],
  ['masala omelette', '🍳'], ['omelette', '🍳'], ['omelet', '🍳'], ['egg', '🍳'],
  ['butter chicken', '🍛'], ['chicken curry', '🍛'], ['curry', '🍛'], ['chicken', '🍗'],
  ['salmon', '🐟'], ['fish', '🐟'], ['shrimp', '🍤'], ['prawn', '🍤'],
  ['paneer', '🧀'], ['cheese', '🧀'], ['yogurt', '🥣'], ['curd', '🥣'],
  ['dal', '🍲'], ['lentil', '🍲'], ['soup', '🍲'],
  ['ramen', '🍜'], ['noodle', '🍜'], ['pasta', '🍝'], ['spaghetti', '🍝'],
  ['pizza', '🍕'], ['sandwich', '🥪'], ['burrito', '🌯'], ['wrap', '🌯'], ['taco', '🌮'],
  ['salad', '🥗'], ['avocado toast', '🥑'], ['avocado', '🥑'], ['toast', '🍞'], ['bread', '🍞'],
  ['almond', '🥜'], ['peanut', '🥜'], ['nut', '🥜'],
  ['banana', '🍌'], ['apple', '🍎'], ['orange', '🍊'], ['fruit', '🍎'],
  ['coffee', '☕'], ['tea', '🍵'],
  ['protein shake', '🥤'], ['shake', '🥤'], ['smoothie', '🥤'], ['soda', '🥤'], ['juice', '🧃'], ['milk', '🥛'],
  ['chocolate', '🍫'], ['cake', '🍰'], ['cookie', '🍪'], ['biscuit', '🍪'],
  ['pancake', '🥞'], ['waffle', '🧇'],
  ['steak', '🥩'], ['beef', '🥩'], ['mutton', '🥩'], ['pork', '🥓'], ['bacon', '🥓'],
];
const FOOD_EMOJI_FALLBACK = '🍽️';

export function getFoodEmoji(name) {
  if (!name) return FOOD_EMOJI_FALLBACK;
  const lower = name.toLowerCase();
  let best = null;
  for (const [keyword, emoji] of FOOD_EMOJI_MAP) {
    if (lower.includes(keyword) && (!best || keyword.length > best[0].length)) {
      best = [keyword, emoji];
    }
  }
  return best ? best[1] : FOOD_EMOJI_FALLBACK;
}

export function getGreeting(name = '') {
  const h = new Date().getHours();
  const greeting = h >= 5 && h < 12 ? 'Good morning'
    : h >= 12 && h < 17 ? 'Good afternoon'
    : h >= 17 && h < 21 ? 'Good evening'
    : 'Good night';
  return name ? `${greeting}, ${name}` : greeting;
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

export const PWIcon2 = {
  check: (size = 18, color = T.sage) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  minus: (size = 16, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12H19" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  ),
  today: (size = 23, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.8"/>
    </svg>
  ),
  you: (size = 23, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c1.2-3.6 4.2-5.5 8-5.5s6.8 1.9 8 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  history: (size = 23, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke={color} strokeWidth="1.8"/>
      <path d="M3.5 10h17M8 2.8v3.4M16 2.8v3.4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  library: (size = 23, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.2L5.5 21V4.5a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
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
  chevLeft: (size = 16, color = T.ink) => (
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
  edit: (size = 13, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (size = 14, color = T.danger) => (
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
  share: (size = 14, color = T.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 3v12M8 7l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  download: (size = 18, color = T.inkMute) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};
