import { describe, expect, it } from 'vitest';
import {
  MAX_QUESTIONS,
  buildResult,
  createSession,
  isTierStable,
  selectNextQuestion,
  startTierForGrade,
  submitAnswer,
} from './engine';
import type { SessionState } from './types';

function answer(state: SessionState, correct: boolean, at?: number): SessionState {
  const q = selectNextQuestion(state)!;
  const wrong = q.options.find((o) => o.id !== q.correctAnswerId)!.id;
  return submitAnswer(state, q, correct ? q.correctAnswerId : wrong, at);
}

describe('start tier', () => {
  it('maps grade to a starting tier', () => {
    expect(startTierForGrade('K')).toBe(1);
    expect(startTierForGrade('3')).toBe(2);
    expect(startTierForGrade('6')).toBe(3);
  });
});

describe('branching', () => {
  it('moves up one tier after two correct in a row', () => {
    let s = createSession('K');
    expect(s.currentTier).toBe(1);
    s = answer(s, true);
    expect(s.currentTier).toBe(1);
    s = answer(s, true);
    expect(s.currentTier).toBe(2);
  });

  it('moves down one tier after two incorrect in a row', () => {
    let s = createSession('3');
    expect(s.currentTier).toBe(2);
    s = answer(s, false);
    s = answer(s, false);
    expect(s.currentTier).toBe(1);
  });

  it('resets streaks when the run is broken', () => {
    let s = createSession('3');
    s = answer(s, true);
    s = answer(s, false);
    expect(s.currentTier).toBe(2);
    expect(s.consecutiveCorrect).toBe(0);
    expect(s.consecutiveIncorrect).toBe(1);
  });

  it('resets both streaks after a tier move', () => {
    let s = createSession('K');
    s = answer(s, true);
    s = answer(s, true);
    expect(s.consecutiveCorrect).toBe(0);
    expect(s.consecutiveIncorrect).toBe(0);
  });

  it('clamps at the top and bottom tiers', () => {
    let s = createSession('6');
    for (let i = 0; i < 4; i += 1) s = answer(s, true);
    expect(s.currentTier).toBe(3);

    let low = createSession('K');
    for (let i = 0; i < 4; i += 1) low = answer(low, false);
    expect(low.currentTier).toBe(1);
  });
});

describe('termination', () => {
  it('ends when the tier has been stable across the trailing window', () => {
    // Alternating answers never build a streak, so the tier never moves.
    let s = createSession('3');
    while (!s.finishedAt) s = answer(s, s.questionsAnswered.length % 2 === 0);
    expect(s.questionsAnswered.length).toBeLessThanOrEqual(MAX_QUESTIONS);
    expect(isTierStable(s)).toBe(true);
  });

  it('never exceeds the max question count', () => {
    let s = createSession('K');
    let guard = 0;
    while (!s.finishedAt && guard < 100) {
      s = answer(s, guard % 3 === 0);
      guard += 1;
    }
    expect(s.finishedAt).toBeDefined();
    expect(s.questionsAnswered.length).toBeLessThanOrEqual(MAX_QUESTIONS);
  });

  it('never serves the same question twice', () => {
    let s = createSession('2');
    while (!s.finishedAt) s = answer(s, true);
    const ids = s.questionsAnswered.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('result', () => {
  it('reports grade-equivalent language without leaking the tier number', () => {
    let s = createSession('K', 0);
    let t = 0;
    while (!s.finishedAt) {
      t += 5000;
      s = answer(s, true, t);
    }
    const result = buildResult(s);
    expect(result.gradeEquivalentDisplay).not.toMatch(/tier/i);
    expect(result.gradeEquivalentDisplay).not.toMatch(/\btier\s*\d/i);
    expect(result.recommendedStartingModule.length).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.history.length).toBe(s.questionsAnswered.length);
  });
});
