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
} from './types';
import { startTierForGrade, subjectsForGrade, tierGradeLabel } from './types';
import { MIN_TIER, clampTier, gapFor, gradeTier } from './tiers';
import { evaluateGate, type GateInputs } from './gate';
import { hasAgeGradeMismatch } from './intake';
import { PROGRAM_DESCRIPTIONS } from './programs';
import {
  QUESTIONS_PER_SUB_SKILL,
  SUB_SKILL_STABILITY_WINDOW,
  deriveReadingLevel,
  type ReadingSubSkill,
  type SubSkillResult,
} from './readingSkills';
import { QUESTIONS } from './questionBank';
import { nextSubjectFor } from './placementStore';

/** Questions in one subject sitting, at most. */
export const QUESTIONS_PER_SUBJECT = 8;
/** End the subject early once the tier has held for this many answers. */
export const STABILITY_WINDOW = 4;
/** Consecutive answers needed to move a tier. */
export const STREAK_TO_MOVE = 2;

/**
 * Starts one subject sitting.
 *
 * A floored sitting starts at the lowest tier instead of the grade tier. That
 * is for a child whose reading gated: asking a Grade 5 spelling question of a
 * child reading at a Grade 1 level measures the reading, not the spelling, and
 * hands them eight straight failures on the way down. Branching still runs
 * upward, so a child who can spell climbs out of the floor.
 */
export function createSession(
  grade: Grade,
  subject: Subject,
  options: { floored?: boolean; subSkill?: ReadingSubSkill } = {},
  now: number = Date.now(),
): SessionState {
  const floored = options.floored ?? false;
  const isSubSkill = options.subSkill !== undefined;
  return {
    grade,
    subject,
    subSkill: options.subSkill,
    // A reading sub-skill sitting is shorter, with a shorter early stop.
    maxQuestions: isSubSkill ? QUESTIONS_PER_SUB_SKILL : QUESTIONS_PER_SUBJECT,
    stabilityWindow: isSubSkill ? SUB_SKILL_STABILITY_WINDOW : STABILITY_WINDOW,
    floored,
    currentTier: floored ? MIN_TIER : startTierForGrade(grade),
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
    (q) =>
      q.subject === state.subject &&
      (state.subSkill === undefined || q.subSkill === state.subSkill) &&
      !served.has(q.id),
  ).sort((a, b) => Math.abs(a.tier - state.currentTier) - Math.abs(b.tier - state.currentTier));
  return candidates[0] ?? null;
}

/** True once the tier has not changed across the trailing window. */
export function isTierStable(state: SessionState): boolean {
  const size = state.stabilityWindow ?? STABILITY_WINDOW;
  if (state.tierHistory.length < size) return false;
  const window = state.tierHistory.slice(-size);
  return window.every((t) => t === window[0]);
}

