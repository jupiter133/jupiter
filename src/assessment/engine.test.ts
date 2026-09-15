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
import { QUESTIONS, READING_BANK_IS_STUB } from './questionBank';
import {
  READING_SUBJECTS,
  deriveReadingLevel,
  readingBottleneck,
} from './readingLevel';
import type { Grade, SessionState, Subject, SubjectResult } from './types';
import {
  MAX_TIER,
  MIN_TIER,
  SUBJECT_ORDER,
  ageBandForAge,
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
function sit(
  grade: Grade,
  subject: Subject,
  correctAt: (i: number) => boolean,
  floored = false,
): SessionState {
  let s = createSession(grade, subject, { floored }, 0);
  let i = 0;
  while (!s.finishedAt) {
    i += 1;
    s = answer(s, correctAt(i), i * 10_000);
  }
  return s;
}

const ALL_GRADES: Grade[] = ['EL', 'JK', 'SK', '1', '2', '3', '4', '5', '6'];

describe('subjects and bands', () => {
  it('gives every grade all five subjects, in the design’s order', () => {
    for (const grade of ALL_GRADES) {
      expect(subjectsForGrade(grade), grade).toEqual([
        'oral-reading',
        'reading-comprehension',
        'vocabulary-spelling',
        'sentence-writing',
        'math',
      ]);
    }
  });

  it('bands presentation on age, not grade', () => {
    expect(ageBandForAge(6)).toBe('junior');
    expect(ageBandForAge(8)).toBe('junior');
    expect(ageBandForAge(9)).toBe('senior');
    expect(ageBandForAge(13)).toBe('senior');
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

  it('holds at least six items per tier in the two reading subjects', () => {
    for (const subject of READING_SUBJECTS) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
        expect(n, `${subject} tier ${tier}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('knows the reading bank is a stub, so nobody ships on it by accident', () => {
    // Flip this expectation when the teacher-written banks land.
    expect(READING_BANK_IS_STUB).toBe(true);
  });

  it('uses unique ids and valid answer keys', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });

  it('holds enough items to run every sitting to its full length', () => {
    for (const subject of SUBJECT_ORDER) {
      const n = QUESTIONS.filter((q) => q.subject === subject).length;
      expect(n, subject).toBeGreaterThanOrEqual(QUESTIONS_PER_SUBJECT[subject]);
    }
  });
});

describe('start tier', () => {
  it('maps everything before Grade 1 to 0 and Grade n to n', () => {
    expect(startTierForGrade('EL')).toBe(0);
    expect(startTierForGrade('JK')).toBe(0);
    expect(startTierForGrade('SK')).toBe(0);
    expect(startTierForGrade('1')).toBe(1);
    expect(startTierForGrade('6')).toBe(6);
  });
});

describe('branching', () => {
  it('moves up one tier after two correct in a row', () => {
    let s = createSession('4', 'oral-reading');
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
  });

  it('moves down one tier after two incorrect in a row', () => {
    let s = createSession('4', 'oral-reading');
    s = answer(s, false);
    s = answer(s, false);
    expect(s.currentTier).toBe(3);
  });

  it('resets streaks when a run is broken', () => {
    let s = createSession('4', 'oral-reading');
    s = answer(s, true);
    s = answer(s, false);
    expect(s.currentTier).toBe(4);
    expect(s.consecutiveCorrect).toBe(0);
    expect(s.consecutiveIncorrect).toBe(1);
  });

  it('clamps at Kindergarten and Grade 8', () => {
    const low = sit('SK', 'oral-reading', () => false);
    expect(low.currentTier).toBe(MIN_TIER);

    let high = createSession('6', 'oral-reading');
    for (let i = 0; i < 6 && !high.finishedAt; i += 1) high = answer(high, true);
    expect(high.currentTier).toBeLessThanOrEqual(MAX_TIER);
  });

  it('serves the next question from the tier the branch moved to', () => {
    let s = createSession('4', 'oral-reading');
    s = answer(s, true);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
    expect(selectNextQuestion(s)!.tier).toBe(5);
  });
});

describe('length and stop rule', () => {
  it('never runs past its subject’s length', () => {
    for (const grade of ALL_GRADES) {
      for (const subject of subjectsForGrade(grade)) {
        const s = sit(grade, subject, (i) => i % 3 === 0);
        expect(s.questionsAnswered.length, `${grade} ${subject}`).toBeLessThanOrEqual(
          QUESTIONS_PER_SUBJECT[subject],
        );
      }
    }
  });

  it('gives math the longer sitting its intro promises', () => {
    expect(QUESTIONS_PER_SUBJECT.math).toBe(10);
    expect(QUESTIONS_PER_SUBJECT['oral-reading']).toBe(8);
  });

  it('ends early once the tier has held for four questions', () => {
    // Alternating answers never build a streak, so the tier never moves.
    const s = sit('4', 'oral-reading', (i) => i % 2 === 0);
    expect(s.questionsAnswered.length).toBe(STABILITY_WINDOW);
    expect(isTierStable(s)).toBe(true);
  });

  it('keeps going while the tier is still moving', () => {
    const s = sit('4', 'oral-reading', (i) => i % 4 === 1 || i % 4 === 2);
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
    const s = sit('4', 'oral-reading', () => true);
    const result = toSubjectResult(s);
    expect(result.finalTier).toBe(s.currentTier);
    expect(result.subject).toBe('oral-reading');
    expect(result.questionsAnswered).toBe(s.questionsAnswered.length);
    expect(result.durationMs).toBeGreaterThan(0);
  });
});

describe('reading level derivation', () => {
  const parts = [
    { subject: 'oral-reading' as const, finalTier: 2 },
    { subject: 'reading-comprehension' as const, finalTier: 5 },
  ];

  it('defaults to the lower of the two reading subjects', () => {
    expect(deriveReadingLevel(parts)).toBe(2);
  });

  it('withholds a level until both reading subjects are sat', () => {
    expect(deriveReadingLevel([parts[0]])).toBeNull();
  });

  it('offers a weighted rule the teachers can switch to', () => {
    expect(deriveReadingLevel(parts, 'weighted')).toBe(3);
  });

  it('names the weaker reading subject as the bottleneck', () => {
    expect(readingBottleneck(parts)!.subject).toBe('oral-reading');
  });
});

describe('floored sittings', () => {
  it('starts at the lowest tier and never drops below it', () => {
    const s = sit('5', 'vocabulary-spelling', () => false, true);
    expect(s.tierHistory.every((t) => t === MIN_TIER)).toBe(true);
    expect(toSubjectResult(s).floored).toBe(true);
  });

  it('still branches upward, so a child who can spell climbs out', () => {
    const s = sit('5', 'vocabulary-spelling', () => true, true);
    expect(s.currentTier).toBeGreaterThan(MIN_TIER);
  });

  it('leaves an unfloored sitting starting at the grade tier', () => {
    expect(createSession('5', 'vocabulary-spelling').currentTier).toBe(5);
    expect(createSession('5', 'vocabulary-spelling', { floored: true }).currentTier).toBe(MIN_TIER);
  });
});

describe('placement result', () => {
  const ALL: Subject[] = [
    'oral-reading',
    'reading-comprehension',
    'vocabulary-spelling',
    'sentence-writing',
    'math',
  ];

  const resultFor = (
    grade: Grade,
    tiers: Partial<Record<Subject, number>>,
    options: { age?: number; floored?: Subject[] } = {},
  ) => {
    const floored = new Set(options.floored ?? []);
    const completed: SubjectResult[] = ALL.filter((s) => s in tiers).map((subject) => ({
      subject,
      finalTier: tiers[subject] as number,
      floored: floored.has(subject),
      questionsAnswered: 8,
      durationMs: 60_000,
      completedAt: 1,
      history: [],
    }));
    return buildResult(grade, options.age ?? null, completed);
  };

  const onLevel = (grade: number) => ({
    'oral-reading': grade,
    'reading-comprehension': grade,
    'vocabulary-spelling': grade,
    'sentence-writing': grade,
    math: grade,
  });

  it('assesses all five subjects for every child, and stops nobody early', () => {
    const result = resultFor('1', { 'oral-reading': 0 });
    expect(result.requiredSubjects).toEqual(ALL);
    expect(result.complete).toBe(false);
    expect(result.nextSubject).toBe('reading-comprehension');
  });

  it('withholds the program until every subject is sat', () => {
    const partial = resultFor('5', { 'oral-reading': 5, 'reading-comprehension': 5 });
    expect(partial.complete).toBe(false);
    expect(partial.program).toBeNull();

    const done = resultFor('5', onLevel(5));
    expect(done.complete).toBe(true);
    expect(done.program!.name).toBe('Core Skills Enriched 4-6');
  });

  it('derives the reading level from both reading subjects', () => {
    const result = resultFor('5', { ...onLevel(5), 'oral-reading': 2 });
    expect(result.readingTier).toBe(2);
    expect(result.readingGated).toBe(true);
    expect(result.program!.name).toMatch(/^Core Reading /);
  });

  it('flags every subject the decision did not rest on', () => {
    const gated = resultFor(
      '5',
      { 'oral-reading': 1, 'reading-comprehension': 1, 'vocabulary-spelling': 0, 'sentence-writing': 0, math: 0 },
      { floored: ['vocabulary-spelling', 'sentence-writing', 'math'] },
    );
    const nonDetermining = gated.subjects.filter((s) => s.nonDetermining).map((s) => s.subject);
    expect(nonDetermining).toEqual(['vocabulary-spelling', 'sentence-writing', 'math']);

    const enriched = resultFor('5', onLevel(5));
    expect(enriched.subjects.every((s) => !s.nonDetermining)).toBe(true);
  });

  it('sets math content by grade, never by the assessed math tier', () => {
    const behind = resultFor('5', { ...onLevel(5), math: 1 });
    const ahead = resultFor('5', { ...onLevel(5), math: 8 });
    expect(behind.mathContentLevel).toBe(5);
    expect(ahead.mathContentLevel).toBe(5);
    expect(behind.program!.name).toBe('Core Skills Math 4-6');
  });

  it('flags an age and grade two or more years apart', () => {
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 7 }).ageGradeMismatch).toBe(false);
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 10 }).ageGradeMismatch).toBe(true);
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 5 }).ageGradeMismatch).toBe(true);
  });

  it('orders subjects by the sitting order, not completion order', () => {
    const result = buildResult('4', null, [
      { subject: 'math', finalTier: 4, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 3, history: [] },
      { subject: 'oral-reading', finalTier: 5, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 1, history: [] },
      { subject: 'sentence-writing', finalTier: 4, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 2, history: [] },
    ]);
    expect(result.subjects.map((s) => s.subject)).toEqual([
      'oral-reading',
      'sentence-writing',
      'math',
    ]);
  });

  it('never renders a raw tier number in parent-facing language', () => {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      const label = tierGradeLabel(tier);
      expect(label).not.toMatch(/tier/i);
      expect(label).toBe(tier === 0 ? 'Kindergarten level' : `Grade ${tier} level`);
    }
    const result = resultFor('6', onLevel(6));
    expect(result.program!.gradeEquivalentDisplay).not.toMatch(/tier/i);
    for (const s of result.subjects) expect(s.gradeEquivalentDisplay).not.toMatch(/tier/i);
  });
});
