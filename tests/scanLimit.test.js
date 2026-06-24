import { describe, it, expect } from 'vitest';
import {
  windowStart, calcLimit, calcRemaining, isBlocked, calcNextAvailable,
} from '../lib/scanLimit.js';

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

describe('calcLimit', () => {
  it('base limit is 99 with no bonus', () => {
    expect(calcLimit({ bonus_scans: 0 })).toBe(99);
  });

  it('bonus_scans raises the limit permanently', () => {
    expect(calcLimit({ bonus_scans: 10 })).toBe(109);
    expect(calcLimit({ bonus_scans: 50 })).toBe(149);
  });

  it('handles missing bonus_scans', () => {
    expect(calcLimit({})).toBe(99);
  });
});

describe('calcRemaining', () => {
  it('0 scans used → 99 remaining', () => {
    expect(calcRemaining({ bonus_scans: 0 }, 0)).toBe(99);
  });

  it('1 scan used → 98 remaining', () => {
    expect(calcRemaining({ bonus_scans: 0 }, 1)).toBe(98);
  });

  it('98 scans used → 1 remaining', () => {
    expect(calcRemaining({ bonus_scans: 0 }, 98)).toBe(1);
  });

  it('99 scans used → 0 remaining (blocked)', () => {
    expect(calcRemaining({ bonus_scans: 0 }, 99)).toBe(0);
  });

  it('bonus scans increase remaining', () => {
    expect(calcRemaining({ bonus_scans: 10 }, 99)).toBe(10);
  });
});

describe('isBlocked', () => {
  it('not blocked at 98 scans', () => {
    expect(isBlocked({ bonus_scans: 0 }, 98)).toBe(false);
  });

  it('blocked at exactly 99 scans', () => {
    expect(isBlocked({ bonus_scans: 0 }, 99)).toBe(true);
  });

  it('not blocked at 99 scans with 1 bonus', () => {
    expect(isBlocked({ bonus_scans: 1 }, 99)).toBe(false);
  });

  it('blocked at 100 scans with 1 bonus', () => {
    expect(isBlocked({ bonus_scans: 1 }, 100)).toBe(true);
  });
});

describe('rolling window', () => {
  it('windowStart returns a date ~30 days ago', () => {
    const ws = windowStart();
    const diff = Date.now() - ws.getTime();
    expect(diff).toBeCloseTo(WINDOW_MS, -5); // within 1 second
  });

  it('calcNextAvailable: oldest scan + 30 days', () => {
    const oldest = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const next = calcNextAvailable(oldest);
    const expected = new Date(oldest.getTime() + WINDOW_MS);
    expect(next.getTime()).toBe(expected.getTime());
  });

  it('calcNextAvailable returns null when no oldest', () => {
    expect(calcNextAvailable(null)).toBeNull();
    expect(calcNextAvailable(undefined)).toBeNull();
  });
});
