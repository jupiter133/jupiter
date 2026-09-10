import { describe, expect, it } from 'vitest';
import { evaluateGate, type GateInputs } from './gate';
import { GRADES, type Grade, type Tier } from './tiers';
import { coreBandForGrade } from './programs';

/** Builds gate inputs from a grade and a gap per subject. */
function inputs(
  grade: Grade,
  gaps: { reading?: number; spelling?: number; writing?: number; math?: number },
  readingTierOverride?: Tier,
): GateInputs {
  const gradeT = Number.isNaN(Number(grade)) ? 0 : Number(grade);
  const readingGap = gaps.reading ?? 0;
  return {
    grade,
    readingTier: readingTierOverride ?? Math.max(0, gradeT + readingGap),
    readingGap,
    spellingGap: gaps.spelling ?? 0,
    writingGap: gaps.writing ?? 0,
    mathGap: gaps.math ?? 0,
  };
}

/** Every combination of gaps from 3 behind to 1 ahead, for every grade. */
function everyCase(): GateInputs[] {
  const range = [-3, -2, -1, 0, 1];
  const all: GateInputs[] = [];
  for (const grade of GRADES) {
    for (const reading of range) {
      for (const spelling of range) {
        for (const writing of range) {
          for (const math of range) {
            all.push(inputs(grade, { reading, spelling, writing, math }));
          }
        }
      }
    }
  }
  return all;
}

describe('gate order', () => {
  it('routes reading below a Grade 3 level to the Reading track at any age', () => {
    // A Grade 6 child reading at a Grade 2 level lands here, same as a Grade 1.
    const older = evaluateGate(inputs('6', { reading: -4 }))!;
    expect(older.step).toBe(1);
    expect(older.outcome).toBe('reading-track');
    expect(older.programName).toMatch(/^Core Reading /);

    const younger = evaluateGate(inputs('1', { reading: -1 }))!;
    expect(younger.step).toBe(1);
    expect(younger.outcome).toBe('reading-track');
  });

  it('ignores strong later subjects once reading has gated', () => {
    const decision = evaluateGate(
      inputs('5', { reading: -3, spelling: 1, writing: 1, math: 1 }),
    )!;
    expect(decision.step).toBe(1);
    expect(decision.readingGated).toBe(true);
    expect(decision.determinedBy).toEqual(['reading']);
  });

  it('sends a reader at Grade 3 level or better to Core Skills, not Core Reading', () => {
    // A Grade 1 child reading at a Grade 3 level is ahead, not on the Reading track.
    const decision = evaluateGate(inputs('1', { reading: 2 }))!;
    expect(decision.outcome).not.toBe('reading-track');
    expect(decision.programName).toBe('Core Skills Enriched 1-3');
  });

  it('routes reading more than one grade behind to Core Skills Reading', () => {
    const decision = evaluateGate(inputs('5', { reading: -2 }))!;
    expect(decision.step).toBe(2);
    expect(decision.programName).toBe('Core Skills Reading 4-6');
  });

  it('routes writing or spelling behind to Core Skills Writing', () => {
    const byWriting = evaluateGate(inputs('5', { writing: -2 }))!;
    expect(byWriting.step).toBe(3);
    expect(byWriting.programName).toBe('Core Skills Writing 4-6');

    const bySpelling = evaluateGate(inputs('5', { spelling: -2 }))!;
    expect(bySpelling.step).toBe(3);
    expect(bySpelling.programName).toBe('Core Skills Writing 4-6');
  });

  it('routes math behind to Core Skills Math only when literacy is on level', () => {
    const decision = evaluateGate(inputs('5', { math: -2 }))!;
    expect(decision.step).toBe(4);
    expect(decision.programName).toBe('Core Skills Math 4-6');
  });

  it('routes all four within one grade to Enriched', () => {
    const decision = evaluateGate(inputs('5', {}))!;
    expect(decision.step).toBe(5);
    expect(decision.programName).toBe('Core Skills Enriched 4-6');
  });
});

