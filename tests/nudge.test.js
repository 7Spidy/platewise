import { describe, it, expect } from 'vitest';
import { macroNudge } from '../client/src/lib/nudge.js';

const at = (h) => new Date(2026, 9, 20, h, 0, 0);
const targets = { protein: 100, carbs: 200, fat: 60 };

describe('macroNudge', () => {
  it('returns null before 15:00', () => {
    expect(macroNudge({ protein: 0, carbs: 0, fat: 0 }, targets, at(14))).toBeNull();
  });

  it('returns null when every macro is at or above 50%', () => {
    expect(macroNudge({ protein: 50, carbs: 100, fat: 30 }, targets, at(16))).toBeNull();
  });

  it('picks the macro with the lowest ratio', () => {
    const n = macroNudge({ protein: 40, carbs: 150, fat: 5 }, targets, at(15));
    expect(n).toEqual({ macro: 'fat', gramsToGo: 55 });
  });

  it('skips macros with zero or missing targets', () => {
    const n = macroNudge({ protein: 0, carbs: 10, fat: 0 }, { protein: 0, carbs: 200 }, at(18));
    expect(n).toEqual({ macro: 'carbs', gramsToGo: 190 });
  });

  it('returns null when no macro has a usable target', () => {
    expect(macroNudge({ protein: 0 }, { protein: 0 }, at(18))).toBeNull();
  });

  it('rounds gramsToGo', () => {
    const n = macroNudge({ protein: 33.4, carbs: 200, fat: 60 }, targets, at(17));
    expect(n).toEqual({ macro: 'protein', gramsToGo: 67 });
  });
});
