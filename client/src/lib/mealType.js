export function detectMealType() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

// Logs a saved-library meal as a new entry. Throws on network failure; callers
// handle errors and refresh their own data afterwards.
export async function logSavedMeal(saved) {
  await fetch('/api/saved-meals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: saved.id, bumpUse: true }),
  });
  await fetch('/api/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: saved.name, calories: saved.calories,
      macros:  { carbs: saved.carbs_g, protein: saved.protein_g, fat: saved.fat_g },
      other:   { fiber: saved.fiber_g, sugar: saved.sugar_g, sodium: saved.sodium_mg },
      ingredients: saved.ingredients,
      mealType: detectMealType(),
    }),
  });
}
