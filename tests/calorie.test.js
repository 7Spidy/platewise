import { describe, it, expect } from 'vitest';
import { calcBMR, calcTDEE, calcTarget, inchesToCm, lbsToKg, cmToInches, kgToLbs } from '../api/lib/calorie.js';

describe('calcBMR', () => {
  const base = { age: 30, height_cm: 175, weight_kg: 75 };

  it('male: base + 5', () => {
    const bmr = calcBMR({ ...base, gender: 'male' });
    const expected = 10 * 75 + 6.25 * 175 - 5 * 30 + 5;
    expect(bmr).toBeCloseTo(expected);
  });

  it('female: base - 161', () => {
    const bmr = calcBMR({ ...base, gender: 'female' });
    const expected = 10 * 75 + 6.25 * 175 - 5 * 30 - 161;
    expect(bmr).toBeCloseTo(expected);
  });

  it('other (prefer not to say): base - 78', () => {
    const bmr = calcBMR({ ...base, gender: 'other' });
    const expected = 10 * 75 + 6.25 * 175 - 5 * 30 - 78;
    expect(bmr).toBeCloseTo(expected);
  });
});

describe('calcTDEE', () => {
  const bmr = 1800;

  it('sedentary multiplier 1.20', () => {
    expect(calcTDEE(bmr, 'sedentary')).toBeCloseTo(1800 * 1.20);
  });

  it('light multiplier 1.375', () => {
    expect(calcTDEE(bmr, 'light')).toBeCloseTo(1800 * 1.375);
  });

  it('moderate multiplier 1.55', () => {
    expect(calcTDEE(bmr, 'moderate')).toBeCloseTo(1800 * 1.55);
  });

  it('very multiplier 1.725', () => {
    expect(calcTDEE(bmr, 'very')).toBeCloseTo(1800 * 1.725);
  });
});

describe('calcTarget — goal adjustments and macro splits', () => {
  const stats = { gender: 'male', age: 30, height_cm: 175, weight_kg: 75, activity_level: 'moderate' };

  it('lose: 80% of TDEE, carbs 30% / protein 40% / fat 30%', () => {
    const result = calcTarget({ ...stats, goal: 'lose' });
    expect(result.calories).toBeGreaterThan(1200);
    const calCheck = Math.round(calcTDEE(calcBMR(stats), 'moderate') * 0.80);
    expect(result.calories).toBe(calCheck);
    expect(result.carbs_g).toBe(Math.round((result.calories * 0.30) / 4));
    expect(result.protein_g).toBe(Math.round((result.calories * 0.40) / 4));
    expect(result.fat_g).toBe(Math.round((result.calories * 0.30) / 9));
  });

  it('maintain: 100% of TDEE, carbs 40% / protein 30% / fat 30%', () => {
    const result = calcTarget({ ...stats, goal: 'maintain' });
    const calCheck = Math.round(calcTDEE(calcBMR(stats), 'moderate') * 1.00);
    expect(result.calories).toBe(calCheck);
    expect(result.carbs_g).toBe(Math.round((result.calories * 0.40) / 4));
    expect(result.protein_g).toBe(Math.round((result.calories * 0.30) / 4));
    expect(result.fat_g).toBe(Math.round((result.calories * 0.30) / 9));
  });

  it('gain: 112% of TDEE, carbs 45% / protein 25% / fat 30%', () => {
    const result = calcTarget({ ...stats, goal: 'gain' });
    const calCheck = Math.round(calcTDEE(calcBMR(stats), 'moderate') * 1.12);
    expect(result.calories).toBe(calCheck);
    expect(result.carbs_g).toBe(Math.round((result.calories * 0.45) / 4));
    expect(result.protein_g).toBe(Math.round((result.calories * 0.25) / 4));
    expect(result.fat_g).toBe(Math.round((result.calories * 0.30) / 9));
  });

  it('defaults goal to maintain when not provided', () => {
    const withGoal = calcTarget({ ...stats, goal: 'maintain' });
    const withoutGoal = calcTarget({ ...stats });
    expect(withoutGoal.calories).toBe(withGoal.calories);
  });
});

describe('1200 kcal safety floor', () => {
  it('clamps extreme low-stat input to 1200 and sets clamped=true', () => {
    // Very small body stats that would produce sub-1200 TDEE
    const result = calcTarget({
      gender: 'female', age: 80, height_cm: 140, weight_kg: 35,
      activity_level: 'sedentary', goal: 'lose',
    });
    expect(result.calories).toBe(1200);
    expect(result.clamped).toBe(true);
  });

  it('does NOT clamp realistic inputs', () => {
    const result = calcTarget({
      gender: 'male', age: 30, height_cm: 175, weight_kg: 75,
      activity_level: 'moderate', goal: 'maintain',
    });
    expect(result.calories).toBeGreaterThan(1200);
    expect(result.clamped).toBe(false);
  });
});

describe('unit conversions', () => {
  it('inchesToCm round-trip', () => {
    expect(cmToInches(inchesToCm(70))).toBeCloseTo(70, 4);
  });

  it('lbsToKg round-trip', () => {
    expect(kgToLbs(lbsToKg(165))).toBeCloseTo(165, 4);
  });

  it('inchesToCm: 1 inch = 2.54 cm', () => {
    expect(inchesToCm(1)).toBeCloseTo(2.54);
  });

  it('lbsToKg: 1 lb ≈ 0.453592 kg', () => {
    expect(lbsToKg(1)).toBeCloseTo(0.453592, 5);
  });
});
