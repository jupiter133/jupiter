import type {
  AnsweredQuestion,
  Grade,
  PlacementResult,
  ProgramPlacement,
  Question,
  SessionState,
  Tier,
  Subject,
  SubjectPlacement,
  SubjectResult,
} from './types';
import { startTierForGrade, tierGradeLabel, isDraggedQuestion } from './types';
import { MIN_TIER, clampTier, gapFor, gradeTier } from './tiers';
import { evaluateGate, type GateDecision, type GateInputs } from './gate';
import { hasAgeGradeMismatch } from './intake';
import { deriveReadingLevel, measuredParts, readingSubjectsFor } from './readingLevel';
import { trackFor, subjectsForTrack } from './subjects';
import { QUESTIONS_PER_SUBJECT } from './sessionMeta';
import { coreReadingProgramFor, PROGRAM_DESCRIPTIONS as DESCRIPTIONS } from './programs';
import { QUESTIONS } from './questionBank';
import { nextSubjectFor } from './placementStore';

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
  options: { floored?: boolean } = {},
  now: number = Date.now(),
): SessionState {
  const floored = options.floored ?? false;
  return {
    grade,
    subject,
    maxQuestions: QUESTIONS_PER_SUBJECT[subject],
    stabilityWindow: STABILITY_WINDOW,
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
/**
 * Where in a sitting the one drag item belongs, 1-based.
 *
 * Dragging is slower and more deliberate than tapping, which makes it worth
 * doing once and tiring to do eight times. Second is early enough that every
 * child meets it and late enough that they have already learned how the
 * sitting works. Spelling and Sentence Writing each have one such item per
 * tier; every other subject has none, and this is then a no-op.
 */
export const DRAG_QUESTION_POSITION = 2;

export function selectNextQuestion(state: SessionState): Question | null {
  const served = new Set(state.servedQuestionIds);
  const position = state.questionsAnswered.length + 1;
  const wantsDrag = position === DRAG_QUESTION_POSITION;
  const byNearestTier = (a: Question, b: Question) =>
    Math.abs(a.tier - state.currentTier) - Math.abs(b.tier - state.currentTier);

  const mine = QUESTIONS.filter((q) => q.subject === state.subject && !served.has(q.id));
  const drag = mine.filter(isDraggedQuestion).sort(byNearestTier);
  const tap = mine.filter((q) => !isDraggedQuestion(q)).sort(byNearestTier);
  // A drag item outside its position would make the sitting feel arbitrary, so
  // it is only ever reached when nothing else is left.
  if (wantsDrag && drag.length > 0) return drag[0];
  return tap[0] ?? drag[0] ?? null;
}

/** True once the tier has not changed across the trailing window. */
export function isTierStable(state: SessionState): boolean {
  const size = state.stabilityWindow ?? STABILITY_WINDOW;
  if (state.tierHistory.length < size) return false;
  const window = state.tierHistory.slice(-size);
  return window.every((t) => t === window[0]);
}

export function isSessionComplete(state: SessionState): boolean {
  if (state.questionsAnswered.length >= (state.maxQuestions ?? QUESTIONS_PER_SUBJECT[state.subject]))
    return true;
  if (selectNextQuestion(state) === null) return true;
  // A sitting nothing has scored has no tier signal, so a "stable" tier means
  // only that nothing moved it. Stopping there would cut the sitting short and
  // gather fewer observations, which is the one thing it is for.
  if (state.questionsAnswered.length > 0 && state.questionsAnswered.every((a) => !a.scored))
    return false;
  return isTierStable(state);
}

/**
 * Applies one answer and returns the next session state.
 *
 * Two correct in a row moves up a tier, two incorrect moves down. Either move
 * resets both streaks, so a fresh pair is needed at the new tier before moving
 * again. The tier the session ends on is the placement for this subject.
 *
 * An UNSCORED answer — a spoken attempt nothing judged — is recorded and
 * nothing else: no streak, no tier move. Guessing a verdict to keep the
 * branching fed would put a number on a child that nobody measured.
 */
export function submitAnswer(
  state: SessionState,
  question: Question,
  selectedAnswerId: string,
  now: number = Date.now(),
  options: {
    scored?: boolean;
    correct?: boolean;
    spokenMs?: number;
    writtenAnswer?: string;
  } = {},
): SessionState {
  const scored = options.scored ?? true;
  const wasCorrect = scored
    ? options.correct ?? selectedAnswerId === question.correctAnswerId
    : false;
  const lastAnsweredAt =
    state.questionsAnswered[state.questionsAnswered.length - 1]?.answeredAt ?? state.startedAt;

  const record: AnsweredQuestion = {
    questionId: question.id,
    subject: question.subject,
    tier: question.tier,
    selectedAnswerId,
    wasCorrect,
    scored,
    spokenMs: options.spokenMs,
    writtenAnswer: options.writtenAnswer,
    answeredAt: now,
    elapsedMs: Math.max(0, now - lastAnsweredAt),
  };

  let consecutiveCorrect = scored && wasCorrect ? state.consecutiveCorrect + 1 : scored ? 0 : state.consecutiveCorrect;
  let consecutiveIncorrect = scored && !wasCorrect ? state.consecutiveIncorrect + 1 : scored ? 0 : state.consecutiveIncorrect;
  let currentTier = state.currentTier;

  if (scored && consecutiveCorrect >= STREAK_TO_MOVE) {
    currentTier = clampTier(currentTier + 1);
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
  } else if (scored && consecutiveIncorrect >= STREAK_TO_MOVE && !state.floored) {
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

/** The tier the session ended on is the placement for that subject. */
export function toSubjectResult(state: SessionState): SubjectResult {
  const finishedAt = state.finishedAt ?? Date.now();
  return {
    subject: state.subject,
    finalTier: state.currentTier,
    floored: state.floored,
    // Nothing in the sitting was judged, so the tier it ended on is just the
    // tier it opened on. Downstream must not read it as a measure.
    unscored:
      state.questionsAnswered.length > 0 && state.questionsAnswered.every((a) => !a.scored),
    questionsAnswered: state.questionsAnswered.length,
    durationMs: Math.max(0, finishedAt - state.startedAt),
    completedAt: finishedAt,
    history: state.questionsAnswered,
  };
}

/** The lower of two gaps, or null when either is missing. */
function worseOf(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.min(a, b);
}

/**
 * Little Readers has no writing or comprehension to route on, so
 * the five-step gate does not apply: everyone who sits it is placed on the
 * reading track, at the level their two reading activities give.
 *
 * PENDING TEACHER SIGN-OFF — the readiness activities (matching, shapes,
 * numbers) are recorded but do not move the placement.
 */
function littleReaderDecision(readingTier: Tier | null): GateDecision | null {
  if (readingTier === null) return null;
  return {
    step: 1,
    outcome: 'reading-track',
    programName: coreReadingProgramFor(readingTier),
    determinedBy: readingSubjectsFor('little-reader'),
    readingGated: true,
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
  const track = trackFor(age, grade);
  const requiredSubjects = subjectsForTrack(track);
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

  // Reading is measured by more than one subject; the level is derived.
  const readingParts = readingSubjectsFor(track)
    .map((subject) => by(subject))
    .filter((r): r is SubjectResult => Boolean(r));
  const readingTier = deriveReadingLevel(track, readingParts);
  // Which sittings the level was actually read off — short of the full set
  // when a spoken sitting came back unscored.
  const readingRestsOn = measuredParts(readingParts).map((r) => r.subject);
  const gateInputs: GateInputs = {
    grade,
    readingTier,
    readingGap: readingTier === null ? null : gapFor(readingTier, grade),
    // Either one behind trips step 3, and step 4 needs both within one grade,
    // so the weaker of the two is the number both rules want.
    vocabularySpellingGap: worseOf(gapOf('vocabulary'), gapOf('spelling')),
    sentenceWritingGap: gapOf('sentence-writing'),
    mathGap: gapOf('math'),
  };
  const decision =
    track === 'little-reader' ? littleReaderDecision(readingTier) : evaluateGate(gateInputs);
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
    // An unscored sitting is on file, never a level.
    nonDetermining: r.floored || r.unscored || !determined.has(r.subject),
    floored: r.floored,
    unscored: r.unscored,
  }));

  const program: ProgramPlacement | null =
    complete && decision
      ? {
          name: decision.programName,
          gradeEquivalentDisplay: tierGradeLabel(
            decision.outcome === 'reading-track'
              ? (readingTier ?? MIN_TIER)
              : gradeTier(grade),
          ),
          description: DESCRIPTIONS[decision.outcome],
          gateStep: decision.step,
          outcome: decision.outcome,
        }
      : null;

  return {
    grade,
    track,
    age,
    ageGradeMismatch: age === null ? false : hasAgeGradeMismatch(age, grade),
    requiredSubjects,
    readingRestsOn,
    subjects,
    nextSubject,
    complete,
    program,
    readingGated,
    readingTier,
    // Math content follows the grade, never the assessed math tier.
    mathContentLevel: gradeTier(grade),
    questionsAnswered: inOrder.reduce((sum, r) => sum + r.questionsAnswered, 0),
    durationMs: inOrder.reduce((sum, r) => sum + r.durationMs, 0),
  };
}
