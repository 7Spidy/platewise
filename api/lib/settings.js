export function validateTargets({ targetCalories, targetProteinG, targetCarbsG, targetFatG } = {}) {
  if (targetCalories < 800)  return { field: 'targetCalories', message: 'targetCalories must be at least 800' };
  if (targetProteinG < 20)   return { field: 'targetProteinG', message: 'targetProteinG must be at least 20' };
  if (targetCarbsG < 20)     return { field: 'targetCarbsG',   message: 'targetCarbsG must be at least 20' };
  if (targetFatG < 10)       return { field: 'targetFatG',     message: 'targetFatG must be at least 10' };
  return null;
}
