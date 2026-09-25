import type { Tier } from './tiers';
import { clampTier } from './tiers';
import type { Subject, Track } from './tracks';
import { TRACKS, trackOf } from './tracks';

/**
 * Each track measures reading with more than one subject, and the placement
 * needs one reading level. This module owns that derivation.
 */
export function readingSubjectsFor(track: Track): Subject[] {
  return TRACKS[track].readingSubjects;
}

export function isReadingSubject(subject: Subject): boolean {
  return readingSubjectsFor(trackOf(subject)).includes(subject);
}

export interface ReadingPart {
  subject: Subject;
  finalTier: Tier;
  /**
   * False when nothing in that sitting was scored — a read-aloud with no
   * scorer behind it. Its finalTier is the tier the sitting opened on, not a
   * measure, so the derivation must not read it.
   */
  unscored?: boolean;
}

/**
 * READING LEVEL DERIVATION — CONFIG. PENDING TEACHER SIGN-OFF.
 *
 * `lowest` is the default: a child is only as strong a reader as their weaker
 * half, and a gap between decoding and comprehension is exactly the case the
 * reading gate exists to catch. `weighted` is here for teachers who would
 * rather let one side carry more. Swapping is a one-line config edit.
 */
export type ReadingLevelRule = 'lowest' | 'weighted';

export const ACTIVE_READING_LEVEL_RULE: ReadingLevelRule = 'lowest';

/** Only read by the `weighted` rule. Relative weights; they need not sum to 1. */
export const READING_LEVEL_WEIGHTS: Record<string, number> = {
  'oral-reading': 1,
  'reading-comprehension': 1,
  'letter-sounds': 1,
  'word-practice': 1,
};

const RULES: Record<ReadingLevelRule, (parts: ReadingPart[]) => Tier> = {
  lowest: (parts) => clampTier(Math.min(...parts.map((p) => p.finalTier))),
  weighted: (parts) => {
    const total = parts.reduce((sum, p) => sum + (READING_LEVEL_WEIGHTS[p.subject] ?? 1), 0);
    const weighted = parts.reduce(
      (sum, p) => sum + p.finalTier * (READING_LEVEL_WEIGHTS[p.subject] ?? 1),
      0,
    );
    // Round down: a half-tier of doubt goes to the more cautious placement.
    return clampTier(Math.floor(weighted / total));
  },
};

/** The reading sittings a level may actually be read off. */
export function measuredParts<T extends ReadingPart>(parts: T[]): T[] {
  return parts.filter((p) => !p.unscored);
}

/**
 * Null until every reading subject in the track is sat — a half-measured
 * reader is not a reading level, and the gate must wait rather than guess.
 *
 * An UNSCORED sitting is sat but not measured. Rather than withholding every
 * placement until speech scoring exists, the level derives from whatever was
 * measured, and `readingRestsOn` reports which subjects that was so the
 * results page can say so plainly. Null only when nothing was measured at all.
 */
export function deriveReadingLevel(
  track: Track,
  parts: ReadingPart[],
  rule: ReadingLevelRule = ACTIVE_READING_LEVEL_RULE,
): Tier | null {
  if (parts.length < readingSubjectsFor(track).length) return null;
  const measured = measuredParts(parts);
  if (measured.length === 0) return null;
  return RULES[rule](measured);
}

/** The weakest of them — the one the reading program starts on. */
export function readingBottleneck<T extends ReadingPart>(parts: T[]): T | null {
  const measured = measuredParts(parts);
  if (measured.length === 0) return null;
  return measured.reduce((low, p) => (p.finalTier < low.finalTier ? p : low));
}
