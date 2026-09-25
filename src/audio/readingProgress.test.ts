import { describe, expect, it } from 'vitest';
import { advanceMarker, countWords, splitPassage } from './readingProgress';

describe('reading progress', () => {
  it('splits a passage into words, keeping punctuation attached', () => {
    expect(splitPassage('Look at my dog. See it run.')).toEqual([
      'Look', 'at', 'my', 'dog.', 'See', 'it', 'run.',
    ]);
    expect(splitPassage('  spaced   out \n words ')).toEqual(['spaced', 'out', 'words']);
    expect(splitPassage('')).toEqual([]);
  });

  it('counts words in a transcript without looking at what they are', () => {
    expect(countWords('look at my')).toBe(3);
    expect(countWords('banana banana banana')).toBe(3);
  });

  it('never moves the marker backwards when recognition revises itself', () => {
    expect(advanceMarker(5, 3, 20)).toBe(5);
    expect(advanceMarker(5, 7, 20)).toBe(7);
  });

  it('never runs past the end of the passage', () => {
    expect(advanceMarker(18, 40, 20)).toBe(20);
  });

  it('is blind to correctness: the same count advances the same amount', () => {
    // A child who reads the passage and a child who says nonsense of the same
    // length land in the same place. That is deliberate — the marker reports
    // progress, never a verdict.
    const right = countWords('In winter the river');
    const wrong = countWords('um uh the um');
    expect(advanceMarker(0, right, 20)).toBe(advanceMarker(0, wrong, 20));
  });
});
