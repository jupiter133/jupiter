import type { Grade, Tier } from './tiers';

/**
 * PROGRAM CONFIG — placeholder names pending a naming decision.
 *
 * Everything a parent or a planner sees comes from these tables, not from
 * strings scattered through the code, so renaming is a single edit here.
 */

/** Which Core Skills band a child sits in. Set by GRADE, never by assessed level. */
export type CoreBand = '1-3' | '4-6';

/**
 * Early Learners, JK and SK fold into the 1–3 band: the published bands start
 * at Grade 1, and a kindergartener who reads at a Grade 3 level has nowhere
 * else to go. FLAGGED FOR TEACHER SIGN-OFF.
 */
export function coreBandForGrade(grade: Grade): CoreBand {
  return grade === '4' || grade === '5' || grade === '6' ? '4-6' : '1-3';
}

/**
 * The Reading track's six sequential levels, for children reading below a
 * Grade 3 level.
 */
export const READING_TRACK_LEVELS = [
  'Core Reading 1',
  'Core Reading 2',
  'Core Reading 3',
  'Core Reading 4',
  'Core Reading 5',
  'Core Reading 6',
] as const;

/**
 * Core Skills planners.
 *
 * The 1–3 band has no separate Reading and Writing planners — they are one
 * planner — so gate steps 2 and 3 both resolve to it for a Grade 1–3 child.
 */
export const CORE_SKILLS_PROGRAMS: Record<CoreBand, Record<string, string>> = {
  '1-3': {
    reading: 'Core Skills Reading and Writing 1-3',
    writing: 'Core Skills Reading and Writing 1-3',
    math: 'Core Skills Math 1-3',
    enriched: 'Core Skills Enriched 1-3',
  },
  '4-6': {
    reading: 'Core Skills Reading 4-6',
    writing: 'Core Skills Writing 4-6',
    math: 'Core Skills Math 4-6',
    enriched: 'Core Skills Enriched 4-6',
  },
};

/**
 * Reading tier → which of the six Core Reading levels.
 *
 * NOT DEFINED YET — FLAGGED FOR TEACHER SIGN-OFF.
 *
 * Only tiers 0, 1 and 2 can reach the Reading track (a tier 3 reader is at a
 * Grade 3 level and routes to Core Skills), so three tiers have to address six
 * levels. This placeholder spreads them across the range; distinguishing all
 * six needs a finer measure than the tier alone — sub-skill scores, or a
 * within-tier score — which is a content decision, not a code one.
 */
export const CORE_READING_LEVEL_BY_TIER: Record<number, number> = {
  0: 1,
  1: 3,
  2: 5,
};

export function coreReadingProgramFor(readingTier: Tier): string {
  const level = CORE_READING_LEVEL_BY_TIER[readingTier] ?? 1;
  const index = Math.min(READING_TRACK_LEVELS.length, Math.max(1, level)) - 1;
  return READING_TRACK_LEVELS[index];
}

/**
 * Parent-facing description per gate outcome. Copy placeholder pending teacher
 * sign-off; the shape is fixed, the words are not.
 */
export const PROGRAM_DESCRIPTIONS: Record<string, string> = {
  'reading-track':
    'A dedicated reading program. Decoding, phonics and fluency come first, in short daily lessons, because reading is what every other subject is built on.',
  'core-reading':
    'Core Skills with reading as the focus: decoding, vocabulary and reading for detail, alongside grade-level work in the other subjects.',
  'core-writing':
    'Core Skills with writing and spelling as the focus: spelling patterns, sentence structure and building a paragraph, alongside grade-level work elsewhere.',
  'core-math':
    'Core Skills with math as the focus: number sense, operations and problem solving, alongside grade-level work in reading and writing.',
  enriched:
    'Core Skills Enriched: grade-level work across all four subjects, with extension activities that go further in the subjects your child is strongest in.',
};