describe('hard blocks', () => {
  it('never outputs Writing when reading is more than one grade behind', () => {
    for (const input of everyCase()) {
      const decision = evaluateGate(input)!;
      if (decision.outcome === 'core-writing') {
        expect(input.readingGap!, JSON.stringify(input)).toBeGreaterThan(-2);
      }
    }
  });

  it('never outputs Math unless reading, writing and spelling are all within one grade', () => {
    for (const input of everyCase()) {
      const decision = evaluateGate(input)!;
      if (decision.outcome === 'core-math') {
        expect(input.readingGap!).toBeGreaterThan(-2);
        expect(input.writingGap!).toBeGreaterThan(-2);
        expect(input.spellingGap!).toBeGreaterThan(-2);
      }
    }
  });

  it('never outputs Enriched when any subject is more than one grade behind', () => {
    for (const input of everyCase()) {
      const decision = evaluateGate(input)!;
      if (decision.outcome === 'enriched') {
        for (const gap of [input.readingGap!, input.writingGap!, input.spellingGap!, input.mathGap!]) {
          expect(gap).toBeGreaterThan(-2);
        }
      }
    }
  });

  it('always outputs exactly one planner, and only from the child’s grade band', () => {
    for (const input of everyCase()) {
      const decision = evaluateGate(input)!;
      expect(decision.programName.length).toBeGreaterThan(0);
      if (decision.outcome === 'reading-track') {
        expect(decision.programName).toMatch(/^Core Reading [1-6]$/);
      } else {
        const band = coreBandForGrade(input.grade);
        expect(decision.programName, JSON.stringify(input)).toContain(band);
      }
    }
  });
});

describe('grade band', () => {
  it('collapses reading and writing into one planner for Grades 1–3', () => {
    const byReading = evaluateGate(inputs('2', { reading: -2 }, 3))!;
    const byWriting = evaluateGate(inputs('2', { writing: -2 }, 3))!;
    expect(byReading.programName).toBe('Core Skills Reading and Writing 1-3');
    expect(byWriting.programName).toBe('Core Skills Reading and Writing 1-3');
  });

  it('keeps reading and writing separate for Grades 4–6', () => {
    const byReading = evaluateGate(inputs('5', { reading: -2 }))!;
    const byWriting = evaluateGate(inputs('5', { writing: -2 }))!;
    expect(byReading.programName).toBe('Core Skills Reading 4-6');
    expect(byWriting.programName).toBe('Core Skills Writing 4-6');
    expect(byReading.programName).not.toBe(byWriting.programName);
  });
});

describe('non-determining results', () => {
  it('marks only the subjects the decision rested on', () => {
    expect(evaluateGate(inputs('5', { reading: -4 }))!.determinedBy).toEqual(['reading']);
    expect(evaluateGate(inputs('5', { reading: -2 }))!.determinedBy).toEqual(['reading']);
    expect(evaluateGate(inputs('5', { writing: -2 }))!.determinedBy).toEqual([
      'reading',
      'spelling',
      'writing',
    ]);
    expect(evaluateGate(inputs('5', { math: -2 }))!.determinedBy).toHaveLength(4);
  });
});

describe('partial evidence', () => {
  it('withholds a decision until the rule in play can be evaluated', () => {
    const base = { grade: '5' as Grade, readingTier: 5, readingGap: 0, spellingGap: null, writingGap: null, mathGap: null };
    expect(evaluateGate(base)).toBeNull();
    expect(evaluateGate({ ...base, spellingGap: 0, writingGap: 0 })).toBeNull();
    expect(evaluateGate({ ...base, spellingGap: 0, writingGap: 0, mathGap: 0 })).not.toBeNull();
  });

  it('decides on reading alone when reading gates or is far behind', () => {
    const gated = { grade: '5' as Grade, readingTier: 2, readingGap: -3, spellingGap: null, writingGap: null, mathGap: null };
    expect(evaluateGate(gated)!.step).toBe(1);

    const behind = { grade: '5' as Grade, readingTier: 3, readingGap: -2, spellingGap: null, writingGap: null, mathGap: null };
    expect(evaluateGate(behind)!.step).toBe(2);
  });
});
