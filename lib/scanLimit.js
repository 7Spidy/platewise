// api/lib/scanLimit.js — Rolling 30-day scan limit logic. Pure functions (pass db rows in).

const WINDOW_MS  = 30 * 24 * 60 * 60 * 1000;
const BASE_LIMIT = 99;

export function windowStart() {
  return new Date(Date.now() - WINDOW_MS);
}

export function calcLimit(user) {
  return BASE_LIMIT + (user.bonus_scans ?? 0);
}

export function calcRemaining(user, usageCount) {
  return calcLimit(user) - usageCount;
}

export function isBlocked(user, usageCount) {
  return calcRemaining(user, usageCount) <= 0;
}

export function calcNextAvailable(oldestCreatedAt) {
  if (!oldestCreatedAt) return null;
  return new Date(new Date(oldestCreatedAt).getTime() + WINDOW_MS);
}
