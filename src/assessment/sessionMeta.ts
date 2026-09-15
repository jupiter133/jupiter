import type { Subject } from './subjects';
import { SUBJECT_LABEL, SUBJECT_ORDER } from './subjects';
import { READING_SUB_SKILLS, READING_SUB_SKILL_SHORT } from './readingSkills';

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
export const PLACEMENT_COIN_AWARD = 400;

export function coinAwardLabel(): string {
  return `Up to ${PLACEMENT_COIN_AWARD} coins`;
}

export interface IncludedStrand {
  subject: Subject;
  label: string;
  /** Reading only: the sub-skills inside it. */
  detail?: string;
}

/**
 * What's included, derived from the assessment itself rather than typed out,
 * so the promise cannot drift from what a child is actually asked.
 */
export const INCLUDED_STRANDS: IncludedStrand[] = SUBJECT_ORDER.map((subject) =>
  subject === 'reading'
    ? {
        subject,
        label: SUBJECT_LABEL[subject],
        detail: READING_SUB_SKILLS.map((s) => READING_SUB_SKILL_SHORT[s]).join(' · '),
      }
    : { subject, label: SUBJECT_LABEL[subject] },
);
