import type { Grade, Tier } from './tiers';
import {
  READING_GATE_TIER,
  isMoreThanOneGradeBehind,
  isWithinOneGrade,
} from './tiers';
import type { Subject } from './subjects';
import { CORE_SKILLS_PROGRAMS, coreBandForGrade, coreReadingProgramFor } from './programs';

export type GateOutcome =
  | 'reading-track'
  | 'core-reading'
  | 'core-writing'
  | 'core-math'
  | 'enriched';

export interface GateInputs {
  grade: Grade;
  /** Assessed reading tier — step 1 reads the absolute level, not the gap. */
  readingTier: Tier | null;
  readingGap: number | null;
  spellingGap: number | null;
  writingGap: number | null;
  mathGap: number | null;
}

export interface GateDecision {
  /** Which rule fired, 1–5. */
  step: number;
  outcome: GateOutcome;
  /** The planner name, from the program config table. */
  programName: string;
  /**
   * The subjects this decision actually rested on. Everything else was
   * measured but did not move the outcome, and is flagged non-determining.
   */
  determinedBy: Subject[];
  /** True when step 1 fired: reading below a Grade 3 level. */
  readingGated: boolean;
}

/**
 * The priority gate. Rules are evaluated in order and the first match wins.
 *
 * The order IS the policy: a child who cannot read is placed on reading no
 * matter what the later subjects say, because those results measure reading as
 * much as they measure their own subject. Steps 3 and 4 restate their
 * predecessors' conditions so each rule is true on its own terms, which is what
 * makes the hard blocks hold even if the order is ever edited.
 *
 * Returns null when a rule needs evidence that has not been gathered yet.
 */
export function evaluateGate(inputs: GateInputs): GateDecision | null {
  const { grade, readingTier, readingGap, spellingGap, writingGap, mathGap } = inputs;
  const band = coreBandForGrade(grade);
  const core = CORE_SKILLS_PROGRAMS[band];

  // 1. Reading below a Grade 3 level → Reading track, whatever else returns.
  if (readingTier === null) return null;
  if (readingTier < READING_GATE_TIER) {
    return {
      step: 1,
      outcome: 'reading-track',
      programName: coreReadingProgramFor(readingTier),
      determinedBy: ['reading'],
      readingGated: true,
    };
  }

  // 2. Reading more than one grade behind → Core Skills Reading.
  if (readingGap === null) return null;
  if (isMoreThanOneGradeBehind(readingGap)) {
    return {
      step: 2,
      outcome: 'core-reading',
      programName: core.reading,
      determinedBy: ['reading'],
      readingGated: false,
    };
  }

  // 3. Reading within one grade, but writing or spelling behind → Core Skills Writing.
  if (writingGap === null || spellingGap === null) return null;
  if (
    isWithinOneGrade(readingGap) &&
    (isMoreThanOneGradeBehind(writingGap) || isMoreThanOneGradeBehind(spellingGap))
  ) {
    return {
      step: 3,
      outcome: 'core-writing',
      programName: core.writing,
      determinedBy: ['reading', 'spelling', 'writing'],
      readingGated: false,
    };
  }

  // 4. Literacy all within one grade, math behind → Core Skills Math.
  if (mathGap === null) return null;
  const literacyOnLevel =
    isWithinOneGrade(readingGap) &&
    isWithinOneGrade(writingGap) &&
    isWithinOneGrade(spellingGap);
  if (literacyOnLevel && isMoreThanOneGradeBehind(mathGap)) {
    return {
      step: 4,
      outcome: 'core-math',
      programName: core.math,
      determinedBy: ['reading', 'spelling', 'writing', 'math'],
      readingGated: false,
    };
  }

  // 5. All four within one grade → Enriched.
  return {
    step: 5,
    outcome: 'enriched',
    programName: core.enriched,
    determinedBy: ['reading', 'spelling', 'writing', 'math'],
    readingGated: false,
  };
}
