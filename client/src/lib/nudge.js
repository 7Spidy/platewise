// consumed/targets: { protein, carbs, fat } in grams. now: Date.
// Returns null or { macro: 'protein'|'carbs'|'fat', gramsToGo: number }
export function macroNudge(consumed, targets, now = new Date()) {
  if (now.getHours() < 15) return null;
  let best = null;
  for (const macro of ['protein', 'carbs', 'fat']) {
    const target = Number(targets?.[macro]);
    if (!Number.isFinite(target) || target <= 0) continue;
    const got = Number(consumed?.[macro]) || 0;
    const ratio = got / target;
    if (!best || ratio < best.ratio) best = { macro, ratio, target, got };
  }
  if (!best || best.ratio >= 0.5) return null;
  return { macro: best.macro, gramsToGo: Math.round(best.target - best.got) };
}
