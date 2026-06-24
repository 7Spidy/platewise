// api/lib/calorie.js — Pure BMR/TDEE/macro calculation. No side effects.

const ACTIVITY = { sedentary: 1.20, light: 1.375, moderate: 1.55, very: 1.725 };
const GOAL_ADJ = { lose: 0.80, maintain: 1.00, gain: 1.12 };
const MACRO_SPLIT = {
  lose:     { carbs: 0.30, protein: 0.40, fat: 0.30 },
  maintain: { carbs: 0.40, protein: 0.30, fat: 0.30 },
  gain:     { carbs: 0.45, protein: 0.25, fat: 0.30 },
};
const SAFETY_FLOOR = 1200;

export function calcBMR({ gender, age, height_cm, weight_kg }) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (gender === 'male')   return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78;
}

export function calcTDEE(bmr, activity_level) {
  return bmr * (ACTIVITY[activity_level] ?? 1.375);
}

export function calcTarget({ gender, age, height_cm, weight_kg, activity_level, goal = 'maintain' }) {
  const bmr  = calcBMR({ gender, age, height_cm, weight_kg });
  const tdee = calcTDEE(bmr, activity_level);
  const adj  = GOAL_ADJ[goal] ?? 1.00;
  const raw  = tdee * adj;
  const clamped = raw < SAFETY_FLOOR;
  const calories = Math.round(clamped ? SAFETY_FLOOR : raw);
  const split = MACRO_SPLIT[goal] ?? MACRO_SPLIT.maintain;
  return {
    calories,
    clamped,
    carbs_g:   Math.round((calories * split.carbs)   / 4),
    protein_g: Math.round((calories * split.protein) / 4),
    fat_g:     Math.round((calories * split.fat)     / 9),
  };
}

export function inchesToCm(inches) { return inches * 2.54; }
export function lbsToKg(lbs)       { return lbs * 0.453592; }
export function cmToInches(cm)     { return cm / 2.54; }
export function kgToLbs(kg)        { return kg / 0.453592; }
