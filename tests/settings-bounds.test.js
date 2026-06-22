import { describe, it, expect } from 'vitest';
import { validateTargets } from '../api/settings.js';

const valid = { targetCalories: 2000, targetProteinG: 150, targetCarbsG: 200, targetFatG: 70 };

describe('validateTargets', () => {
  it('returns null for valid targets', () => {
    expect(validateTargets(valid)).toBeNull();
  });

  it('accepts values exactly at each minimum bound', () => {
    expect(validateTargets({ targetCalories: 800, targetProteinG: 20, targetCarbsG: 20, targetFatG: 10 })).toBeNull();
  });

  it('rejects targetCalories below 800', () => {
    expect(validateTargets({ ...valid, targetCalories: 799 })).not.toBeNull();
  });

  it('rejects targetProteinG below 20', () => {
    expect(validateTargets({ ...valid, targetProteinG: 19 })).not.toBeNull();
  });

  it('rejects targetCarbsG below 20', () => {
    expect(validateTargets({ ...valid, targetCarbsG: 19 })).not.toBeNull();
  });

  it('rejects targetFatG below 10', () => {
    expect(validateTargets({ ...valid, targetFatG: 9 })).not.toBeNull();
  });

  it('includes the failing field name in the error', () => {
    const err = validateTargets({ ...valid, targetCalories: 500 });
    expect(err).toHaveProperty('field', 'targetCalories');
  });
});
