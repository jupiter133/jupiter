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
import type { Grade, SessionState, Subject } from './types';
import { SUBJECT_ORDER, ageBandForGrade, questionTextFor } from './types';

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

  it('gives junior-band items art or picture answers to lean on', () => {
    // Tiers 1 and 2 are what a K-3 child actually sees most of the time, so
    // those items must carry a visual rather than being a wall of text.
    const early = QUESTIONS.filter((q) => q.tier <= 2);
    const visual = early.filter((q) => q.art || q.options.some((o) => o.art));
    expect(visual.length / early.length).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps junior wording within an early-primary vocabulary', () => {
    // Raw length is the wrong proxy for "simpler" — two short sentences can beat
    // one long clause and still run longer. What holds is the vocabulary: the
    // junior variant must not reach past words a Grade 1-3 reader can decode.
    // "reluctant" is exempt: that item is *about* the word.
    const EXEMPT = new Set(['r-t3-01']);
    for (const q of QUESTIONS) {
      if (!q.questionTextJunior || EXEMPT.has(q.id)) continue;
      const longest = q.questionTextJunior
        .split(/\s+/)
        .map((w) => w.replace(/[^A-Za-z]/g, ''))
        .reduce((a, b) => (b.length > a.length ? b : a), '');
      expect(longest.length, `${q.id} uses "${longest}"`).toBeLessThanOrEqual(10);
    }
  });

  it('uses unique ids and valid correct answers', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });
});

describe('age band', () => {
  it('splits at grade 4, by stated grade rather than by tier', () => {
    const junior: Grade[] = ['K', '1', '2', '3'];
    const senior: Grade[] = ['4', '5', '6'];
    for (const g of junior) expect(ageBandForGrade(g), g).toBe('junior');
    for (const g of senior) expect(ageBandForGrade(g), g).toBe('senior');
  });

  it('gives the senior band the fuller wording even on easy items', () => {
    // A Grade 5 child who drops to tier 1 must not get the simplified copy.
    const simplified = QUESTIONS.find((q) => q.tier === 1 && q.questionTextJunior)!;
    expect(questionTextFor(simplified, 'senior')).toBe(simplified.questionText);
    expect(questionTextFor(simplified, 'junior')).toBe(simplified.questionTextJunior);
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
