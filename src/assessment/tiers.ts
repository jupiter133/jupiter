/**
 * Difficulty tiers span Kindergarten through Grade 8.
 *
 * The bank reaches two grades past Grade 6 on purpose: a strong Grade 6 child
 * needs somewhere to go, or the ceiling — not the child — is what the result
 * measures. Tier 0 gives a struggling older child room to fall.
 *
 * The tier number is INTERNAL. Parents see `tierGradeLabel`; neither the tier
 * nor the gap is ever rendered as a number.
 */
export type Tier = number;

export const MIN_TIER: Tier = 0;
export const MAX_TIER: Tier = 8;
export const TIERS: Tier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Grade placement. Before Grade 1 there are three years: Early Learners
 * (before kindergarten), Junior Kindergarten and Senior Kindergarten.
 */
export type Grade = 'EL' | 'JK' | 'SK' | '1' | '2' | '3' | '4' | '5' | '6';

export const GRADES: Grade[] = ['EL', 'JK', 'SK', '1', '2', '3', '4', '5', '6'];

export const GRADE_LABEL: Record<Grade, string> = {
  EL: 'Early Learners',
  JK: 'Junior Kindergarten',
  SK: 'Senior Kindergarten',
  '1': 'Grade 1',
  '2': 'Grade 2',
  '3': 'Grade 3',
  '4': 'Grade 4',
  '5': 'Grade 5',
  '6': 'Grade 6',
};

/** Short form for a chip. */
export const GRADE_SHORT: Record<Grade, string> = {
  EL: 'Early',
  JK: 'JK',
  SK: 'SK',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
};

const PRE_GRADE_1: Grade[] = ['EL', 'JK', 'SK'];

export function isPreGrade1(grade: Grade): boolean {
  return PRE_GRADE_1.includes(grade);
}

export function clampTier(tier: number): Tier {
  return Math.min(MAX_TIER, Math.max(MIN_TIER, Math.round(tier)));
}

/** Grade K is tier 0; Grade n is tier n. */
export function gradeTier(grade: Grade): Tier {
  // The bank floors at kindergarten content, so Early Learners, JK and SK all
  // start at tier 0. Their gaps therefore cannot go negative — a pre-Grade 1
  // child is never "behind" on this scale. Pre-K items would need tiers below
  // zero, which is a content decision, not a code one.
  return isPreGrade1(grade) ? 0 : Number(grade);
}

/**
 * Grade-level gap: assessed level minus the child's actual grade placement.
 * Negative is behind, positive is ahead. This is what the routing gate reads —
 * a Grade 6 child at tier 4 and a Grade 2 child at tier 0 are both "2 behind",
 * and the gate should treat them the same way.
 */
export function gapFor(assessedTier: Tier, grade: Grade): number {
  return assessedTier - gradeTier(grade);
}

/** "More than 1 grade behind" — the gate's threshold for needing a Core track. */
export const BEHIND_THRESHOLD = -2;

export function isMoreThanOneGradeBehind(gap: number): boolean {
  return gap <= BEHIND_THRESHOLD;
}

export function isWithinOneGrade(gap: number): boolean {
  return gap > BEHIND_THRESHOLD;
}

/** The reading level at or above which a child leaves the Reading track. */
export const READING_GATE_TIER: Tier = 3;

/** Tier 0 is Kindergarten; tier n is Grade n. */
export function tierGradeLabel(tier: Tier): string {
  return clampTier(tier) === 0 ? 'Kindergarten level' : `Grade ${clampTier(tier)} level`;
}
