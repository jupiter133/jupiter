import type { Subject } from './subjects';
import { SUBJECT_LABEL, SUBJECT_ORDER } from './subjects';

/**
 * What the handoff screen promises before a child starts. All product
 * decisions, all in one place.
 */

/**
 * Whole placement, all four sittings, end to end. Reading alone is about
 * twenty questions across its four sub-skills; the other three are eight
 * each. The range is wide because a child can stop between sittings and the
 * adaptive stop rule ends some of them early.
 */
export const ESTIMATED_MINUTES = { min: 15, max: 30 };

export function estimatedTimeLabel(): string {
  return `${ESTIMATED_MINUTES.min}–${ESTIMATED_MINUTES.max} min`;
}

/**
 * The coins a child can earn for finishing the whole placement.
 *
 * NOTE FOR THE HOST: this flow only *promises* them. Nothing here awards or
 * banks coins — the placement has no wallet, and the completion screen still
 * shows no score. Wiring the award to the child's account is the host app's
 * job, and until it happens this is a promise the product has to keep
 * somewhere else.
 */
export const PLACEMENT_COIN_AWARD = 4000;

export function coinAwardLabel(): string {
  return `+${PLACEMENT_COIN_AWARD.toLocaleString('en-CA')} coins`;
}

/**
 * Roughly how long one sitting takes. Reading is the long one: four sub-skill
 * sittings back to back, about twenty questions. The others are eight.
 */
/** Per-sitting minutes, as the intro chips promise them. */
export const SUBJECT_MINUTES: Record<Subject, number> = {
  'oral-reading': 3,
  'reading-comprehension': 5,
  'vocabulary-spelling': 4,
  'sentence-writing': 5,
  math: 5,
};

export function subjectTimeLabel(subject: Subject): string {
  return `About ${SUBJECT_MINUTES[subject]} min`;
}

export interface IncludedStrand {
  subject: Subject;
  label: string;
}

/**
 * What's included, derived from the assessment itself rather than typed out,
 * so the promise cannot drift from what a child is actually asked.
 */
export const INCLUDED_STRANDS: IncludedStrand[] = SUBJECT_ORDER.map((subject) => ({
  subject,
  label: SUBJECT_LABEL[subject],
}));
