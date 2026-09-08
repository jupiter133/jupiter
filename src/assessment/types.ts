/** Difficulty tiers for v1. Tier data ships in the content JSON; these are the
 *  only three tiers the placement engine knows about. */
export type Tier = 1 | 2 | 3;

export const TIERS: Tier[] = [1, 2, 3];
export const MIN_TIER: Tier = 1;
export const MAX_TIER: Tier = 3;

export type Grade = 'K' | '1' | '2' | '3' | '4' | '5' | '6';

/** The three strands assessed in v1. Order here is the order they are asked. */
export type Subject = 'reading' | 'math' | 'writing';

export const SUBJECT_ORDER: Subject[] = ['reading', 'math', 'writing'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  reading: 'Reading',
  math: 'Math',
  writing: 'Writing',
};

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subject: Subject;
  tier: Tier;
  /** Fine-grained content tag, e.g. "vocabulary", "word-problem", "conventions". */
  skill: string;
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
  subject: Subject;
  tier: Tier;
  selectedAnswerId: string;
  /** Recorded for later analysis. Never rendered to the child mid-session. */
  wasCorrect: boolean;
  answeredAt: number;
  /** ms spent on this single item. */
  elapsedMs: number;
}

/** Independent branching state for one subject. A child can sit at a different
 *  tier in math than in reading, and each strand moves on its own streaks. */
export interface SubjectState {
  currentTier: Tier;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  answeredCount: number;
  tierHistory: Tier[];
}

export interface SessionState {
  grade: Grade;
  /** Index into SUBJECT_ORDER. */
  subjectIndex: number;
  subjects: Record<Subject, SubjectState>;
  questionsAnswered: AnsweredQuestion[];
  startedAt: number;
  /** Ids already served, so the engine never repeats an item. */
  servedQuestionIds: string[];
  finishedAt?: number;
}

export interface SubjectPlacement {
  subject: Subject;
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  recommendedStartingModule: string;
  summary: string;
  questionsAnswered: number;
}

export interface PlacementResult {
  /** Rounded average across strands — drives the overall starting point. */
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  recommendedStartingModule: string;
  subjects: SubjectPlacement[];
  questionsAnswered: number;
  durationMs: number;
  history: AnsweredQuestion[];
}
