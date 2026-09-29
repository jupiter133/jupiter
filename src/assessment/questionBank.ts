import bank from '../content/questionBank.json';
import type { Question, Tier } from './types';

/**
 * The one bank. Subject and tier data live in the JSON, so replacing content
 * needs no engine change.
 *
 * Every subject now carries written content, still pending teacher sign-off;
 * no placeholder items remain. `BANK_HAS_TEMPLATE_ITEMS` tracks that, and a
 * test holds it to the items rather than trusting the flag — it stayed set
 * after the last placeholder subject was replaced.
 *
 * The bank's own `note` says what is still missing, which is no longer
 * content: nothing scores a spoken answer. See speechScoring.ts.
 */
export const BANK_HAS_TEMPLATE_ITEMS: boolean = bank.stub === true;

/** The bank's own description of what it is. Read by a test, not by the app. */
export const BANK_NOTE: string = (bank.note as string) ?? '';

export const QUESTIONS: Question[] = bank.questions as Question[];

export function questionsForTier(tier: Tier): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier);
}
