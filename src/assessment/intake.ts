import type { Grade } from './tiers';

/**
 * Intake collects age and grade, and they do different jobs.
 *
 * - **Grade is load-bearing for placement.** Every "grades behind" figure and
 *   the Core Skills band (1–3 vs 4–6) run on grade.
 * - **Age drives presentation only.** Read-aloud default, art-led vs text-led
 *   layout, mascot tone, session length.
 *
 * They are kept separate on purpose: a nine-year-old in Grade 2 should be
 * measured against Grade 2 but not handed a five-year-old's screen.
 */

/** Typical age at the start of each grade, used only to spot a mismatch. */
const EXPECTED_AGE: Record<Grade, number> = {
  EL: 3,
  JK: 4,
  SK: 5,
  '1': 6,
  '2': 7,
  '3': 8,
  '4': 9,
  '5': 10,
  '6': 11,
};

export const MIN_AGE = 2;
export const MAX_AGE = 12;

/** Years apart before the pairing is worth a teacher's eye. */
export const MISMATCH_THRESHOLD = 2;

export function expectedAgeForGrade(grade: Grade): number {
  return EXPECTED_AGE[grade];
}

/** Signed years: positive means older than typical for the grade. */
export function ageGradeOffset(age: number, grade: Grade): number {
  return age - expectedAgeForGrade(grade);
}

/**
 * True when age and grade disagree by two years or more, either way.
 *
 * Held back, started late, homeschooled, newly arrived, skipped ahead — all
 * land here. The flag is surfaced to the parent for teacher review rather than
 * quietly absorbed, because the placement is only as good as the grade it is
 * measured against.
 */
export function hasAgeGradeMismatch(age: number, grade: Grade): boolean {
  return Math.abs(ageGradeOffset(age, grade)) >= MISMATCH_THRESHOLD;
}

/**
 * How a sitting is *presented*. Derived from age, never from grade or from the
 * tier a child reaches: a struggling eleven-year-old still gets the older
 * child's screen.
 */
export type AgeBand = 'junior' | 'senior';

/** Ages 8 and under get the art-led treatment. */
export const JUNIOR_MAX_AGE = 8;

export function ageBandForAge(age: number): AgeBand {
  return age <= JUNIOR_MAX_AGE ? 'junior' : 'senior';
}
