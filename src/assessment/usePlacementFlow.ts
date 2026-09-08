import { useCallback, useMemo, useState } from 'react';
import type { ParentContext, PlacementResult, Question, SessionState } from './types';
import {
  MAX_QUESTIONS,
  buildResult,
  coinsEarned,
  createSession,
  selectNextQuestion,
  submitAnswer,
} from './engine';

export type FlowStep = 'parent-context' | 'handoff' | 'question' | 'kid-complete' | 'parent-results';

interface Flow {
  step: FlowStep;
  context: ParentContext | null;
  session: SessionState | null;
  currentQuestion: Question | null;
  questionNumber: number;
  totalEstimate: number;
  coins: number;
  result: PlacementResult | null;
  submitContext: (context: ParentContext) => void;
  beginQuest: () => void;
  answer: (selectedAnswerId: string) => void;
  handBackToParent: () => void;
  restart: () => void;
}

/** Owns the whole placement flow: which screen is showing, the session state,
 *  and the derived result. Screens stay presentational. */
export function usePlacementFlow(): Flow {
  const [step, setStep] = useState<FlowStep>('parent-context');
  const [context, setContext] = useState<ParentContext | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);

  const currentQuestion = useMemo(
    () => (session && !session.finishedAt ? selectNextQuestion(session) : null),
    [session],
  );

  const submitContext = useCallback((next: ParentContext) => {
    setContext(next);
    setStep('handoff');
  }, []);

  const beginQuest = useCallback(() => {
    if (!context) return;
    setSession(createSession(context.grade));
    setStep('question');
  }, [context]);

  const answer = useCallback(
    (selectedAnswerId: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        const question = selectNextQuestion(prev);
        if (!question) return prev;
        const next = submitAnswer(prev, question, selectedAnswerId);
        if (next.finishedAt) setStep('kid-complete');
        return next;
      });
    },
    [],
  );

  const handBackToParent = useCallback(() => setStep('parent-results'), []);

  const restart = useCallback(() => {
    setSession(null);
    setContext(null);
    setStep('parent-context');
  }, []);

  const result = useMemo(
    () => (session && session.finishedAt ? buildResult(session) : null),
    [session],
  );

  return {
    step,
    context,
    session,
    currentQuestion,
    questionNumber: (session?.questionsAnswered.length ?? 0) + 1,
    totalEstimate: MAX_QUESTIONS,
    coins: session ? coinsEarned(session) : 0,
    result,
    submitContext,
    beginQuest,
    answer,
    handBackToParent,
    restart,
  };
}
