import bank from '../content/questionBank.json';
import trackStub from '../content/trackBank.stub.json';
import type { Question, Tier } from './types';

/**
 * The content JSON is the single source of truth for items and their tiers.
 * Swapping in the real bank later requires no engine changes.
 *
 * `trackBank.stub.json` is MIXED, and deliberately says so in its own note:
 * the seven Little Readers activities and Spelling are template-generated
 * placeholder, while Words Speaking, Oral Reading, Vocabulary and Reading
 * Comprehension carry written content that is still pending teacher sign-off.
 * `TRACK_BANK_IS_STUB` stays true until none of it is template, so nothing
 * ships on a generated item quietly — the README and a test both point here.
 */
export const TRACK_BANK_IS_STUB: boolean = trackStub.stub === true;

export const QUESTIONS: Question[] = [
  ...(bank.questions as Question[]),
  ...(trackStub.questions as Question[]),
];

export function questionsForTier(tier: Tier): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier);
}
