/** Difficulty tiers for v1. Tier data ships in the content JSON; these are the
 *  only three tiers the placement engine knows about. */
export type Tier = 1 | 2 | 3;

export const TIERS: Tier[] = [1, 2, 3];
export const MIN_TIER: Tier = 1;
export const MAX_TIER: Tier = 3;

export type Grade = 'K' | '1' | '2' | '3' | '4' | '5' | '6';

export type QuestionSkill = 'vocabulary' | 'comprehension';

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  tier: Tier;
  skill: QuestionSkill;
  /** Present on comprehension items — rendered beside the question. */
  passage?: string;
  passageTitle?: string;
  questionText: string;
  options: AnswerOption[];
  correctAnswerId: string;
}

export interface ParentContext {
  grade: Grade;
  /** Optional, self-reported. Never used to gate content — only surfaced back
   *  to the parent on the results screen so pacing advice can account for it. */
  learningChallenges: string;
}

export interface AnsweredQuestion {
  questionId: string;
  tier: Tier;
  selectedAnswerId: string;
  /** Recorded for later analysis. Never rendered to the child mid-session. */
  wasCorrect: boolean;
  answeredAt: number;
  /** ms spent on this single item. */
  elapsedMs: number;
}

export interface SessionState {
  currentTier: Tier;
  questionsAnswered: AnsweredQuestion[];
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  startedAt: number;
  /** Tier history, one entry per answered question, for the stability check. */
  tierHistory: Tier[];
  /** Ids already served, so the engine never repeats an item. */
  servedQuestionIds: string[];
  finishedAt?: number;
}

export interface PlacementResult {
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  recommendedStartingModule: string;
  /** Parent-facing summary copy. */
  summary: string;
  questionsAnswered: number;
  durationMs: number;
  history: AnsweredQuestion[];
}
