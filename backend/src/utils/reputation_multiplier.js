/**
 * Converts a user's reputation_score to a vote weight multiplier.
 *
 * Scale (score → multiplier):
 *   < 0          → 0.1 – 1.0  (proportional, bad reputation)
 *   0   – 19     → 1.0   (new user baseline)
 *   20  – 49     → 1.25
 *   50  – 99     → 1.5
 *   100 – 199    → 1.75
 *   200 – 499    → 2.0
 *   500 – 1999   → 2.25
 *   2000 – 7999  → 2.5
 *   8000 – 24999 → 2.75
 *   ≥ 25000      → 3.0  (ceiling)
 */
export function getReputationMultiplier(score) {
  const s = Number(score) || 0;
  if (s < 0)     return Math.max(0.1, 1 + s / 100);
  if (s < 20)    return 1.0;
  if (s < 50)    return 1.25;
  if (s < 100)   return 1.5;
  if (s < 200)   return 1.75;
  if (s < 500)   return 2.0;
  if (s < 2000)  return 2.25;
  if (s < 8000)  return 2.5;
  if (s < 25000) return 2.75;
  return 3.0;
}
