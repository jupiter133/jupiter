import { useCallback, useMemo, useState } from 'react';
import type {
  AgeBand,
  Grade,
  ParentContext,
  PlacementResult,
  Question,
  SessionState,
  Subject,
} from './types';
import { ageBandForAge, subjectsForGrade } from './types';
import { READING_GATE_TIER } from './tiers';
import { audioDefaultFor } from '../audio/speechScript';
import {
  QUESTIONS_PER_SUBJECT,
  buildResult,
  createSession,
  selectNextQuestion,
  submitAnswer,
  toSubjectResult,
} from './engine';
import {
  clearProgress,
  loadProgress,
  nextSubjectFor,
  recordSubjectResult,
  type PlacementProgress,
} from './placementStore';

export type FlowStep =
  | 'start'
  | 'deferred'
  | 'parent-context'
  | 'handoff'
  | 'section-intro'
  | 'question'
  | 'kid-complete'
  | 'parent-results';

interface Flow {
  step: FlowStep;
  /** From the child's profile — the flow never asks for it. */
  childName: string;
  context: ParentContext | null;
  grade: Grade | null;
  session: SessionState | null;
  /** The subject this sitting assesses. */
  subject: Subject | null;
  /** Every subject this grade is assessed on, in sitting order. */
  requiredSubjects: Subject[];
  /** Which sitting this is, 1-based, and how many there are. */
  sessionNumber: number;
  sessionCount: number;
  /** True when a stored placement is being picked up mid-way. */
  isResuming: boolean;
  /** Reading came in below a Grade 3 level, so later sittings are floored. */
  readingGated: boolean;
  band: AgeBand;
  audioEnabled: boolean;
  toggleAudio: () => void;
  currentQuestion: Question | null;
  /** Position within this sitting, 1-based. */
  questionNumber: number;
  questionsPerSubject: number;
  result: PlacementResult | null;
  beginIntake: () => void;
  defer: () => void;
  resume: () => void;
  submitContext: (context: ParentContext) => void;
  beginQuest: () => void;
  startSection: () => void;
  answer: (selectedAnswerId: string) => void;
  handBackToParent: () => void;
  /** Hands the tablet back for the next subject sitting. */
  continueNext: () => void;
  restart: () => void;
}

/**
 * Owns the placement flow: which screen is showing, the one-subject sitting in
 * progress, and the stored progress across sittings. Screens stay presentational.
 *
 * Every child sits reading, then spelling, then writing, then math, as separate
 * sessions. Nobody is stopped early. Progress is stored between sittings, so
 * returning picks up at the next subject without re-asking anything.
 */
export function usePlacementFlow(childName: string): Flow {
  const [step, setStep] = useState<FlowStep>('start');
  const [context, setContext] = useState<ParentContext | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [progress, setProgress] = useState<PlacementProgress | null>(() =>
    loadProgress(childName),
  );
  // null until a grade is known; the band then sets the starting preference.
  const [audioOverride, setAudioOverride] = useState<boolean | null>(null);

  const grade: Grade | null = context?.grade ?? progress?.grade ?? null;
  const age: number | null = context?.age ?? progress?.age ?? null;

  /**
   * Reading below a Grade 3 level floors every later sitting: it starts at the
   * lowest tier, branches only upward, and forces read-aloud on. Read straight
   * off the stored reading result, so it survives a reload mid-placement.
   */
  const readingGated = useMemo(() => {
    const reading = (progress?.completed ?? []).find((r) => r.subject === 'reading');
    return Boolean(reading && !reading.floored && reading.finalTier < READING_GATE_TIER);
  }, [progress]);
  const requiredSubjects = useMemo(() => (grade ? subjectsForGrade(grade) : []), [grade]);
  const completed = progress?.completed ?? [];
  const nextSubject = useMemo(
    () => (grade ? nextSubjectFor(requiredSubjects, completed) : null),
    [grade, requiredSubjects, completed],
  );

  const currentQuestion = useMemo(
    () => (session && !session.finishedAt ? selectNextQuestion(session) : null),
    [session],
  );

  const isResuming = Boolean(progress && nextSubject && completed.length > 0);

  const beginIntake = useCallback(() => {
    // A stored grade means the intake questions are already answered.
    setStep(progress?.grade && nextSubject ? 'handoff' : 'parent-context');
  }, [progress, nextSubject]);

  const defer = useCallback(() => setStep('deferred'), []);
  const resume = useCallback(() => setStep('start'), []);

  const submitContext = useCallback((next: ParentContext) => {
    setContext(next);
    setAudioOverride(null);
    setStep('handoff');
  }, []);

  const beginQuest = useCallback(() => {
    if (!grade) return;
    if (!nextSubject) {
      setStep('parent-results');
      return;
    }
    setSession(createSession(grade, nextSubject, { floored: readingGated && nextSubject !== 'reading' }));
    setStep('section-intro');
  }, [grade, nextSubject, readingGated]);

  const startSection = useCallback(() => setStep('question'), []);

  const answer = useCallback(
    (selectedAnswerId: string) => {
      if (!session || session.finishedAt) return;
      const question = selectNextQuestion(session);
      if (!question) return;

      const next = submitAnswer(session, question, selectedAnswerId);
      setSession(next);

      if (next.finishedAt) {
        // Recording happens here, not inside the state updater, so a double
        // render can never write the result twice.
        setProgress(recordSubjectResult(childName, next.grade, age, toSubjectResult(next)));
        setStep('kid-complete');
      }
    },
    [session, childName, age],
  );

  const handBackToParent = useCallback(() => setStep('parent-results'), []);

  const continueNext = useCallback(() => {
    setSession(null);
    setStep('handoff');
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioOverride((prev) => !(prev ?? audioDefaultFor(age !== null ? ageBandForAge(age) : 'junior')));
  }, [age]);

  const restart = useCallback(() => {
    clearProgress(childName);
    setProgress(null);
    setSession(null);
    setContext(null);
    setAudioOverride(null);
    setStep('start');
  }, [childName]);

  const result = useMemo(
    () => (grade ? buildResult(grade, age, completed) : null),
    [grade, age, completed],
  );

  // Presentation follows AGE, never grade and never the tier the child reaches.
  const band: AgeBand = age !== null ? ageBandForAge(age) : 'junior';
  // Auto-read is off until the user turns it on, floored sittings included —
  // the per-answer speakers and "Read to me" are always there for a child who
  // cannot read the screen.
  const forcedAudio = false;
  const sittingSubject = session?.subject ?? nextSubject;

  return {
    step,
    childName,
    context,
    grade,
    session,
    subject: sittingSubject,
    requiredSubjects,
    sessionNumber: sittingSubject ? requiredSubjects.indexOf(sittingSubject) + 1 : 1,
    sessionCount: requiredSubjects.length,
    isResuming,
    readingGated,
    band,
    audioEnabled: forcedAudio || (audioOverride ?? audioDefaultFor(band)),
    toggleAudio,
    currentQuestion,
    questionNumber: (session?.questionsAnswered.length ?? 0) + 1,
    questionsPerSubject: QUESTIONS_PER_SUBJECT,
    result,
    beginIntake,
    defer,
    resume,
    submitContext,
    beginQuest,
    startSection,
    answer,
    handBackToParent,
    continueNext,
    restart,
  };
}
