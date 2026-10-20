// Local recalculation for ingredient edits (no AI call).
// Totals are adjusted by delta, not re-summed: the model's ingredient values only
// roughly sum to its totals, and re-summing would silently change untouched numbers.

const MICRO_KEYS = [['fiber_g', 'fiber'], ['sugar_g', 'sugar'], ['sodium_mg', 'sodium']];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const r1 = (v) => Math.round(v * 10) / 10;
const clamp0 = (v) => Math.max(0, v);

function applyDelta(state, oldIng, newIng) {
  const delta = (k) => (Number(newIng[k]) || 0) - (Number(oldIng[k]) || 0);
  const macros = {
    carbs:   r1(clamp0((state.macros?.carbs   || 0) + delta('carbs_g'))),
    protein: r1(clamp0((state.macros?.protein || 0) + delta('protein_g'))),
    fat:     r1(clamp0((state.macros?.fat     || 0) + delta('fat_g'))),
  };
  const other = { ...state.other };
  for (const [ingKey, otherKey] of MICRO_KEYS) {
    if (!isNum(oldIng[ingKey]) || !isNum(newIng[ingKey])) continue;
    const next = clamp0((Number(other[otherKey]) || 0) + (newIng[ingKey] - oldIng[ingKey]));
    other[otherKey] = otherKey === 'sodium' ? Math.round(next) : r1(next);
  }
  return {
    calories: Math.round(clamp0((state.calories || 0) + delta('calories'))),
    macros,
    other,
  };
}

// Returns { ingredients, calories, macros, other } after changing one ingredient's quantity
// with the SAME unit. Caller must use the AI path for unit changes and additions.
export function scaleIngredient(state, index, newQuantity) {
  const old = state.ingredients?.[index];
  if (!old) return state;
  if (!isNum(newQuantity) || newQuantity <= 0) return state;
  const oldQty = Number(old.quantity);
  if (!isNum(oldQty) || oldQty <= 0) return state;

  const r = newQuantity / oldQty;
  const next = { ...old, quantity: newQuantity };
  next.calories  = Math.round((Number(old.calories) || 0) * r);
  next.protein_g = r1((Number(old.protein_g) || 0) * r);
  next.carbs_g   = r1((Number(old.carbs_g)   || 0) * r);
  next.fat_g     = r1((Number(old.fat_g)     || 0) * r);
  if (isNum(old.fiber_g))  next.fiber_g  = r1(old.fiber_g * r);
  if (isNum(old.sugar_g))  next.sugar_g  = r1(old.sugar_g * r);
  if (isNum(old.sodium_mg)) next.sodium_mg = Math.round(old.sodium_mg * r);

  const ingredients = state.ingredients.map((ing, i) => (i === index ? next : ing));
  return { ingredients, ...applyDelta(state, old, next) };
}

// Returns the same shape after removing one ingredient (local subtraction).
export function removeIngredient(state, index) {
  const old = state.ingredients?.[index];
  if (!old || state.ingredients.length <= 1) return state;
  const zero = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  for (const [k] of MICRO_KEYS) if (isNum(old[k])) zero[k] = 0;
  const ingredients = state.ingredients.filter((_, i) => i !== index);
  return { ingredients, ...applyDelta(state, old, zero) };
}

// Step size for the +/- buttons. `originalQty` is the quantity the ingredient first had on screen,
// so the step stays steady while the user taps.
export function stepFor(unit, originalQty) {
  const u = String(unit || '').trim().toLowerCase();
  const q = Number(originalQty);
  if (u === 'g' || u === 'ml') {
    if (!Number.isFinite(q) || q < 100) return 5;
    if (q < 500) return 10;
    return 25;
  }
  if ((u === 'tsp' || u === 'tbsp') && Number.isFinite(q) && q % 1 !== 0) return 0.5;
  return 1;
}
