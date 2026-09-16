import bank from '../content/questionBank.json';
import readingStub from '../content/readingBank.stub.json';
import trackStub from '../content/trackBank.stub.json';
import type { Question, Tier } from './types';

/**
 * The content JSON is the single source of truth for items and their tiers.
 * Swapping in the real bank later requires no engine changes.
 *
 * TWO BANKS ARE STUBS. `trackBank.stub.json` covers the Little Reader
 * activities, Words Speaking and Spelling; READING IS A STUB. `readingBank.stub.json` is template-generated so the four
 * sub-skill sittings can be exercised end to end; it is not assessment
 * content. `READING_BANK_IS_STUB` is exported so nothing can ship on it
 * quietly — the README and a test both point at it.
 */
export const READING_BANK_IS_STUB: boolean = readingStub.stub === true;
export const TRACK_BANK_IS_STUB: boolean = trackStub.stub === true;

export const QUESTIONS: Question[] = [
  ...(bank.questions as Question[]),
  ...(readingStub.questions as Question[]),
  ...(trackStub.questions as Question[]),
];

export function questionsForTier(tier: Tier): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier);
}
