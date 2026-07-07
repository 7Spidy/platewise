import { describe, it, expect } from 'vitest';
import { getFoodEmoji } from '../client/src/tokens.jsx';

describe('getFoodEmoji', () => {
  it('matches a simple keyword', () => {
    expect(getFoodEmoji('Roasted Almonds')).toBe('🥜');
  });

  it('is case-insensitive', () => {
    expect(getFoodEmoji('CHICKEN BIRYANI')).toBe(getFoodEmoji('chicken biryani'));
  });

  it('longest match wins over a shorter overlapping keyword', () => {
    expect(getFoodEmoji('Chicken Biryani')).toBe('🍚'); // "biryani", not the generic "chicken" 🍗
  });

  it('falls back on no match', () => {
    expect(getFoodEmoji('Tuesday Leftovers')).toBe('🍽️');
  });

  it('falls back on empty/null/undefined without throwing', () => {
    expect(getFoodEmoji('')).toBe('🍽️');
    expect(getFoodEmoji(null)).toBe('🍽️');
    expect(getFoodEmoji(undefined)).toBe('🍽️');
  });
});
