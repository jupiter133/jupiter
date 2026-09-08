import bank from '../content/questionBank.json';
import type { Question, Tier } from './types';

/** The content JSON is the single source of truth for items and their tiers.
 *  Swapping in the real bank later requires no engine changes. */
export const QUESTIONS: Question[] = bank.questions as Question[];

export function questionsForTier(tier: Tier): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier);
}
