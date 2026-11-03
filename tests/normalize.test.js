import { describe, it, expect } from 'vitest';
import { numifyRow, sanitizeMealType, SAVED_NUMERIC_KEYS } from '../lib/normalize.js';

describe('numifyRow', () => {
  it('converts numeric strings to numbers', () => {
    const out = numifyRow({ calories: '395', protein_g: '12.5' }, SAVED_NUMERIC_KEYS);
    expect(out.calories).toBe(395);
    expect(out.protein_g).toBe(12.5);
  });

  it('leaves null and undefined as they are', () => {
    const out = numifyRow({ calories: null, fat_g: undefined }, SAVED_NUMERIC_KEYS);
    expect(out.calories).toBeNull();
    expect(out.fat_g).toBeUndefined();
  });

  it('leaves existing numbers alone', () => {
    expect(numifyRow({ calories: 200 }, SAVED_NUMERIC_KEYS).calories).toBe(200);
  });

  it('leaves non-numeric strings unchanged, never NaN', () => {
    const out = numifyRow({ calories: 'abc' }, SAVED_NUMERIC_KEYS);
    expect(out.calories).toBe('abc');
  });

  it('does not touch keys outside the list', () => {
    const out = numifyRow({ name: '123', use_count: '4', calories: '5' }, SAVED_NUMERIC_KEYS);
    expect(out.name).toBe('123');
    expect(out.use_count).toBe('4');
    expect(out.calories).toBe(5);
  });

  it('returns a new object without mutating the input', () => {
    const input = { calories: '395' };
    const out = numifyRow(input, SAVED_NUMERIC_KEYS);
    expect(out).not.toBe(input);
    expect(input.calories).toBe('395');
  });

  it('returns null and non-object input as-is', () => {
    expect(numifyRow(null, SAVED_NUMERIC_KEYS)).toBeNull();
    expect(numifyRow(undefined, SAVED_NUMERIC_KEYS)).toBeUndefined();
    expect(numifyRow('x', SAVED_NUMERIC_KEYS)).toBe('x');
  });
});

describe('sanitizeMealType', () => {
  it.each(['breakfast', 'lunch', 'snack', 'dinner'])('accepts %s', (v) => {
    expect(sanitizeMealType(v)).toBe(v);
  });

  it.each(['Lunch', '', undefined, 42, 'brunch'])('returns null for %j', (v) => {
    expect(sanitizeMealType(v)).toBeNull();
  });
});
