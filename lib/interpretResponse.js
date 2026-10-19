// lib/interpretResponse.js — Interprets a Messages API response for /api/analyze.
import { validateNutritionPayload } from './schema.js';

export const REFUSAL_MESSAGE   = "Couldn't analyse this one. Try a different photo or description.";
export const TRUNCATED_MESSAGE = 'The analysis was cut off. Please try again.';
export const NO_DATA_MESSAGE   = 'Model did not return nutrition data';

export function interpretResponse(response) {
  const stopReason = response?.stop_reason;
  const content = Array.isArray(response?.content) ? response.content : [];

  if (stopReason === 'refusal') {
    return { ok: false, status: 422, error: REFUSAL_MESSAGE, reason: 'refusal' };
  }
  if (stopReason === 'max_tokens') {
    return { ok: false, status: 502, error: TRUNCATED_MESSAGE, reason: 'max_tokens' };
  }

  const toolUse = content.find((b) => b?.type === 'tool_use');
  if (!toolUse) {
    return { ok: false, status: 502, error: NO_DATA_MESSAGE, reason: 'no_tool_use' };
  }

  const errors = validateNutritionPayload(toolUse.input);
  if (errors.length > 0) {
    return {
      ok: false,
      status: 502,
      error: `Invalid model response: ${errors.join(', ')}`,
      reason: 'schema',
      fields: errors,
    };
  }

  return { ok: true, data: toolUse.input };
}
