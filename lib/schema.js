// lib/schema.js — shared validation helpers; no external dependencies

export function validateIngredient(ing) {
  const errs = [];
  if (!ing || typeof ing.name !== 'string' || !ing.name) errs.push('ingredient.name required string');
  if (typeof ing.quantity !== 'number' || ing.quantity <= 0) errs.push('ingredient.quantity required positive number');
  if (typeof ing.unit !== 'string' || !ing.unit) errs.push('ingredient.unit required string');
  for (const k of ['calories', 'protein_g', 'carbs_g', 'fat_g']) {
    if (typeof ing[k] !== 'number' || ing[k] < 0) errs.push(`ingredient.${k} required number >=0`);
  }
  for (const k of ['fiber_g', 'sodium_mg', 'sugar_g']) {
    if (ing[k] !== undefined && ing[k] !== null && (typeof ing[k] !== 'number' || ing[k] < 0)) {
      errs.push(`ingredient.${k} must be number >=0 if present`);
    }
  }
  return errs;
}

export function validateNutritionPayload(d) {
  const errs = [];
  if (typeof d.calories !== 'number' || d.calories < 0) errs.push('calories');
  if (!d.macros || ['carbs', 'protein', 'fat'].some((k) => typeof d.macros[k] !== 'number')) errs.push('macros');
  if (!d.other  || ['fiber', 'sugar', 'sodium'].some((k) => typeof d.other[k]  !== 'number')) errs.push('other');
  if (!Array.isArray(d.tips) || d.tips.length !== 3) errs.push('tips');
  if (typeof d.healthScore !== 'number' || d.healthScore < 1 || d.healthScore > 10) errs.push('healthScore');
  if (typeof d.mismatch !== 'boolean') errs.push('mismatch');
  if (!Array.isArray(d.ingredients) || d.ingredients.length === 0) errs.push('ingredients');
  if (Array.isArray(d.ingredients)) {
    for (const ing of d.ingredients) errs.push(...validateIngredient(ing));
  }
  return errs;
}

export function validateMealWritePayload(body) {
  const errs = [];
  const { name, calories, ingredients } = body || {};
  if (!name || typeof name !== 'string') errs.push('name is required');
  if (typeof calories !== 'number') errs.push('calories must be a number');
  if (ingredients !== undefined && ingredients !== null) {
    if (!Array.isArray(ingredients)) {
      errs.push('ingredients must be an array');
    } else if (ingredients.length > 0) {
      for (const ing of ingredients) errs.push(...validateIngredient(ing));
    }
  }
  return errs;
}
