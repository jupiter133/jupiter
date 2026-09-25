import type { Subject, Track } from './subjects';
import { SUBJECT_LABEL, TRACKS, subjectsForTrack } from './subjects';

/**
 * What each assessment promises before a child starts. All product decisions,
 * all in one place.
 */

/** Whole-track estimate, from the track config. */
export function estimatedTimeLabel(track: Track): string {
  return `~${TRACKS[track].minutes} min`;
}

/**
 * The coins a child can earn for finishing the whole placement.
 *
 * NOTE FOR THE HOST: this flow only *promises* them. Nothing here awards or
 * banks coins — the placement has no wallet, and no screen shows a child a
 * score. Wiring the award to the child's account is the host app's job.
 */
export const PLACEMENT_COIN_AWARD = 4000;

export function coinAwardLabel(): string {
  return `+${PLACEMENT_COIN_AWARD.toLocaleString('en-CA')} coins`;
}

/**
 * Questions in one sitting. Short for the little ones, longer where the intro
 * promises more.
 */
export const QUESTIONS_PER_SUBJECT: Record<Subject, number> = {
  'find-the-same': 6,
  'match-making': 6,
  'spot-the-difference': 6,
  'shapes-colors': 6,
  'number-fun': 6,
  'letter-sounds': 8,
  'word-practice': 8,
  'words-speaking': 6,
  // Passages, not single items — five is already three or four minutes of
  // reading aloud for a child.
  'oral-reading': 5,
  vocabulary: 8,
  'reading-comprehension': 8,
  spelling: 8,
  'sentence-writing': 8,
  math: 10,
};

/** Roughly how long one sitting takes, for the intro's time chip. */
export const SUBJECT_MINUTES: Record<Subject, number> = {
  'find-the-same': 2,
  'match-making': 2,
  'spot-the-difference': 2,
  'shapes-colors': 2,
  'number-fun': 2,
  'letter-sounds': 3,
  'word-practice': 3,
  'words-speaking': 3,
  'oral-reading': 3,
  vocabulary: 4,
  'reading-comprehension': 5,
  spelling: 4,
  'sentence-writing': 5,
  math: 5,
};

export function subjectTimeLabel(subject: Subject): string {
  return `~${SUBJECT_MINUTES[subject]} minutes`;
}

export interface IncludedStrand {
  subject: Subject;
  label: string;
}

/**
 * What's included, derived from the track itself rather than typed out, so the
 * promise cannot drift from what a child is actually asked.
 */
export function includedStrands(track: Track): IncludedStrand[] {
  return subjectsForTrack(track).map((subject) => ({ subject, label: SUBJECT_LABEL[subject] }));
}
