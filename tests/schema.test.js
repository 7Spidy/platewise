import { describe, it, expect } from 'vitest';
import { validateIngredient, validateNutritionPayload, validateMealWritePayload } from '../lib/schema.js';

const validIngredient = {
  name: 'Egg', quantity: 2, unit: 'large',
  calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10,
};

describe('validateIngredient', () => {
  it('returns no errors for a valid ingredient', () => {
    expect(validateIngredient(validIngredient)).toHaveLength(0);
  });
  it('accepts optional micro-nutrient fields when valid', () => {
    expect(validateIngredient({ ...validIngredient, fiber_g: 0.5, sodium_mg: 70, sugar_g: 0 })).toHaveLength(0);
  });
  it('returns error for missing name', () => {
    expect(validateIngredient({ ...validIngredient, name: '' })).not.toHaveLength(0);
  });
  it('returns error for non-positive quantity', () => {
    expect(validateIngredient({ ...validIngredient, quantity: 0 })).not.toHaveLength(0);
  });
  it('returns error for missing unit', () => {
    expect(validateIngredient({ ...validIngredient, unit: '' })).not.toHaveLength(0);
  });
  it('returns error for negative calories', () => {
    expect(validateIngredient({ ...validIngredient, calories: -1 })).not.toHaveLength(0);
  });
  it('returns error for optional field with wrong type', () => {
    expect(validateIngredient({ ...validIngredient, fiber_g: 'bad' })).not.toHaveLength(0);
  });
});

const validNutrition = {
  calories: 450,
  macros: { carbs: 30, protein: 28, fat: 18 },
  other: { fiber: 3, sugar: 6, sodium: 820 },
  tips: ['tip1', 'tip2', 'tip3'],
  healthScore: 7,
  mismatch: false,
  ingredients: [validIngredient],
};

describe('validateNutritionPayload', () => {
  it('returns no errors for a valid payload', () => {
    expect(validateNutritionPayload(validNutrition)).toHaveLength(0);
  });
  it('returns error for healthScore > 10', () => {
    expect(validateNutritionPayload({ ...validNutrition, healthScore: 11 })).not.toHaveLength(0);
  });
  it('returns error for healthScore < 1', () => {
    expect(validateNutritionPayload({ ...validNutrition, healthScore: 0 })).not.toHaveLength(0);
  });
  it('returns error for wrong tips count', () => {
    expect(validateNutritionPayload({ ...validNutrition, tips: ['one', 'two'] })).not.toHaveLength(0);
  });
  it('returns error for mismatch not boolean', () => {
    expect(validateNutritionPayload({ ...validNutrition, mismatch: 'yes' })).not.toHaveLength(0);
  });
  it('returns error for empty ingredients array', () => {
    expect(validateNutritionPayload({ ...validNutrition, ingredients: [] })).not.toHaveLength(0);
  });
  it('returns error for missing macros', () => {
    expect(validateNutritionPayload({ ...validNutrition, macros: null })).not.toHaveLength(0);
  });
  it('propagates errors from invalid ingredients', () => {
    const badIng = { ...validIngredient, name: '' };
    expect(validateNutritionPayload({ ...validNutrition, ingredients: [badIng] })).not.toHaveLength(0);
  });
});

describe('validateMealWritePayload', () => {
  it('returns no errors for minimal valid payload', () => {
    expect(validateMealWritePayload({ name: 'Dal Tadka', calories: 350 })).toHaveLength(0);
  });
  it('returns no errors when ingredients array is absent', () => {
    expect(validateMealWritePayload({ name: 'X', calories: 100 })).toHaveLength(0);
  });
  it('returns no errors for null ingredients', () => {
    expect(validateMealWritePayload({ name: 'X', calories: 100, ingredients: null })).toHaveLength(0);
  });
  it('returns no errors for valid ingredients array', () => {
    expect(validateMealWritePayload({ name: 'X', calories: 100, ingredients: [validIngredient] })).toHaveLength(0);
  });
  it('returns error for missing name', () => {
    expect(validateMealWritePayload({ calories: 350 })).not.toHaveLength(0);
  });
  it('returns error for non-number calories', () => {
    expect(validateMealWritePayload({ name: 'X', calories: 'bad' })).not.toHaveLength(0);
  });
  it('returns error for non-array ingredients', () => {
    expect(validateMealWritePayload({ name: 'X', calories: 100, ingredients: 'bad' })).not.toHaveLength(0);
  });
  it('propagates errors from invalid ingredient items', () => {
    const badIng = { ...validIngredient, quantity: -1 };
    expect(validateMealWritePayload({ name: 'X', calories: 100, ingredients: [badIng] })).not.toHaveLength(0);
  });
});
