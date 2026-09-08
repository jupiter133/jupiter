import { describe, expect, it } from 'vitest';
import { audioDefaultFor, speechRateFor, speechScriptFor } from './speechScript';
import { QUESTIONS } from '../assessment/questionBank';
import type { Question } from '../assessment/types';

const withPassage = QUESTIONS.find((q) => q.passage)! as Question;
const noPassage = QUESTIONS.find((q) => !q.passage)! as Question;

describe('read-aloud defaults', () => {
  it('starts on for the junior band and off for senior', () => {
    expect(audioDefaultFor('junior')).toBe(true);
    expect(audioDefaultFor('senior')).toBe(false);
  });

  it('reads more slowly for younger listeners', () => {
    expect(speechRateFor('junior')).toBeLessThan(speechRateFor('senior'));
  });
});

describe('speech script', () => {
  it('reads the passage before the question', () => {
    const script = speechScriptFor(withPassage, 'senior');
    expect(script).toContain(withPassage.passage);
    expect(script.indexOf(withPassage.passage!)).toBeLessThan(
      script.indexOf(withPassage.questionText),
    );
  });

  it('reads the answer options for junior but not senior', () => {
    const junior = speechScriptFor(noPassage, 'junior').join(' ');
    const senior = speechScriptFor(noPassage, 'senior').join(' ');
    for (const option of noPassage.options) {
      expect(junior).toContain(option.text);
    }
    expect(senior).not.toContain(noPassage.options[noPassage.options.length - 1].text);
  });

  it('speaks the simplified wording to the junior band', () => {
    const simplified = QUESTIONS.find((q) => q.questionTextJunior)!;
    expect(speechScriptFor(simplified, 'junior')).toContain(simplified.questionTextJunior);
    expect(speechScriptFor(simplified, 'senior')).toContain(simplified.questionText);
  });

  it('never leaks which answer is correct', () => {
    // The invariant is independence, not the absence of the word "correct" —
    // "Choose the correct word." is a legitimate prompt. Point the answer key at
    // a different option and the narration must come out byte-identical.
    for (const question of QUESTIONS) {
      for (const band of ['junior', 'senior'] as const) {
        const other = question.options.find((o) => o.id !== question.correctAnswerId)!;
        const rekeyed = { ...question, correctAnswerId: other.id };
        expect(speechScriptFor(rekeyed, band), question.id).toEqual(
          speechScriptFor(question, band),
        );
      }
    }
  });

  it('produces something to say for every question in the bank', () => {
    for (const question of QUESTIONS) {
      for (const band of ['junior', 'senior'] as const) {
        const script = speechScriptFor(question, band);
        expect(script.length, question.id).toBeGreaterThan(0);
        expect(script.every((line) => line.trim().length > 0), question.id).toBe(true);
      }
    }
  });
});
