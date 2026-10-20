import { describe, it, expect } from 'vitest';
import { THEME } from '../client/src/lib/theme.js';

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('Cookbook theme contrast (WCAG AA 4.5:1)', () => {
  for (const key of ['ink', 'inkSoft', 'inkMute', 'sageInk', 'danger']) {
    it(`${key} on bg`, () => {
      expect(contrast(THEME[key], THEME.bg)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${key} on tint`, () => {
      expect(contrast(THEME[key], THEME.tint)).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const key of ['goldInk', 'factInk']) {
    it(`${key} on goldTint`, () => {
      expect(contrast(THEME[key], THEME.goldTint)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('onAccent on ink', () => {
    expect(contrast(THEME.onAccent, THEME.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('has none of the legacy token keys', () => {
    for (const key of ['green', 'amber', 'red', 'blue', 'card', 'lineSoft', 'heading', 'font', 'mono']) {
      expect(THEME).not.toHaveProperty(key);
    }
  });
});
