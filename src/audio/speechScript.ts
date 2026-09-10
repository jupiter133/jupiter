import type { AgeBand, Question } from '../assessment/types';
import { questionTextFor } from '../assessment/types';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Builds what the read-aloud button says, as separate utterances so the browser
 * inserts a natural pause between them.
 *
 * Junior gets the answer choices read too: a child who cannot read the question
 * cannot read the options either, so stopping at the question would leave them
 * exactly as stuck. Senior gets passage and question only — by Grade 4 the
 * options are quick to scan, and sitting through four read-out options is
 * slower than reading them.
 */
export function speechScriptFor(question: Question, band: AgeBand): string[] {
  const parts: string[] = [];

  if (question.passage) {
    if (question.passageTitle) parts.push(question.passageTitle);
    parts.push(question.passage);
  }

  parts.push(questionTextFor(question, band));

  if (band === 'junior') {
    question.options.forEach((option, i) => {
      parts.push(`${OPTION_KEYS[i] ?? i + 1}. ${option.text}`);
    });
  }

  return parts;
}

/** Younger listeners need it slower. */
export function speechRateFor(band: AgeBand): number {
  return band === 'junior' ? 0.85 : 0.95;
}

/**
 * Auto-read starts ON for K–3, where many children cannot yet read the question
 * they are being asked, and OFF for Grade 4–6, who can — they still get the
 * "Read to me" control and a speaker on every answer, one tap away.
 */
export function audioDefaultFor(band: AgeBand): boolean {
  return band === 'junior';
}
