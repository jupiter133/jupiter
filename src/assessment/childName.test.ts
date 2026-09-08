import { describe, expect, it } from 'vitest';
import { displayName, firstName, possessiveName } from './childName';

describe('child name', () => {
  it('uses the name when one is given', () => {
    expect(firstName('Maya')).toBe('Maya');
    expect(displayName('Maya')).toBe('Maya');
    expect(possessiveName('Maya')).toBe('Maya’s');
  });

  it('trims surrounding whitespace', () => {
    expect(firstName('  Maya  ')).toBe('Maya');
    expect(possessiveName('  Maya ')).toBe('Maya’s');
  });

  it('falls back for parent-facing copy when blank', () => {
    for (const blank of ['', '   ', '\t']) {
      expect(displayName(blank)).toBe('your child');
      expect(possessiveName(blank)).toBe('your child’s');
    }
  });

  it('returns null for child-facing copy when blank', () => {
    // Child-facing screens must drop the name rather than say "your child",
    // which would read as "Hi your child!" from the mascot.
    expect(firstName('')).toBeNull();
    expect(firstName('   ')).toBeNull();
  });
});
