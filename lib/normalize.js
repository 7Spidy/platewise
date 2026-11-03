// lib/normalize.js: pure helpers shared by API routes; no external deps

export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

export function sanitizeMealType(v) {
  return typeof v === 'string' && MEAL_TYPES.includes(v) ? v : null;
}

// pg returns `numeric` as string; convert listed keys to Number, keep null/undefined as-is,
// and fall back to the original value if it doesn't parse (never produce NaN).
export function numifyRow(row, keys) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  for (const k of keys) {
    const v = out[k];
    if (v === null || v === undefined || typeof v === 'number') continue;
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

export const SAVED_NUMERIC_KEYS = [
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'sugar_g',
];
