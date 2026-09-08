import type {
  AnsweredQuestion,
  Grade,
  PlacementResult,
  Question,
  SessionState,
  Tier,
} from './types';
import { MAX_TIER, MIN_TIER } from './types';
import { QUESTIONS } from './questionBank';

/** Session length guardrails. */
export const MAX_QUESTIONS = 14;
/** Number of trailing questions that must share a tier to call placement stable. */
export const STABILITY_WINDOW = 4;
/** Never end before this — a stable window alone shouldn't cut a session short. */
export const MIN_QUESTIONS = 6;
/** Consecutive answers needed to move a tier. */
export const STREAK_TO_MOVE = 2;

/** Where a child starts, by the grade the parent stated. Kindergarten–1 start
 *  at the foundation tier, 2–4 mid, 5–6 at the top. The engine moves them from
 *  there within a couple of questions if the start was wrong. */
const GRADE_START_TIER: Record<Grade, Tier> = {
  K: 1,
  '1': 1,
  '2': 2,
  '3': 2,
  '4': 2,
  '5': 3,
  '6': 3,
};

export function startTierForGrade(grade: Grade): Tier {
  return GRADE_START_TIER[grade];
}

export function createSession(grade: Grade, now: number = Date.now()): SessionState {
  return {
    currentTier: startTierForGrade(grade),
    questionsAnswered: [],
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    startedAt: now,
    tierHistory: [],
    servedQuestionIds: [],
  };
}

function clampTier(tier: number): Tier {
  return Math.min(MAX_TIER, Math.max(MIN_TIER, tier)) as Tier;
}

/**
 * Picks the next unserved question, preferring the current tier. If that tier is
 * exhausted it walks outward to the nearest tier with items left, so a short
 * placeholder bank can never dead-end the flow.
 */
export function selectNextQuestion(state: SessionState): Question | null {
  const served = new Set(state.servedQuestionIds);
  const byDistance = [...QUESTIONS]
    .filter((q) => !served.has(q.id))
    .sort(
      (a, b) =>
        Math.abs(a.tier - state.currentTier) - Math.abs(b.tier - state.currentTier),
    );
  return byDistance[0] ?? null;
}

/** True once the trailing window of answers has all sat at the same tier. */
export function isTierStable(state: SessionState): boolean {
  if (state.tierHistory.length < STABILITY_WINDOW) return false;
  const window = state.tierHistory.slice(-STABILITY_WINDOW);
  return window.every((t) => t === window[0]);
}

export function isSessionComplete(state: SessionState): boolean {
  if (state.questionsAnswered.length >= MAX_QUESTIONS) return true;
  if (selectNextQuestion(state) === null) return true;
  if (state.questionsAnswered.length < MIN_QUESTIONS) return false;
  return isTierStable(state);
}

/**
 * Applies one answer and returns the next session state.
 *
 * Branching: two correct in a row moves up a tier, two incorrect in a row moves
 * down. Either move resets both streaks so a child needs a fresh pair at the new
 * tier before moving again.
 */
export function submitAnswer(
  state: SessionState,
  question: Question,
  selectedAnswerId: string,
  now: number = Date.now(),
): SessionState {
  const wasCorrect = selectedAnswerId === question.correctAnswerId;
  const lastAnsweredAt =
    state.questionsAnswered[state.questionsAnswered.length - 1]?.answeredAt ??
    state.startedAt;

  const record: AnsweredQuestion = {
    questionId: question.id,
    tier: question.tier,
    selectedAnswerId,
    wasCorrect,
    answeredAt: now,
    elapsedMs: Math.max(0, now - lastAnsweredAt),
  };

  let consecutiveCorrect = wasCorrect ? state.consecutiveCorrect + 1 : 0;
  let consecutiveIncorrect = wasCorrect ? 0 : state.consecutiveIncorrect + 1;
  let currentTier = state.currentTier;

  if (consecutiveCorrect >= STREAK_TO_MOVE) {
    currentTier = clampTier(currentTier + 1);
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
  } else if (consecutiveIncorrect >= STREAK_TO_MOVE) {
    currentTier = clampTier(currentTier - 1);
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
  }

  const next: SessionState = {
    ...state,
    currentTier,
    consecutiveCorrect,
    consecutiveIncorrect,
    questionsAnswered: [...state.questionsAnswered, record],
    tierHistory: [...state.tierHistory, currentTier],
    servedQuestionIds: [...state.servedQuestionIds, question.id],
  };

  return isSessionComplete(next) ? { ...next, finishedAt: now } : next;
}

/** Parent-facing placement language. Deliberately never exposes the tier number. */
const TIER_PLACEMENT: Record<
  Tier,
  { gradeEquivalentDisplay: string; recommendedStartingModule: string; summary: string }
> = {
  1: {
    gradeEquivalentDisplay: 'Reading at an early primary level (Grade K–1)',
    recommendedStartingModule: 'Trailhead: Sounds, Sight Words & First Stories',
    summary:
      'Your child is building the foundations — decoding words and pulling simple facts out of a short story. Starting here keeps every lesson winnable, which is what rebuilds confidence and attention.',
  },
  2: {
    gradeEquivalentDisplay: 'Reading at an early-to-mid primary level (Grade 2–3)',
    recommendedStartingModule: 'Ridge Trail: Context Clues & Story Details',
    summary:
      'Your child reads short passages comfortably and can find details in them. The next step is inference — figuring out what a story implies rather than states outright.',
  },
  3: {
    gradeEquivalentDisplay: 'Reading at a junior level (Grade 4–6)',
    recommendedStartingModule: 'Summit Path: Inference, Main Idea & Author’s Purpose',
    summary:
      'Your child handles longer passages and reasons about why things happen, not just what happened. This track pushes into main idea, author’s purpose and richer vocabulary.',
  },
};

export function buildResult(state: SessionState): PlacementResult {
  const placement = TIER_PLACEMENT[state.currentTier];
  const finishedAt = state.finishedAt ?? Date.now();
  return {
    finalTier: state.currentTier,
    ...placement,
    questionsAnswered: state.questionsAnswered.length,
    durationMs: Math.max(0, finishedAt - state.startedAt),
    history: state.questionsAnswered,
  };
}

/** Coin reward is participation-based on purpose — it must not leak a score. */
export function coinsEarned(state: SessionState): number {
  return state.questionsAnswered.length * 10;
}
