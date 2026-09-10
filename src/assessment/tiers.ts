/**
 * Difficulty tiers span Kindergarten through Grade 8.
 *
 * The bank reaches two grades past Grade 6 on purpose: a Grade 6 child who
 * answers well needs somewhere to go, or the ceiling — not the child — is what
 * the result measures. Likewise tier 0 gives a struggling Grade 4 room to fall.
 *
 * The tier number is INTERNAL. Parents see `tierGradeLabel`; the raw number is
 * never rendered.
 */
export type Tier = number;

export const MIN_TIER: Tier = 0;
export const MAX_TIER: Tier = 8;
export const TIERS: Tier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function clampTier(tier: number): Tier {
  return Math.min(MAX_TIER, Math.max(MIN_TIER, Math.round(tier)));
}

/** Tier 0 is Kindergarten; tier n is Grade n. */
export function tierGradeLabel(tier: Tier): string {
  return clampTier(tier) === 0 ? 'Kindergarten level' : `Grade ${clampTier(tier)} level`;
}
