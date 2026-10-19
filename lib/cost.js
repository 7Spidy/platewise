// api/lib/cost.js — Token cost calculation at Haiku 5.5 rates (prompts ≤100K tokens).

// The >100K-token tier ($0.50/$2.50) is deliberately not modelled: analyze prompts are ~1K tokens.
const INPUT_RATE_USD  = 0.10 / 1_000_000;
const OUTPUT_RATE_USD = 0.50 / 1_000_000;
const DEFAULT_INR_RATE = 94.7;

export function calcCostUsd(inputTokens, outputTokens) {
  return inputTokens * INPUT_RATE_USD + outputTokens * OUTPUT_RATE_USD;
}

export function calcCostInr(costUsd) {
  const rate = parseFloat(process.env.ANTHROPIC_USD_INR_RATE) || DEFAULT_INR_RATE;
  return costUsd * rate;
}

export function calcCost(inputTokens, outputTokens) {
  const cost_usd = calcCostUsd(inputTokens, outputTokens);
  const cost_inr = calcCostInr(cost_usd);
  return { cost_usd, cost_inr };
}