export function isSessionComplete(state: SessionState): boolean {
  if (state.questionsAnswered.length >= (state.maxQuestions ?? QUESTIONS_PER_SUBJECT)) return true;
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
  } else if (consecutiveIncorrect >= STREAK_TO_MOVE && !state.floored) {
    // A floored sitting is already at the bottom; there is nowhere to drop to.
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

/** One finished reading sub-skill sitting. */
export function toSubSkillResult(state: SessionState): SubSkillResult {
  if (!state.subSkill) throw new Error('not a sub-skill sitting');
  return {
    subSkill: state.subSkill,
    finalTier: state.currentTier,
    questionsAnswered: state.questionsAnswered.length,
  };
}

/**
 * Folds the four sub-skill sittings into the one reading result the gate
 * consumes. The level is DERIVED by the rule in readingSkills.ts, never the
 * tier of any single sitting.
 */
export function toReadingResult(parts: SessionState[]): SubjectResult {
  const subSkills = parts.map(toSubSkillResult);
  const startedAt = Math.min(...parts.map((p) => p.startedAt));
  const finishedAt = Math.max(...parts.map((p) => p.finishedAt ?? Date.now()));
  return {
    subject: 'reading',
    finalTier: deriveReadingLevel(subSkills),
    subSkills,
    floored: false,
    questionsAnswered: subSkills.reduce((sum, r) => sum + r.questionsAnswered, 0),
    durationMs: Math.max(0, finishedAt - startedAt),
    completedAt: finishedAt,
    history: parts.flatMap((p) => p.questionsAnswered),
  };
}

/** The tier the session ended on is the placement for that subject. */
export function toSubjectResult(state: SessionState): SubjectResult {
  const finishedAt = state.finishedAt ?? Date.now();
  return {
    subject: state.subject,
    finalTier: state.currentTier,
    floored: state.floored,
    questionsAnswered: state.questionsAnswered.length,
    durationMs: Math.max(0, finishedAt - state.startedAt),
    completedAt: finishedAt,
    history: state.questionsAnswered,
  };
}

/**
 * Assembles the parent-facing result from whatever subjects are finished.
 *
 * The program comes from the priority gate, not from an average: averaging a
 * Grade 1 reading level with a Grade 5 math level produces a Grade 3 child who
 * does not exist. Subjects the gate did not rest on are flagged
 * non-determining, and floored sittings are flagged too, so no view can present
 * either as a measured level.
 */
export function buildResult(
  grade: Grade,
  age: number | null,
  completed: SubjectResult[],
): PlacementResult {
  const requiredSubjects = subjectsForGrade(grade);
  const inOrder = requiredSubjects
    .map((subject) => completed.find((r) => r.subject === subject))
    .filter((r): r is SubjectResult => Boolean(r));

  const by = (subject: Subject): SubjectResult | undefined =>
    inOrder.find((r) => r.subject === subject);
  const gapOf = (subject: Subject): number | null => {
    const r = by(subject);
    // A floored sitting cannot produce a gap: it did not start where it should.
    if (!r || r.floored) return null;
    return gapFor(r.finalTier, grade);
  };

  const reading = by('reading');
  const gateInputs: GateInputs = {
    grade,
    readingTier: reading ? reading.finalTier : null,
    readingGap: reading ? gapFor(reading.finalTier, grade) : null,
    spellingGap: gapOf('spelling'),
    writingGap: gapOf('writing'),
    mathGap: gapOf('math'),
  };
  const decision = evaluateGate(gateInputs);
  const readingGated = decision?.readingGated ?? false;

  const nextSubject = nextSubjectFor(requiredSubjects, completed);
  const complete = nextSubject === null && inOrder.length === requiredSubjects.length;

  const determined = new Set(decision?.determinedBy ?? []);
  const subjects: SubjectPlacement[] = inOrder.map((r) => ({
    subject: r.subject,
    finalTier: r.finalTier,
    gap: gapFor(r.finalTier, grade),
    gradeEquivalentDisplay: tierGradeLabel(r.finalTier),
    questionsAnswered: r.questionsAnswered,
    nonDetermining: r.floored || !determined.has(r.subject),
    floored: r.floored,
    subSkills: r.subSkills?.map((s) => ({
      subSkill: s.subSkill,
      finalTier: s.finalTier,
      gradeEquivalentDisplay: tierGradeLabel(s.finalTier),
    })),
  }));

  const program: ProgramPlacement | null =
    complete && decision
      ? {
          name: decision.programName,
          gradeEquivalentDisplay: tierGradeLabel(
            decision.outcome === 'reading-track'
              ? (reading?.finalTier ?? MIN_TIER)
              : gradeTier(grade),
          ),
          description: PROGRAM_DESCRIPTIONS[decision.outcome],
          gateStep: decision.step,
          outcome: decision.outcome,
        }
      : null;

  return {
    grade,
    age,
    ageGradeMismatch: age === null ? false : hasAgeGradeMismatch(age, grade),
    requiredSubjects,
    subjects,
    nextSubject,
    complete,
    program,
    readingGated,
    // Math content follows the grade, never the assessed math tier.
    mathContentLevel: gradeTier(grade),
    questionsAnswered: inOrder.reduce((sum, r) => sum + r.questionsAnswered, 0),
    durationMs: inOrder.reduce((sum, r) => sum + r.durationMs, 0),
  };
}
