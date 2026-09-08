import { describe, expect, it } from 'vitest';
import {
  QUESTIONS_PER_SUBJECT,
  TOTAL_QUESTIONS,
  buildResult,
  createSession,
  currentSubject,
  selectNextQuestion,
  startTierForGrade,
  submitAnswer,
} from './engine';
import { QUESTIONS } from './questionBank';
import type { SessionState, Subject } from './types';
import { SUBJECT_ORDER } from './types';

function answer(state: SessionState, correct: boolean, at?: number): SessionState {
  const q = selectNextQuestion(state)!;
  const wrong = q.options.find((o) => o.id !== q.correctAnswerId)!.id;
  return submitAnswer(state, q, correct ? q.correctAnswerId : wrong, at);
}

function tierOf(state: SessionState, subject: Subject) {
  return state.subjects[subject].currentTier;
}

describe('question bank', () => {
  it('has items in every subject and tier', () => {
    for (const subject of SUBJECT_ORDER) {
      for (const tier of [1, 2, 3]) {
        const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
        expect(n, `${subject} tier ${tier}`).toBeGreaterThan(0);
      }
    }
  });

  it('has enough items per subject to fill a strand without repeating', () => {
    for (const subject of SUBJECT_ORDER) {
      const n = QUESTIONS.filter((q) => q.subject === subject).length;
      expect(n, subject).toBeGreaterThanOrEqual(QUESTIONS_PER_SUBJECT);
    }
  });

  it('uses unique ids and valid correct answers', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });
});

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
    expect(tierOf(s, 'reading')).toBe(1);
    s = answer(s, true);
    expect(tierOf(s, 'reading')).toBe(1);
    s = answer(s, true);
    expect(tierOf(s, 'reading')).toBe(2);
  });

  it('moves down one tier after two incorrect in a row', () => {
    let s = createSession('3');
    expect(tierOf(s, 'reading')).toBe(2);
    s = answer(s, false);
    s = answer(s, false);
    expect(tierOf(s, 'reading')).toBe(1);
  });

  it('resets streaks when the run is broken', () => {
    let s = createSession('3');
    s = answer(s, true);
    s = answer(s, false);
    expect(tierOf(s, 'reading')).toBe(2);
    expect(s.subjects.reading.consecutiveCorrect).toBe(0);
    expect(s.subjects.reading.consecutiveIncorrect).toBe(1);
  });

  it('clamps at the top and bottom tiers', () => {
    let s = createSession('6');
    for (let i = 0; i < 4; i += 1) s = answer(s, true);
    expect(tierOf(s, 'reading')).toBe(3);

    let low = createSession('K');
    for (let i = 0; i < 4; i += 1) low = answer(low, false);
    expect(tierOf(low, 'reading')).toBe(1);
  });

  it('keeps each subject on its own tier track', () => {
    // Ace reading, then bomb math. Reading must keep its earned tier.
    let s = createSession('K');
    while (currentSubject(s) === 'reading') s = answer(s, true);
    const readingTier = tierOf(s, 'reading');
    expect(readingTier).toBeGreaterThan(1);

    expect(currentSubject(s)).toBe('math');
    s = answer(s, false);
    s = answer(s, false);
    expect(tierOf(s, 'reading')).toBe(readingTier);
    expect(tierOf(s, 'math')).toBe(1);
  });
});

describe('session shape', () => {
  it('asks every subject in order, a fixed number of questions each', () => {
    let s = createSession('2');
    const seen: Subject[] = [];
    while (!s.finishedAt) {
      seen.push(currentSubject(s)!);
      s = answer(s, seen.length % 3 === 0);
    }
    expect(s.questionsAnswered.length).toBe(TOTAL_QUESTIONS);
    for (const subject of SUBJECT_ORDER) {
      expect(s.subjects[subject].answeredCount, subject).toBe(QUESTIONS_PER_SUBJECT);
    }
    // Subjects are asked in blocks, never interleaved.
    expect(seen).toEqual(
      SUBJECT_ORDER.flatMap((subject) => Array(QUESTIONS_PER_SUBJECT).fill(subject)),
    );
  });

  it('never serves the same question twice', () => {
    let s = createSession('4');
    while (!s.finishedAt) s = answer(s, true);
    const ids = s.questionsAnswered.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only serves questions from the active subject', () => {
    let s = createSession('1');
    while (!s.finishedAt) {
      const q = selectNextQuestion(s)!;
      expect(q.subject).toBe(currentSubject(s));
      s = answer(s, true);
    }
  });
});

describe('result', () => {
  it('reports per-subject placement without leaking tier numbers', () => {
    let s = createSession('K', 0);
    let t = 0;
    while (!s.finishedAt) {
      t += 14000;
      s = answer(s, true, t);
    }
    const result = buildResult(s);

    expect(result.subjects).toHaveLength(3);
    expect(result.subjects.map((x) => x.subject)).toEqual(SUBJECT_ORDER);
    for (const placement of result.subjects) {
      expect(placement.gradeEquivalentDisplay).not.toMatch(/tier/i);
      expect(placement.recommendedStartingModule.length).toBeGreaterThan(0);
      expect(placement.questionsAnswered).toBe(QUESTIONS_PER_SUBJECT);
    }
    expect(result.questionsAnswered).toBe(TOTAL_QUESTIONS);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.history).toHaveLength(TOTAL_QUESTIONS);
  });

  it('surfaces an uneven profile when strands differ', () => {
    // Ace reading, bomb math and writing.
    let s = createSession('3');
    while (currentSubject(s) === 'reading') s = answer(s, true);
    while (!s.finishedAt) s = answer(s, false);

    const result = buildResult(s);
    const reading = result.subjects.find((x) => x.subject === 'reading')!;
    const math = result.subjects.find((x) => x.subject === 'math')!;
    expect(reading.finalTier).toBeGreaterThan(math.finalTier);
    expect(result.recommendedStartingModule).toMatch(/strongest in reading/i);
  });
});
