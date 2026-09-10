import { describe, expect, it } from 'vitest';
import {
  QUESTIONS_PER_SUBJECT,
  STABILITY_WINDOW,
  buildResult,
  createSession,
  isTierStable,
  selectNextQuestion,
  submitAnswer,
  toSubjectResult,
} from './engine';
import { QUESTIONS } from './questionBank';
import type { Grade, SessionState, Subject, SubjectResult } from './types';
import {
  MAX_TIER,
  MIN_TIER,
  SUBJECT_ORDER,
  ageBandForGrade,
  startTierForGrade,
  subjectsForGrade,
  tierGradeLabel,
} from './types';

function answer(state: SessionState, correct: boolean, at?: number): SessionState {
  const q = selectNextQuestion(state)!;
  const wrong = q.options.find((o) => o.id !== q.correctAnswerId)!.id;
  return submitAnswer(state, q, correct ? q.correctAnswerId : wrong, at);
}

/** Runs a whole subject sitting with a fixed answer pattern. */
function sit(grade: Grade, subject: Subject, correctAt: (i: number) => boolean): SessionState {
  let s = createSession(grade, subject, 0);
  let i = 0;
  while (!s.finishedAt) {
    i += 1;
    s = answer(s, correctAt(i), i * 10_000);
  }
  return s;
}

const ALL_GRADES: Grade[] = ['K', '1', '2', '3', '4', '5', '6'];

describe('subjects by grade', () => {
  it('gives K–3 reading only and never math or writing', () => {
    for (const grade of ['K', '1', '2', '3'] as Grade[]) {
      expect(subjectsForGrade(grade), grade).toEqual(['reading']);
    }
  });

  it('gives Grade 4–6 reading, then math, then writing', () => {
    for (const grade of ['4', '5', '6'] as Grade[]) {
      expect(subjectsForGrade(grade), grade).toEqual(['reading', 'math', 'writing']);
    }
  });

  it('bands K–3 junior and 4–6 senior', () => {
    for (const grade of ['K', '1', '2', '3'] as Grade[]) {
      expect(ageBandForGrade(grade), grade).toBe('junior');
    }
    for (const grade of ['4', '5', '6'] as Grade[]) {
      expect(ageBandForGrade(grade), grade).toBe('senior');
    }
  });
});

