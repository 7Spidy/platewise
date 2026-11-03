export function detectMealType() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

// Logs a saved-library meal as a new entry via one atomic server call (the server
// inserts the meal_logs row and bumps use_count together, or does neither).
// Throws Error(message) on any non-2xx or network failure.
export async function logSavedMeal(saved) {
  const res = await fetch('/api/saved-meals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: saved.id, log: true, mealType: detectMealType() }),
  });
  if (!res.ok) {
    throw new Error('Could not log that meal');
  }
  return res.json();
}
