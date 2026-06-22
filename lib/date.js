// lib/date.js — IST-aware date helpers for server-side use.
// IST = UTC+5:30. The SQL expression `(created_at + interval '5 hours 30 minutes')::date`
// handles day-bucketing in queries; this module handles JS-side range math.

// Returns an array of YYYY-MM-DD strings from start to end inclusive.
// Both params are YYYY-MM-DD strings. Used for zero-filling day ranges.
export function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}
