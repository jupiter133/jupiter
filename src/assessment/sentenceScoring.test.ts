import { describe, expect, it } from 'vitest';
import { hasAttempt, markSentence } from './sentenceScoring';

const rubric = { requiredWords: ['canoe', 'water'] };

describe('marking a written sentence', () => {
  it('accepts a sentence that uses the words and is punctuated', () => {
    const marks = markSentence('The canoe glides across the flat water.', rubric);
    expect(marks.correct).toBe(true);
    expect(marks.missingWords).toEqual([]);
  });

  it('names the words that were left out', () => {
    const marks = markSentence('The canoe is red and very fast.', rubric);
    expect(marks.correct).toBe(false);
    expect(marks.missingWords).toEqual(['water']);
  });

  it('is case-insensitive about the required words but not about the opening', () => {
    expect(markSentence('The CANOE sits on the WATER.', rubric).hasRequiredWords).toBe(true);
    expect(markSentence('the canoe sits on the water.', rubric).startsCapitalised).toBe(false);
  });

  it('requires terminal punctuation, and takes ! and ? as readily as .', () => {
    for (const end of ['.', '!', '?']) {
      expect(markSentence(`The canoe is on the water${end}`, rubric).endsWithPunctuation).toBe(true);
    }
    expect(markSentence('The canoe is on the water', rubric).endsWithPunctuation).toBe(false);
  });

  it('rejects an answer that is just the required words back again', () => {
    expect(markSentence('Canoe water.', rubric).longEnough).toBe(false);
  });

  it('matches whole words, not fragments', () => {
    // "waterfall" is not "water", and marking it as such would reward a child
    // for a word they did not use.
    const marks = markSentence('The canoe passed a waterfall today.', rubric);
    expect(marks.missingWords).toEqual(['water']);
  });

  it('keeps apostrophes inside a word', () => {
    const marks = markSentence("The guide's canoe sat on the water.", {
      requiredWords: ["guide's", 'canoe'],
    });
    expect(marks.hasRequiredWords).toBe(true);
  });

  it('tells an empty box apart from a wrong answer', () => {
    expect(hasAttempt('   ')).toBe(false);
    expect(hasAttempt('No.')).toBe(true);
    expect(markSentence('', rubric).correct).toBe(false);
  });
});