describe('question bank', () => {
  it('covers every tier from K through Grade 8 in every subject', () => {
    for (const subject of SUBJECT_ORDER) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
        expect(n, `${subject} tier ${tier}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('uses unique ids and valid answer keys', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });

  it('gives every grade headroom above and below its starting tier', () => {
    // Eight questions can move a child four tiers either way, so the bank has
    // to hold answers at both extremes for every starting grade.
    for (const grade of ALL_GRADES) {
      const start = startTierForGrade(grade);
      const reachLow = Math.max(MIN_TIER, start - 4);
      const reachHigh = Math.min(MAX_TIER, start + 4);
      for (const subject of subjectsForGrade(grade)) {
        for (const tier of [reachLow, reachHigh]) {
          const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
          expect(n, `${grade} ${subject} tier ${tier}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('start tier', () => {
  it('maps Kindergarten to 0 and Grade n to n', () => {
    expect(startTierForGrade('K')).toBe(0);
    expect(startTierForGrade('1')).toBe(1);
    expect(startTierForGrade('6')).toBe(6);
  });
});

describe('branching', () => {
  it('moves up one tier after two correct in a row', () => {
    let s = createSession('4', 'reading');
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
  });

  it('moves down one tier after two incorrect in a row', () => {
    let s = createSession('4', 'reading');
    s = answer(s, false);
    s = answer(s, false);
    expect(s.currentTier).toBe(3);
  });

  it('resets streaks when a run is broken', () => {
    let s = createSession('4', 'reading');
    s = answer(s, true);
    s = answer(s, false);
    expect(s.currentTier).toBe(4);
    expect(s.consecutiveCorrect).toBe(0);
    expect(s.consecutiveIncorrect).toBe(1);
  });

  it('clamps at Kindergarten and Grade 8', () => {
    const low = sit('K', 'reading', () => false);
    expect(low.currentTier).toBe(MIN_TIER);

    let high = createSession('6', 'reading');
    for (let i = 0; i < 6 && !high.finishedAt; i += 1) high = answer(high, true);
    expect(high.currentTier).toBeLessThanOrEqual(MAX_TIER);
  });

  it('serves the next question from the tier the branch moved to', () => {
    let s = createSession('4', 'reading');
    s = answer(s, true);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
    expect(selectNextQuestion(s)!.tier).toBe(5);
  });
});

describe('length and stop rule', () => {
  it('never runs past eight questions', () => {
    for (const grade of ALL_GRADES) {
      for (const subject of subjectsForGrade(grade)) {
        const s = sit(grade, subject, (i) => i % 3 === 0);
        expect(s.questionsAnswered.length, `${grade} ${subject}`).toBeLessThanOrEqual(
          QUESTIONS_PER_SUBJECT,
        );
      }
    }
  });

  it('ends early once the tier has held for four questions', () => {
    // Alternating answers never build a streak, so the tier never moves.
    const s = sit('4', 'reading', (i) => i % 2 === 0);
    expect(s.questionsAnswered.length).toBe(STABILITY_WINDOW);
    expect(isTierStable(s)).toBe(true);
  });

  it('keeps going while the tier is still moving', () => {
    // Two right, two wrong repeating: the tier changes every second answer.
    const s = sit('4', 'reading', (i) => i % 4 === 1 || i % 4 === 2);
    expect(s.questionsAnswered.length).toBeGreaterThan(STABILITY_WINDOW);
  });

  it('never serves the same question twice', () => {
    const s = sit('5', 'math', (i) => i % 2 === 0);
    const ids = s.questionsAnswered.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only serves questions from the subject being sat', () => {
    for (const subject of SUBJECT_ORDER) {
      const s = sit('5', subject, () => true);
      for (const a of s.questionsAnswered) expect(a.subject).toBe(subject);
    }
  });
});

describe('subject result', () => {
  it('reports the tier the sitting ended on', () => {
    const s = sit('4', 'reading', () => true);
    const result = toSubjectResult(s);
    expect(result.finalTier).toBe(s.currentTier);
    expect(result.subject).toBe('reading');
    expect(result.questionsAnswered).toBe(s.questionsAnswered.length);
    expect(result.durationMs).toBeGreaterThan(0);
  });
});

describe('placement result', () => {
  const resultFor = (grade: Grade, tiers: Partial<Record<Subject, number>>) => {
    const completed: SubjectResult[] = Object.entries(tiers).map(([subject, finalTier]) => ({
      subject: subject as Subject,
      finalTier: finalTier as number,
      questionsAnswered: 8,
      durationMs: 60_000,
      completedAt: 1,
      history: [],
    }));
    return buildResult(grade, completed);
  };

  it('gives a K–3 child a reading row and no empty math or writing slots', () => {
    const result = resultFor('1', { reading: 2 });
    expect(result.requiredSubjects).toEqual(['reading']);
    expect(result.subjects).toHaveLength(1);
    expect(result.subjects[0].subject).toBe('reading');
    expect(result.complete).toBe(true);
    expect(result.nextSubject).toBeNull();
  });

  it('withholds the program until every required subject is sat', () => {
    const partial = resultFor('5', { reading: 5 });
    expect(partial.complete).toBe(false);
    expect(partial.program).toBeNull();
    expect(partial.nextSubject).toBe('math');
    expect(partial.subjects).toHaveLength(1);

    const done = resultFor('5', { reading: 5, math: 4, writing: 3 });
    expect(done.complete).toBe(true);
    expect(done.program).not.toBeNull();
    expect(done.nextSubject).toBeNull();
  });

  it('orders subjects by the sitting order, not completion order', () => {
    const result = buildResult('4', [
      { subject: 'writing', finalTier: 3, questionsAnswered: 8, durationMs: 1, completedAt: 3, history: [] },
      { subject: 'reading', finalTier: 5, questionsAnswered: 8, durationMs: 1, completedAt: 1, history: [] },
      { subject: 'math', finalTier: 4, questionsAnswered: 8, durationMs: 1, completedAt: 2, history: [] },
    ]);
    expect(result.subjects.map((s) => s.subject)).toEqual(['reading', 'math', 'writing']);
  });

  it('never renders a raw tier number in parent-facing language', () => {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      const label = tierGradeLabel(tier);
      expect(label).not.toMatch(/tier/i);
      expect(label).toBe(tier === 0 ? 'Kindergarten level' : `Grade ${tier} level`);
    }
    const result = resultFor('6', { reading: 7, math: 6, writing: 6 });
    expect(result.program!.gradeEquivalentDisplay).not.toMatch(/tier/i);
    for (const s of result.subjects) expect(s.gradeEquivalentDisplay).not.toMatch(/tier/i);
  });
});
