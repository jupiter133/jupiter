import { useCallback, useMemo, useState } from 'react';
import type {
  AgeBand,
  ParentContext,
  PlacementResult,
  Question,
  SessionState,
  Subject,
} from './types';
import { SUBJECT_ORDER, ageBandForGrade } from './types';
import { audioDefaultFor } from '../audio/speechScript';
import {
  QUESTIONS_PER_SUBJECT,
  buildResult,
  coinsEarned,
  createSession,
  currentSubject,
  selectNextQuestion,
  submitAnswer,
} from './engine';

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
  /** Captured on the start screen, before the rest of the intake. */
  childName: string;
  context: ParentContext | null;
  session: SessionState | null;
  subject: Subject | null;
  /** Presentation mode for this child, fixed for the session by stated grade. */
  band: AgeBand;
  /** Whether each question is read aloud automatically. */
  audioEnabled: boolean;
  toggleAudio: () => void;
  currentQuestion: Question | null;
  /** Position within the active strand, 1-based. */
  questionNumber: number;
  questionsPerSubject: number;
  /** Position across the whole session, 1-based. */
  overallNumber: number;
  coins: number;
  result: PlacementResult | null;
  beginIntake: (childName: string) => void;
  defer: () => void;
  resume: () => void;
  submitContext: (context: ParentContext) => void;
  beginQuest: () => void;
  startSection: () => void;
  answer: (selectedAnswerId: string) => void;
  handBackToParent: () => void;
  restart: () => void;
}

/** Owns the whole placement flow: which screen is showing, the session state,
 *  and the derived result. Screens stay presentational. */
export function usePlacementFlow(): Flow {
  const [step, setStep] = useState<FlowStep>('start');
  const [childName, setChildName] = useState('');
  const [context, setContext] = useState<ParentContext | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  // null until a grade is known; the band then sets the starting preference.
  const [audioOverride, setAudioOverride] = useState<boolean | null>(null);

  const subject = useMemo(
    () => (session && !session.finishedAt ? currentSubject(session) : null),
    [session],
  );

  const currentQuestion = useMemo(
    () => (session && !session.finishedAt ? selectNextQuestion(session) : null),
    [session],
  );

  const beginIntake = useCallback((name: string) => {
    setChildName(name);
    setStep('parent-context');
  }, []);

  const defer = useCallback(() => setStep('deferred'), []);
  const resume = useCallback(() => setStep('start'), []);

  const submitContext = useCallback((next: ParentContext) => {
    setContext(next);
    setAudioOverride(null);
    setStep('handoff');
  }, []);

  const beginQuest = useCallback(() => {
    if (!context) return;
    setSession(createSession(context.grade));
    setStep('section-intro');
  }, [context]);

  const startSection = useCallback(() => setStep('question'), []);

  const answer = useCallback((selectedAnswerId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const question = selectNextQuestion(prev);
      if (!question) return prev;

      const next = submitAnswer(prev, question, selectedAnswerId);
      if (next.finishedAt) {
        setStep('kid-complete');
      } else if (next.subjectIndex !== prev.subjectIndex) {
        // Strand finished — introduce the next one before resuming questions.
        setStep('section-intro');
      }
      return next;
    });
  }, []);

  const handBackToParent = useCallback(() => setStep('parent-results'), []);

  const toggleAudio = useCallback(() => {
    setAudioOverride((prev) => !(prev ?? audioDefaultFor(ageBandForGrade(context!.grade))));
  }, [context]);

  const restart = useCallback(() => {
    setSession(null);
    setContext(null);
    setChildName('');
    setAudioOverride(null);
    setStep('start');
  }, []);

  const result = useMemo(
    () => (session && session.finishedAt ? buildResult(session) : null),
    [session],
  );

  const band: AgeBand = context ? ageBandForGrade(context.grade) : 'junior';

  return {
    step,
    childName,
    context,
    session,
    subject,
    band,
    audioEnabled: audioOverride ?? audioDefaultFor(band),
    toggleAudio,
    currentQuestion,
    questionNumber: subject ? session!.subjects[subject].answeredCount + 1 : 1,
    questionsPerSubject: QUESTIONS_PER_SUBJECT,
    overallNumber: (session?.questionsAnswered.length ?? 0) + 1,
    coins: session ? coinsEarned(session) : 0,
    result,
    beginIntake,
    defer,
    resume,
    submitContext,
    beginQuest,
    startSection,
    answer,
    handBackToParent,
    restart,
  };
}

export { SUBJECT_ORDER };
