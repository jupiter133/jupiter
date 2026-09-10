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
  QUESTIONS_PER_SUB_SKILL,
  READING_SUB_SKILLS,
  SUB_SKILL_STABILITY_WINDOW,
  deriveReadingLevel,
  readingBottleneck,
} from './readingSkills';
import { toReadingResult } from './engine';
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
  subSkill?: (typeof READING_SUB_SKILLS)[number],
): SessionState {
  let s = createSession(grade, subject, { floored, subSkill }, 0);
  let i = 0;
  while (!s.finishedAt) {
    i += 1;
    s = answer(s, correctAt(i), i * 10_000);
  }
  return s;
}

const ALL_GRADES: Grade[] = ['EL', 'JK', 'SK', '1', '2', '3', '4', '5', '6'];

describe('subjects and bands', () => {
  it('gives every grade all four subjects, reading first', () => {
    for (const grade of ALL_GRADES) {
      expect(subjectsForGrade(grade), grade).toEqual([
        'reading',
        'spelling',
        'writing',
        'math',
      ]);
    }
  });

  it('bands presentation on age, not grade', () => {
    // A nine-year-old in Grade 2 gets the older child's screen, measured
    // against Grade 2. Age and grade do different jobs.
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

  it('holds at least six items per reading sub-skill per tier', () => {
    for (const subSkill of READING_SUB_SKILLS) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter(
          (q) => q.subject === 'reading' && q.subSkill === subSkill && q.tier === tier,
        ).length;
        expect(n, `${subSkill} tier ${tier}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('tags every reading item with a sub-skill', () => {
    for (const q of QUESTIONS.filter((q) => q.subject === 'reading')) {
      expect(READING_SUB_SKILLS, q.id).toContain(q.subSkill);
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
    const low = sit('SK', 'reading', () => false);
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

describe('reading sub-skill sittings', () => {
  it('serves only its own sub-skill', () => {
    for (const subSkill of READING_SUB_SKILLS) {
      const s = sit('3', 'reading', () => true, false, subSkill);
      for (const a of s.questionsAnswered) {
        const q = QUESTIONS.find((x) => x.id === a.questionId)!;
        expect(q.subSkill).toBe(subSkill);
      }
    }
  });

  it('runs five questions at most and stops once the tier holds for three', () => {
    const longest = sit('3', 'reading', (i) => i % 4 === 1 || i % 4 === 2, false, 'oral-reading');
    expect(longest.questionsAnswered.length).toBeLessThanOrEqual(QUESTIONS_PER_SUB_SKILL);
    const steady = sit('3', 'reading', (i) => i % 2 === 0, false, 'oral-reading');
    expect(steady.questionsAnswered.length).toBe(SUB_SKILL_STABILITY_WINDOW);
  });

  it('starts at the grade tier and branches like every other sitting', () => {
    let s = createSession('4', 'reading', { subSkill: 'word-recognition' });
    expect(s.currentTier).toBe(4);
    s = answer(s, true); s = answer(s, true);
    expect(s.currentTier).toBe(5);
  });

  it('folds four parts into one reading result with the derived level', () => {
    const parts = READING_SUB_SKILLS.map((subSkill, i) =>
      sit('3', 'reading', () => i !== 2, false, subSkill),
    );
    const result = toReadingResult(parts);
    expect(result.subject).toBe('reading');
    expect(result.subSkills!.map((r) => r.subSkill)).toEqual(READING_SUB_SKILLS);
    expect(result.finalTier).toBe(deriveReadingLevel(result.subSkills!));
    expect(result.questionsAnswered).toBe(parts.reduce((n, p) => n + p.questionsAnswered.length, 0));
  });
});

describe('reading level derivation', () => {
  const results = [
    { subSkill: 'word-recognition' as const, finalTier: 5, questionsAnswered: 5 },
    { subSkill: 'oral-reading' as const, finalTier: 2, questionsAnswered: 5 },
    { subSkill: 'reading-vocabulary' as const, finalTier: 6, questionsAnswered: 5 },
    { subSkill: 'passage-comprehension' as const, finalTier: 4, questionsAnswered: 5 },
  ];

  it('defaults to the lowest of the four', () => {
    expect(deriveReadingLevel(results)).toBe(2);
  });

  it('offers a weighted rule the teachers can switch to', () => {
    const weighted = deriveReadingLevel(results, 'weighted');
    expect(weighted).toBeGreaterThan(2);
    expect(weighted).toBeLessThanOrEqual(6);
  });

  it('names the weakest sub-skill as the bottleneck', () => {
    expect(readingBottleneck(results)!.subSkill).toBe('oral-reading');
  });
});

describe('floored sittings', () => {
  it('starts at the lowest tier and never drops below it', () => {
    const s = sit('5', 'spelling', () => false, true);
    expect(s.tierHistory.every((t) => t === MIN_TIER)).toBe(true);
    expect(toSubjectResult(s).floored).toBe(true);
  });

  it('still branches upward, so a child who can spell climbs out', () => {
    const s = sit('5', 'spelling', () => true, true);
    expect(s.currentTier).toBeGreaterThan(MIN_TIER);
  });

  it('leaves an unfloored sitting starting at the grade tier', () => {
    expect(createSession('5', 'spelling').currentTier).toBe(5);
    expect(createSession('5', 'spelling', { floored: true }).currentTier).toBe(MIN_TIER);
  });
});

describe('placement result', () => {
  const ALL: Subject[] = ['reading', 'spelling', 'writing', 'math'];

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

  it('assesses all four subjects for every child, and stops nobody early', () => {
    const result = resultFor('1', { reading: 0 });
    expect(result.requiredSubjects).toEqual(ALL);
    expect(result.complete).toBe(false);
    expect(result.nextSubject).toBe('spelling');
  });

  it('withholds the program until every subject is sat', () => {
    const partial = resultFor('5', { reading: 5, spelling: 5 });
    expect(partial.complete).toBe(false);
    expect(partial.program).toBeNull();
    expect(partial.nextSubject).toBe('writing');

    const done = resultFor('5', { reading: 5, spelling: 5, writing: 5, math: 5 });
    expect(done.complete).toBe(true);
    expect(done.program!.name).toBe('Core Skills Enriched 4-6');
  });

  it('places on the reading track when reading is below a Grade 3 level', () => {
    const result = resultFor(
      '5',
      { reading: 1, spelling: 0, writing: 0, math: 0 },
      { floored: ['spelling', 'writing', 'math'] },
    );
    expect(result.readingGated).toBe(true);
    expect(result.program!.name).toMatch(/^Core Reading /);
  });

  it('flags every subject the decision did not rest on', () => {
    const gated = resultFor(
      '5',
      { reading: 1, spelling: 0, writing: 0, math: 0 },
      { floored: ['spelling', 'writing', 'math'] },
    );
    const nonDetermining = gated.subjects.filter((s) => s.nonDetermining).map((s) => s.subject);
    expect(nonDetermining).toEqual(['spelling', 'writing', 'math']);
    expect(gated.subjects.find((s) => s.subject === 'reading')!.nonDetermining).toBe(false);

    const enriched = resultFor('5', { reading: 5, spelling: 5, writing: 5, math: 5 });
    expect(enriched.subjects.every((s) => !s.nonDetermining)).toBe(true);
  });

  it('never lets a floored result feed the gate', () => {
    // Floored spelling reads as tier 0 — five grades behind. If that reached
    // the gate it would route this child on spelling instead of reading.
    const result = resultFor(
      '5',
      { reading: 1, spelling: 0, writing: 0, math: 0 },
      { floored: ['spelling', 'writing', 'math'] },
    );
    expect(result.program!.gateStep).toBe(1);
    expect(result.subjects.filter((s) => s.floored)).toHaveLength(3);
  });

  it('sets math content by grade, never by the assessed math tier', () => {
    const behind = resultFor('5', { reading: 5, spelling: 5, writing: 5, math: 1 });
    const ahead = resultFor('5', { reading: 5, spelling: 5, writing: 5, math: 8 });
    expect(behind.mathContentLevel).toBe(5);
    expect(ahead.mathContentLevel).toBe(5);
    expect(behind.program!.name).toBe('Core Skills Math 4-6');
  });

  it('flags an age and grade two or more years apart', () => {
    expect(resultFor('2', { reading: 3 }, { age: 7 }).ageGradeMismatch).toBe(false);
    expect(resultFor('2', { reading: 3 }, { age: 10 }).ageGradeMismatch).toBe(true);
    expect(resultFor('2', { reading: 3 }, { age: 5 }).ageGradeMismatch).toBe(true);
  });

  it('orders subjects by the sitting order, not completion order', () => {
    const result = buildResult('4', null, [
      { subject: 'math', finalTier: 4, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 3, history: [] },
      { subject: 'reading', finalTier: 5, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 1, history: [] },
      { subject: 'writing', finalTier: 4, floored: false, questionsAnswered: 8, durationMs: 1, completedAt: 2, history: [] },
    ]);
    expect(result.subjects.map((s) => s.subject)).toEqual(['reading', 'writing', 'math']);
  });

  it('never renders a raw tier number in parent-facing language', () => {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      const label = tierGradeLabel(tier);
      expect(label).not.toMatch(/tier/i);
      expect(label).toBe(tier === 0 ? 'Kindergarten level' : `Grade ${tier} level`);
    }
    const result = resultFor('6', { reading: 7, spelling: 6, writing: 6, math: 6 });
    expect(result.program!.gradeEquivalentDisplay).not.toMatch(/tier/i);
    for (const s of result.subjects) expect(s.gradeEquivalentDisplay).not.toMatch(/tier/i);
  });
});
