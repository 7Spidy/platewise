import { describe, it, expect } from 'vitest';
import {
  interpretResponse,
  REFUSAL_MESSAGE,
  TRUNCATED_MESSAGE,
  NO_DATA_MESSAGE,
} from '../lib/interpretResponse.js';

const validPayload = {
  name: 'Dal Tadka',
  serving: '1 bowl (250g)',
  calories: 450,
  ingredients: [
    { name: 'Toor dal', quantity: 100, unit: 'g', calories: 340, protein_g: 22, carbs_g: 60, fat_g: 2 },
  ],
  macros: { carbs: 30, protein: 28, fat: 18 },
  other: { fiber: 3, sugar: 6, sodium: 820 },
  fact: 'A fact.',
  tips: ['tip1', 'tip2', 'tip3'],
  healthScore: 7,
  mismatch: false,
};

const toolUseBlock = (input) => ({ type: 'tool_use', id: 'toolu_1', name: 'record_nutrition', input });

describe('interpretResponse', () => {
  it('refusal with no content returns 422', () => {
    const result = interpretResponse({ stop_reason: 'refusal', content: [] });
    expect(result).toMatchObject({ ok: false, status: 422, error: REFUSAL_MESSAGE });
  });

  it('refusal wins even with a valid tool_use block', () => {
    const result = interpretResponse({ stop_reason: 'refusal', content: [toolUseBlock(validPayload)] });
    expect(result).toMatchObject({ ok: false, status: 422, error: REFUSAL_MESSAGE });
  });

  it('max_tokens returns 502 with the truncation message', () => {
    const result = interpretResponse({ stop_reason: 'max_tokens', content: [toolUseBlock(validPayload)] });
    expect(result).toMatchObject({ ok: false, status: 502, error: TRUNCATED_MESSAGE });
  });

  it('end_turn with only text returns 502 no-data', () => {
    const result = interpretResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'hi' }] });
    expect(result).toMatchObject({ ok: false, status: 502, error: NO_DATA_MESSAGE });
  });

  it('missing or non-array content returns 502 no-data without throwing', () => {
    for (const response of [{ stop_reason: 'end_turn' }, { stop_reason: 'end_turn', content: 'oops' }, null, undefined]) {
      expect(() => interpretResponse(response)).not.toThrow();
      expect(interpretResponse(response)).toMatchObject({ ok: false, status: 502, error: NO_DATA_MESSAGE });
    }
  });

  it('invalid tool_use payload returns 502 with field list', () => {
    const result = interpretResponse({
      stop_reason: 'tool_use',
      content: [toolUseBlock({ ...validPayload, healthScore: 42, tips: [] })],
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error.startsWith('Invalid model response:')).toBe(true);
    expect(result.fields.length).toBeGreaterThan(0);
  });

  it('valid tool_use returns ok with the block input', () => {
    const block = toolUseBlock(validPayload);
    const result = interpretResponse({ stop_reason: 'tool_use', content: [block] });
    expect(result.ok).toBe(true);
    expect(result.data).toBe(block.input);
  });

  it('thinking block before tool_use still returns ok (selection by type)', () => {
    const block = toolUseBlock(validPayload);
    const result = interpretResponse({
      stop_reason: 'tool_use',
      content: [{ type: 'thinking', thinking: '', signature: 'sig' }, block],
    });
    expect(result.ok).toBe(true);
    expect(result.data).toBe(block.input);
  });
});
