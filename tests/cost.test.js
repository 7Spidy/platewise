import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calcCostUsd, calcCostInr, calcCost } from '../api/lib/cost.js';

describe('calcCostUsd', () => {
  it('input tokens at $1/M', () => {
    expect(calcCostUsd(1_000_000, 0)).toBeCloseTo(1.0, 6);
  });

  it('output tokens at $5/M', () => {
    expect(calcCostUsd(0, 1_000_000)).toBeCloseTo(5.0, 6);
  });

  it('Haiku 4.5 typical scan: ~700 input, ~250 output', () => {
    const usd = calcCostUsd(700, 250);
    expect(usd).toBeCloseTo(700 / 1_000_000 + 250 * 5 / 1_000_000, 8);
  });

  it('zero tokens = zero cost', () => {
    expect(calcCostUsd(0, 0)).toBe(0);
  });
});

describe('calcCostInr — reads ANTHROPIC_USD_INR_RATE env var', () => {
  const original = process.env.ANTHROPIC_USD_INR_RATE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ANTHROPIC_USD_INR_RATE;
    } else {
      process.env.ANTHROPIC_USD_INR_RATE = original;
    }
  });

  it('uses env var when set', () => {
    process.env.ANTHROPIC_USD_INR_RATE = '100';
    expect(calcCostInr(1.0)).toBeCloseTo(100.0, 4);
  });

  it('defaults to 94.7 when env var not set', () => {
    delete process.env.ANTHROPIC_USD_INR_RATE;
    expect(calcCostInr(1.0)).toBeCloseTo(94.7, 4);
  });

  it('rate is not hardcoded twice — same result as calcCost', () => {
    process.env.ANTHROPIC_USD_INR_RATE = '85';
    const usd = calcCostUsd(500, 200);
    expect(calcCostInr(usd)).toBeCloseTo(usd * 85, 6);
    const { cost_inr } = calcCost(500, 200);
    expect(cost_inr).toBeCloseTo(usd * 85, 6);
  });
});

describe('calcCost', () => {
  it('returns both cost_usd and cost_inr', () => {
    const result = calcCost(1000, 300);
    expect(result).toHaveProperty('cost_usd');
    expect(result).toHaveProperty('cost_inr');
  });

  it('cost_inr = cost_usd * rate', () => {
    process.env.ANTHROPIC_USD_INR_RATE = '94.7';
    const { cost_usd, cost_inr } = calcCost(700, 250);
    expect(cost_inr).toBeCloseTo(cost_usd * 94.7, 6);
  });
});
