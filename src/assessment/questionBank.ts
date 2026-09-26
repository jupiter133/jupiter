import bank from '../content/questionBank.json';
import type { Question, Tier } from './types';

/**
 * The one bank. Subject and tier data live in the JSON, so replacing content
 * needs no engine change.
 *
 * It is MIXED, and its own `note` field says which parts are which: the seven
 * Little Readers activities are template-generated placeholder, while every
 * Grade Level subject carries written content that is still pending teacher
 * sign-off. `BANK_HAS_TEMPLATE_ITEMS` stays true until none of it is
 * generated, so nothing ships on a template item quietly — the README and a
 * test both point here.
 */
export const BANK_HAS_TEMPLATE_ITEMS: boolean = bank.stub === true;

export const QUESTIONS: Question[] = bank.questions as Question[];

export function questionsForTier(tier: Tier): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier);
}
