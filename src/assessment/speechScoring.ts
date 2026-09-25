/**
 * SPEAKING IS NOT SCORED YET. This module is the seam where it will be.
 *
 * A spoken item cannot be marked by comparing a tapped id to a key — something
 * has to listen. That "something" is a product decision with cost and privacy
 * attached (browser speech recognition streams a child's voice to a third
 * party; your own ASR does not, and costs money), so it is deliberately not
 * decided here. Everything above this file is built to work either way.
 *
 * Until a scorer lands, a spoken attempt comes back UNSCORED, and an unscored
 * attempt moves nothing: no tier branching, no streak, no placement. It is
 * recorded as an observation, which is exactly what Words Speaking already is.
 * Nobody is told they said a word wrong on the strength of a guess.
 */

export type SpokenVerdict =
  /** Heard and judged. */
  | { scored: true; correct: boolean; heard?: string }
  /** Captured but not judged — no scorer, or the scorer could not decide. */
  | { scored: false; reason: 'no-scorer' | 'no-audio' | 'unclear' };

export interface SpokenAttempt {
  /** The word the child was asked to say. */
  target: string;
  /** How long they held the mic, in ms. */
  durationMs: number;
  /**
   * The captured audio, when the platform gave us any. The stub never reads
   * it; a real scorer posts it, and a record-only build stores it.
   */
  audio?: Blob;
}

export interface SpeechScorer {
  readonly id: string;
  score(attempt: SpokenAttempt): Promise<SpokenVerdict>;
}

/**
 * The stub. Returns "captured, not judged" for every attempt — never a guess
 * at right or wrong.
 */
export const STUB_SCORER: SpeechScorer = {
  id: 'stub',
  async score() {
    return { scored: false, reason: 'no-scorer' };
  },
};

export const ACTIVE_SPEECH_SCORER: SpeechScorer = STUB_SCORER;

/** Asserted by a test, so a stub cannot ship as a scorer by accident. */
export const SPEECH_SCORING_IS_STUB: boolean = ACTIVE_SPEECH_SCORER.id === 'stub';
