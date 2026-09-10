import type { Tier } from './tiers';
import { clampTier } from './tiers';

/**
 * Reading is assessed as four sub-skills, sat back to back inside one reading
 * session. Each has its own bank, its own adaptive branch and its own result.
 */
export type ReadingSubSkill =
  | 'word-recognition'
  | 'oral-reading'
  | 'reading-vocabulary'
  | 'passage-comprehension';

export const READING_SUB_SKILLS: ReadingSubSkill[] = [
  'word-recognition',
  'oral-reading',
  'reading-vocabulary',
  'passage-comprehension',
];

export const READING_SUB_SKILL_LABEL: Record<ReadingSubSkill, string> = {
  'word-recognition': 'Word recognition',
  'oral-reading': 'Oral reading',
  'reading-vocabulary': 'Reading vocabulary',
  'passage-comprehension': 'Passage comprehension',
};

/** A sub-skill sitting is shorter than a full subject sitting. */
export const QUESTIONS_PER_SUB_SKILL = 5;
/** And so its early stop fires sooner: tier held for three answers, not four. */
export const SUB_SKILL_STABILITY_WINDOW = 3;

export interface SubSkillResult {
  subSkill: ReadingSubSkill;
  finalTier: Tier;
  questionsAnswered: number;
}

/**
 * READING LEVEL DERIVATION — CONFIG. PENDING TEACHER SIGN-OFF.
 *
 * The gate needs one reading level. These are the rules on offer for turning
 * four sub-skill tiers into it; `ACTIVE_READING_LEVEL_RULE` picks one. The
 * default is the lowest of the four: a child is only as strong a reader as
 * their weakest sub-skill. The teachers may prefer weighting — decoding and
 * comprehension are likely to matter more than vocabulary — which is the
 * `weighted` rule with `READING_LEVEL_WEIGHTS` edited. Swapping rules is a
 * one-line config edit, not a code change.
 */
export type ReadingLevelRule = 'lowest' | 'weighted';

export const ACTIVE_READING_LEVEL_RULE: ReadingLevelRule = 'lowest';

/** Only read by the `weighted` rule. Relative weights; they need not sum to 1. */
export const READING_LEVEL_WEIGHTS: Record<ReadingSubSkill, number> = {
  'word-recognition': 1,
  'oral-reading': 2,
  'reading-vocabulary': 1,
  'passage-comprehension': 2,
};

const RULES: Record<ReadingLevelRule, (results: SubSkillResult[]) => Tier> = {
  lowest: (results) => clampTier(Math.min(...results.map((r) => r.finalTier))),
  weighted: (results) => {
    const total = results.reduce((sum, r) => sum + READING_LEVEL_WEIGHTS[r.subSkill], 0);
    const weighted = results.reduce(
      (sum, r) => sum + r.finalTier * READING_LEVEL_WEIGHTS[r.subSkill],
      0,
    );
    // Round down: a half-tier of doubt goes to the more cautious placement.
    return clampTier(Math.floor(weighted / total));
  },
};

export function deriveReadingLevel(
  results: SubSkillResult[],
  rule: ReadingLevelRule = ACTIVE_READING_LEVEL_RULE,
): Tier {
  if (results.length === 0) return 0;
  return RULES[rule](results);
}

/** The sub-skill holding the reading level down — the one to work on first. */
export function readingBottleneck<T extends { subSkill: ReadingSubSkill; finalTier: Tier }>(
  results: T[],
): T | null {
  if (results.length === 0) return null;
  return results.reduce((low, r) => (r.finalTier < low.finalTier ? r : low));
}
