import type { Tier } from './tiers';
import { clampTier } from './tiers';
import type { Subject } from './subjects';

/**
 * Reading is assessed as two subjects — oral reading and comprehension — and
 * the gate needs one reading level. This module owns that derivation.
 */
export const READING_SUBJECTS: Subject[] = ['oral-reading', 'reading-comprehension'];

export function isReadingSubject(subject: Subject): boolean {
  return READING_SUBJECTS.includes(subject);
}

export interface ReadingPart {
  subject: Subject;
  finalTier: Tier;
}

/**
 * READING LEVEL DERIVATION — CONFIG. PENDING TEACHER SIGN-OFF.
 *
 * `lowest` is the default: a child is only as strong a reader as their weaker
 * half, and decoding that lags comprehension (or the reverse) is exactly the
 * case the reading gate exists to catch. `weighted` is here for teachers who
 * would rather let one side carry more. Swapping is a one-line config edit.
 */
export type ReadingLevelRule = 'lowest' | 'weighted';

export const ACTIVE_READING_LEVEL_RULE: ReadingLevelRule = 'lowest';

/** Only read by the `weighted` rule. Relative weights; they need not sum to 1. */
export const READING_LEVEL_WEIGHTS: Record<string, number> = {
  'oral-reading': 1,
  'reading-comprehension': 1,
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

/** Null until both reading sittings are done — a half-measured reader is not
 *  a reading level, and the gate must wait rather than guess. */
export function deriveReadingLevel(
  parts: ReadingPart[],
  rule: ReadingLevelRule = ACTIVE_READING_LEVEL_RULE,
): Tier | null {
  if (parts.length < READING_SUBJECTS.length) return null;
  return RULES[rule](parts);
}

/** The weaker of the two — the one the reading program starts on. */
export function readingBottleneck<T extends ReadingPart>(parts: T[]): T | null {
  if (parts.length === 0) return null;
  return parts.reduce((low, p) => (p.finalTier < low.finalTier ? p : low));
}
