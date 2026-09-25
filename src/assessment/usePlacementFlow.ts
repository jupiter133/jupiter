import { useCallback, useMemo, useState } from 'react';
import type {
  AgeBand,
  Grade,
  Track,
  ParentContext,
  PlacementResult,
  Question,
  SessionState,
  Subject,
} from './types';
import { ageBandForAge } from './types';
import { subjectsForTrack, trackFor } from './subjects';
import { READING_GATE_TIER } from './tiers';
import { deriveReadingLevel } from './readingLevel';
import { isReadingSubject } from './readingLevel';
import { audioDefaultFor } from '../audio/speechScript';
import { QUESTIONS_PER_SUBJECT } from './sessionMeta';
import {
  buildResult,
  createSession,
  selectNextQuestion,
  submitAnswer,
  toSubjectResult,
} from './engine';
import {
  clearProgress,
  loadProgress,
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
  | 'section-complete'
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
  /** The subject after this one, or null when the placement is finished. */
  nextSubject: Subject | null;
  /** Every subject this grade is assessed on, in sitting order. */
  requiredSubjects: Subject[];
  /** Which assessment this child is sitting. */
  track: Track;
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
  /** The question just answered. Keeps the quest on screen behind the popup. */
  lastQuestion: Question | null;
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
  answer: (
    selectedAnswerId: string,
    options?: { scored?: boolean; correct?: boolean; spokenMs?: number },
  ) => void;
  /** Hands the tablet back for the next subject sitting. */
  continueNext: () => void;
  /** "Do this one later" — skips this subject without recording a result. */
  doThisLater: () => void;
  /** Dismisses the section-complete popup. */
  dismissSectionComplete: () => void;
  /** 0–8, for the nine progress pills. */
  stepIndex: number;
  /** Null on the first step, and wherever rewinding would lose answers. */
  goBack: (() => void) | null;
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
  /** Subjects the child chose to leave for later, in this run. */
  const [skipped, setSkipped] = useState<Subject[]>([]);
  /** The question just answered, so the popup has the quest behind it. */
  const [lastQuestion, setLastQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<PlacementProgress | null>(() =>
    loadProgress(childName),
  );
  // null until a grade is known; the band then sets the starting preference.
  const [audioOverride, setAudioOverride] = useState<boolean | null>(null);

  const grade: Grade | null = context?.grade ?? progress?.grade ?? null;
  const age: number | null = context?.age ?? progress?.age ?? null;

  /**
   * Reading below a Grade 3 level floors every later sitting: it starts at the
   * lowest tier and branches only upward. Read straight
   * off the stored reading result, so it survives a reload mid-placement.
   */
  const track = useMemo(() => trackFor(age, grade), [age, grade]);

  const readingGated = useMemo(() => {
    const parts = (progress?.completed ?? []).filter(
      (r) => isReadingSubject(r.subject) && !r.floored,
    );
    const level = deriveReadingLevel(track, parts);
    return level !== null && level < READING_GATE_TIER;
  }, [progress, track]);
  const requiredSubjects = useMemo(() => (grade ? subjectsForTrack(track) : []), [grade, track]);
  const completed = progress?.completed ?? [];
  const nextSubject = useMemo(() => {
    if (!grade) return null;
    const done = new Set<Subject>([...completed.map((r) => r.subject), ...skipped]);
    return requiredSubjects.find((s) => !done.has(s)) ?? null;
  }, [grade, requiredSubjects, completed, skipped]);

  const currentQuestion = useMemo(
    () => (session && !session.finishedAt ? selectNextQuestion(session) : null),
    [session],
  );

  const isResuming = Boolean(progress && nextSubject && completed.length > 0);

  /**
   * Starts the next sitting directly: builds the session and goes to the
   * section intro. Ms Hannah's handoff introduction is shown once, before the
   * first sitting; every later sitting skips it.
   */
  const startNextSitting = useCallback(() => {
    if (!grade) return;
    if (!nextSubject) {
      setStep('parent-results');
      return;
    }
    setLastQuestion(null);
    setSession(
      createSession(grade, nextSubject, {
        floored: readingGated && !isReadingSubject(nextSubject),
      }),
    );
    setStep('section-intro');
  }, [grade, nextSubject, readingGated]);

  const beginIntake = useCallback(() => {
    // A stored grade means the intake questions are already answered, and the
    // introduction has already been seen.
    if (progress?.grade && nextSubject) startNextSitting();
    else setStep('parent-context');
  }, [progress, nextSubject, startNextSitting]);

  const defer = useCallback(() => setStep('deferred'), []);
  const resume = useCallback(() => setStep('start'), []);

  const submitContext = useCallback((next: ParentContext) => {
    setContext(next);
    setAudioOverride(null);
    setStep('handoff');
  }, []);

  const beginQuest = startNextSitting;

  /**
   * Opens the sitting the intro just introduced.
   *
   * It insists on a session rather than assuming one: "do this one later"
   * moves the intro to a different subject, and starting a sitting that was
   * never built renders a screen with no question on it.
   */
  const startSection = useCallback(() => {
    if (!session || session.finishedAt) {
      startNextSitting();
      return;
    }
    setStep('question');
  }, [session, startNextSitting]);

  const answer = useCallback(
    (
      selectedAnswerId: string,
      options: { scored?: boolean; correct?: boolean; spokenMs?: number } = {},
    ) => {
      if (!session || session.finishedAt) return;
      const question = selectNextQuestion(session);
      if (!question) return;
      setLastQuestion(question);

      const next = submitAnswer(session, question, selectedAnswerId, Date.now(), options);
      setSession(next);
      if (!next.finishedAt) return;

      // Recording happens here, not inside the state updater, so a double
      // render can never write the result twice.
      setProgress(recordSubjectResult(childName, next.grade, age, toSubjectResult(next)));
      // A popup over the quest, not a screen of its own: the section ending is
      // a moment, not a destination.
      setStep('section-complete');
    },
    [session, childName, age],
  );

  /** Dismisses the section-complete popup and hands back to the grown-up. */
  const dismissSectionComplete = useCallback(() => setStep('parent-results'), []);

  const continueNext = useCallback(() => {
    setSession(null);
    startNextSitting();
  }, [startNextSitting]);

  /**
   * "Do this one later" — moves past this subject without recording a result.
   * The skip is remembered for this run so the flow does not loop back to it,
   * and the subject reads as "not yet assessed" until it is actually sat.
   */
  const doThisLater = useCallback(() => {
    const subject = session?.subject ?? nextSubject;
    if (!subject) return;
    const stillToSit = requiredSubjects.filter(
      (s) => s !== subject && !skipped.includes(s) && !completed.some((r) => r.subject === s),
    );
    setSkipped((prev) => (prev.includes(subject) ? prev : [...prev, subject]));
    setSession(null);
    setLastQuestion(null);
    // Every subject skipped: there is no next intro to show, so hand back.
    if (stillToSit.length === 0 || !grade) {
      setStep('parent-results');
      return;
    }
    // Build the next sitting here. Leaving the intro on screen with no session
    // behind it is what made "start" open an empty question screen.
    setSession(
      createSession(grade, stillToSit[0], {
        floored: readingGated && !isReadingSubject(stillToSit[0]),
      }),
    );
    setStep('section-intro');
  }, [session, nextSubject, requiredSubjects, skipped, completed, grade, readingGated]);

  const toggleAudio = useCallback(() => {
    setAudioOverride((prev) => !(prev ?? audioDefaultFor(age !== null ? ageBandForAge(age) : 'junior')));
  }, [age]);

  const restart = useCallback(() => {
    clearProgress(childName);
    setProgress(null);
    setSession(null);
    setSkipped([]);
    setLastQuestion(null);
    setContext(null);
    setAudioOverride(null);
    setStep('start');
  }, [childName]);

  const result = useMemo(
    () => (grade ? buildResult(grade, age, completed) : null),
    [grade, age, completed],
  );

  const sittingSubjectForIndex = session?.subject ?? nextSubject;

  /**
   * Where we are in the design's nine steps: hook, grown-up setup, meet
   * Ms Hannah, the track’s seven subjects, results.
   */
  const stepIndex = useMemo(() => {
    if (step === 'start' || step === 'deferred') return 0;
    if (step === 'parent-context') return 1;
    if (step === 'handoff') return 2;
    if (step === 'section-complete') {
      return sittingSubjectForIndex ? 3 + requiredSubjects.indexOf(sittingSubjectForIndex) : 3;
    }
    if (step === 'parent-results') {
      if (!nextSubject) return 8;
      return 3 + requiredSubjects.indexOf(nextSubject);
    }
    return sittingSubjectForIndex ? 3 + requiredSubjects.indexOf(sittingSubjectForIndex) : 3;
  }, [step, nextSubject, requiredSubjects, sittingSubjectForIndex]);

  /**
   * Back is offered where it costs nothing. Mid-question and post-completion
   * it is withheld: rewinding a sitting would throw away answers the child has
   * already given, which is worse than no back button.
   */
  const goBack = useMemo(() => {
    if (step === 'parent-context') return () => setStep('start');
    if (step === 'handoff') return () => setStep('parent-context');
    if (step === 'section-intro') {
      return () => {
        setSession(null);
        setStep(completed.length === 0 ? 'handoff' : 'parent-results');
      };
    }
    return null;
  }, [step, completed.length]);

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
    nextSubject,
    track,
    requiredSubjects,
    sessionNumber: sittingSubject ? requiredSubjects.indexOf(sittingSubject) + 1 : 1,
    sessionCount: requiredSubjects.length,
    isResuming,
    readingGated,
    band,
    audioEnabled: forcedAudio || (audioOverride ?? audioDefaultFor(band)),
    toggleAudio,
    currentQuestion,
    lastQuestion,
    questionNumber: (session?.questionsAnswered.length ?? 0) + 1,
    questionsPerSubject: sittingSubject ? QUESTIONS_PER_SUBJECT[sittingSubject] : 8,
    result,
    beginIntake,
    defer,
    resume,
    submitContext,
    beginQuest,
    startSection,
    answer,
    continueNext,
    doThisLater,
    dismissSectionComplete,
    stepIndex,
    goBack,
    restart,
  };
}
