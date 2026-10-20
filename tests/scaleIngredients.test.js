import { describe, it, expect } from 'vitest';
import { scaleIngredient, removeIngredient, stepFor } from '../client/src/lib/scaleIngredients.js';

const rice = { name: 'Rice', quantity: 100, unit: 'g', calories: 130, protein_g: 2.5, carbs_g: 28, fat_g: 0.3 };
const dal = { name: 'Dal', quantity: 200, unit: 'g', calories: 200, protein_g: 14, carbs_g: 30, fat_g: 4, fiber_g: 8, sugar_g: 2, sodium_mg: 400 };

const base = () => ({
  ingredients: [rice, dal],
  calories: 340, // deliberately not equal to 130 + 200: model totals only roughly sum
  macros: { carbs: 60, protein: 17, fat: 5 },
  other: { fiber: 9, sugar: 3, sodium: 450 },
});

describe('scaleIngredient', () => {
  it('doubling adds exactly the ingredient old values to totals', () => {
    const s = base();
    const out = scaleIngredient(s, 0, 200);
    expect(out.ingredients[0].quantity).toBe(200);
    expect(out.ingredients[0].calories).toBe(260);
    expect(out.calories).toBe(340 + 130);
    expect(out.macros.carbs).toBe(60 + 28);
    expect(out.macros.protein).toBeCloseTo(17 + 2.5, 5);
    expect(out.macros.fat).toBeCloseTo(5 + 0.3, 5);
  });

  it('halving subtracts half', () => {
    const out = scaleIngredient(base(), 0, 50);
    expect(out.calories).toBe(340 - 65);
    expect(out.macros.carbs).toBe(60 - 14);
  });

  it('leaves micro totals untouched when the ingredient has none', () => {
    const s = base();
    const out = scaleIngredient(s, 0, 200);
    expect(out.other).toEqual(s.other);
  });

  it('applies micro deltas when present', () => {
    const out = scaleIngredient(base(), 1, 400);
    expect(out.other.fiber).toBe(9 + 8);
    expect(out.other.sugar).toBe(3 + 2);
    expect(out.other.sodium).toBe(450 + 400);
  });

  it('returns the same object for invalid quantities', () => {
    const s = base();
    for (const q of [0, -5, NaN, Infinity, '10', null, undefined]) {
      expect(scaleIngredient(s, 0, q)).toBe(s);
    }
  });

  it('returns the same object for a bad index or non-positive old quantity', () => {
    const s = base();
    expect(scaleIngredient(s, 9, 10)).toBe(s);
    const zero = { ...s, ingredients: [{ ...rice, quantity: 0 }, dal] };
    expect(scaleIngredient(zero, 0, 10)).toBe(zero);
  });

  it('never lets totals go below zero', () => {
    const s = { ...base(), calories: 10, macros: { carbs: 1, protein: 1, fat: 0 } };
    const out = scaleIngredient(s, 0, 1);
    expect(out.calories).toBeGreaterThanOrEqual(0);
    expect(out.macros.carbs).toBeGreaterThanOrEqual(0);
    expect(out.macros.fat).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate its input', () => {
    const s = base();
    const copy = JSON.parse(JSON.stringify(s));
    scaleIngredient(s, 1, 400);
    expect(s).toEqual(copy);
  });
});

describe('removeIngredient', () => {
  it('subtracts the ingredient from totals', () => {
    const out = removeIngredient(base(), 1);
    expect(out.ingredients).toHaveLength(1);
    expect(out.calories).toBe(340 - 200);
    expect(out.other.sodium).toBe(450 - 400);
  });

  it('refuses to remove the last ingredient', () => {
    const s = { ...base(), ingredients: [rice] };
    expect(removeIngredient(s, 0)).toBe(s);
  });

  it('does not mutate its input', () => {
    const s = base();
    const copy = JSON.parse(JSON.stringify(s));
    removeIngredient(s, 0);
    expect(s).toEqual(copy);
  });
});

describe('stepFor', () => {
  it('uses 5 / 10 / 25 for g and ml by size', () => {
    expect(stepFor('g', 50)).toBe(5);
    expect(stepFor('ml', 250)).toBe(10);
    expect(stepFor('g', 800)).toBe(25);
  });

  it('uses 1 for count-like units and 0.5 for fractional spoons', () => {
    expect(stepFor('pc', 2)).toBe(1);
    expect(stepFor('cup', 1)).toBe(1);
    expect(stepFor('tbsp', 1.5)).toBe(0.5);
    expect(stepFor('tsp', 2)).toBe(1);
  });
});
