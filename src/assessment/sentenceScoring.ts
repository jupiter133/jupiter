/**
 * Marking a sentence a child wrote themselves.
 *
 * WHAT THIS MEASURES, AND WHAT IT DOES NOT. Nothing here judges whether a
 * sentence is good, interesting or true. It checks four objective things:
 * the words the prompt asked for are present, it opens with a capital, it
 * closes with terminal punctuation, and it is longer than the words it was
 * handed. That is sentence mechanics, and it is all a rule can honestly claim.
 *
 * A teacher who wants to know whether the writing is any good reads it: every
 * typed answer is stored verbatim on the result, precisely because this
 * function cannot tell them.
 */

export interface SentenceRubric {
  /** Words the prompt required, matched whole and case-insensitively. */
  requiredWords: string[];
  /** At least this many words beyond the required ones. */
  extraWordsNeeded?: number;
}

export interface SentenceMarks {
  hasRequiredWords: boolean;
  startsCapitalised: boolean;
  endsWithPunctuation: boolean;
  longEnough: boolean;
  /** All four, which is what the engine records as correct. */
  correct: boolean;
  /** Required words the child left out, for a teacher to read. */
  missingWords: string[];
}

const TERMINAL = /[.!?]["']?\s*$/;

function words(text: string): string[] {
  return text
    .toLowerCase()
    // Curly and straight apostrophes stay inside a word; everything else splits.
    .replace(/[^\p{L}\p{N}'’\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function markSentence(written: string, rubric: SentenceRubric): SentenceMarks {
  const text = written.trim();
  const said = new Set(words(text));
  const missingWords = rubric.requiredWords.filter((w) => !said.has(w.toLowerCase()));
  const hasRequiredWords = missingWords.length === 0;
  const startsCapitalised = /^\p{Lu}/u.test(text);
  const endsWithPunctuation = TERMINAL.test(text);
  const longEnough =
    words(text).length >= rubric.requiredWords.length + (rubric.extraWordsNeeded ?? 3);

  return {
    hasRequiredWords,
    startsCapitalised,
    endsWithPunctuation,
    longEnough,
    missingWords,
    correct: hasRequiredWords && startsCapitalised && endsWithPunctuation && longEnough,
  };
}

/**
 * Enough written to be worth marking at all. An empty box is not a wrong
 * answer, it is a child who did not answer, and the two should not look the
 * same to a teacher.
 */
export function hasAttempt(written: string): boolean {
  return written.trim().length > 0;
}
