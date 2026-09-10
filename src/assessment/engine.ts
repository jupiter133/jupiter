import type {
  AnsweredQuestion,
  Grade,
  PlacementResult,
  ProgramPlacement,
  Question,
  SessionState,
  Subject,
  SubjectPlacement,
  SubjectResult,
  Tier,
} from './types';
import { startTierForGrade, subjectsForGrade, tierGradeLabel } from './types';
import { MAX_TIER, clampTier } from './tiers';
import { QUESTIONS } from './questionBank';
import { nextSubjectFor } from './placementStore';

/** Questions in one subject sitting, at most. */
export const QUESTIONS_PER_SUBJECT = 8;
/** End the subject early once the tier has held for this many answers. */
export const STABILITY_WINDOW = 4;
/** Consecutive answers needed to move a tier. */
export const STREAK_TO_MOVE = 2;

export function createSession(
  grade: Grade,
  subject: Subject,
  now: number = Date.now(),
): SessionState {
  return {
    grade,
    subject,
    currentTier: startTierForGrade(grade),
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    questionsAnswered: [],
    tierHistory: [],
    servedQuestionIds: [],
    startedAt: now,
  };
}

/**
 * Picks the next unserved question in this subject, preferring the session's
 * current tier and walking outward to the nearest tier that still has items.
 * Never crosses into another subject.
 */
export function selectNextQuestion(state: SessionState): Question | null {
  const served = new Set(state.servedQuestionIds);
  const candidates = QUESTIONS.filter(
    (q) => q.subject === state.subject && !served.has(q.id),
  ).sort((a, b) => Math.abs(a.tier - state.currentTier) - Math.abs(b.tier - state.currentTier));
  return candidates[0] ?? null;
}

/** True once the tier has not changed across the trailing window. */
export function isTierStable(state: SessionState): boolean {
  if (state.tierHistory.length < STABILITY_WINDOW) return false;
  const window = state.tierHistory.slice(-STABILITY_WINDOW);
  return window.every((t) => t === window[0]);
}

export function isSessionComplete(state: SessionState): boolean {
  if (state.questionsAnswered.length >= QUESTIONS_PER_SUBJECT) return true;
  if (selectNextQuestion(state) === null) return true;
  return isTierStable(state);
}

/**
 * Applies one answer and returns the next session state.
 *
 * Two correct in a row moves up a tier, two incorrect moves down. Either move
 * resets both streaks, so a fresh pair is needed at the new tier before moving
 * again. The tier the session ends on is the placement for this subject.
 */
export function submitAnswer(
  state: SessionState,
  question: Question,
  selectedAnswerId: string,
  now: number = Date.now(),
): SessionState {
  const wasCorrect = selectedAnswerId === question.correctAnswerId;
  const lastAnsweredAt =
    state.questionsAnswered[state.questionsAnswered.length - 1]?.answeredAt ?? state.startedAt;

  const record: AnsweredQuestion = {
    questionId: question.id,
    subject: question.subject,
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

/** The tier the session ended on is the placement for that subject. */
export function toSubjectResult(state: SessionState): SubjectResult {
  const finishedAt = state.finishedAt ?? Date.now();
  return {
    subject: state.subject,
    finalTier: state.currentTier,
    questionsAnswered: state.questionsAnswered.length,
    durationMs: Math.max(0, finishedAt - state.startedAt),
    completedAt: finishedAt,
    history: state.questionsAnswered,
  };
}

/** The programs a child can be placed into. The product is K–6, so tiers 7–8
 *  place at the top program and read as working above grade level. */
const PROGRAMS: { maxTier: Tier; name: string; description: string }[] = [
  {
    maxTier: 1,
    name: 'Trailhead',
    description:
      'Our foundations program: letters and sounds, sight words, numbers to twenty and first sentences. Short daily lessons that keep every step winnable.',
  },
  {
    maxTier: 3,
    name: 'Ridge Trail',
    description:
      'Our core program: decoding and reading for detail, times tables and fractions, and writing complete sentences.',
  },
  {
    maxTier: MAX_TIER,
    name: 'Summit Path',
    description:
      'Our junior program: inference and main idea, multi-step problems and decimals, and paragraph structure and editing.',
  },
];

function programForTier(tier: Tier): ProgramPlacement {
  const band = PROGRAMS.find((p) => tier <= p.maxTier) ?? PROGRAMS[PROGRAMS.length - 1];
  return {
    tier,
    name: band.name,
    gradeEquivalentDisplay: tierGradeLabel(tier),
    description: band.description,
  };
}

/**
 * Assembles the parent-facing result from whatever subjects are finished.
 *
 * `subjects` carries only completed sittings, so a K–3 child yields a single
 * reading row and the parent view has no empty math or writing slots to render.
 * The program is withheld until every required subject is done — a placement
 * from a third of the evidence would be a guess wearing a label.
 */
export function buildResult(grade: Grade, completed: SubjectResult[]): PlacementResult {
  const requiredSubjects = subjectsForGrade(grade);
  const inOrder = requiredSubjects
    .map((subject) => completed.find((r) => r.subject === subject))
    .filter((r): r is SubjectResult => Boolean(r));

  const subjects: SubjectPlacement[] = inOrder.map((r) => ({
    subject: r.subject,
    finalTier: r.finalTier,
    gradeEquivalentDisplay: tierGradeLabel(r.finalTier),
    questionsAnswered: r.questionsAnswered,
  }));

  const nextSubject = nextSubjectFor(requiredSubjects, completed);
  const complete = nextSubject === null && subjects.length === requiredSubjects.length;

  const finalTier = subjects.length
    ? clampTier(subjects.reduce((sum, s) => sum + s.finalTier, 0) / subjects.length)
    : startTierForGrade(grade);

  return {
    grade,
    requiredSubjects,
    subjects,
    nextSubject,
    complete,
    program: complete ? programForTier(finalTier) : null,
    finalTier,
    questionsAnswered: inOrder.reduce((sum, r) => sum + r.questionsAnswered, 0),
    durationMs: inOrder.reduce((sum, r) => sum + r.durationMs, 0),
  };
}
