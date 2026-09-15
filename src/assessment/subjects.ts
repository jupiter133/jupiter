/**
 * The five assessed subjects, in sitting order, exactly as the OLC assessment
 * intro design names them.
 *
 * Reading is two of the five: oral reading and comprehension are separate
 * sittings that produce separate levels, which the gate then folds into one
 * reading level (see readingLevel.ts).
 */
export type Subject =
  | 'oral-reading'
  | 'reading-comprehension'
  | 'vocabulary-spelling'
  | 'sentence-writing'
  | 'math';

export const SUBJECT_ORDER: Subject[] = [
  'oral-reading',
  'reading-comprehension',
  'vocabulary-spelling',
  'sentence-writing',
  'math',
];

/** Full names, as the intro screens say them. */
export const SUBJECT_LABEL: Record<Subject, string> = {
  'oral-reading': 'Oral Reading & Fluency',
  'reading-comprehension': 'Reading Comprehension',
  'vocabulary-spelling': 'Vocabulary & Spelling',
  'sentence-writing': 'Sentence Writing',
  math: 'Mathematics',
};

/** Short forms, for a results row or a chip where the full name won't fit. */
export const SUBJECT_SHORT: Record<Subject, string> = {
  'oral-reading': 'Oral Reading',
  'reading-comprehension': 'Comprehension',
  'vocabulary-spelling': 'Vocabulary & Spelling',
  'sentence-writing': 'Sentence Writing',
  math: 'Math',
};

/** Highlighter colour per subject, from the intro design. */
export const SUBJECT_COLOR: Record<Subject, 'cyan' | 'green' | 'pink' | 'gold' | 'lime'> = {
  'oral-reading': 'cyan',
  'reading-comprehension': 'green',
  'vocabulary-spelling': 'pink',
  'sentence-writing': 'gold',
  math: 'lime',
};

/**
 * Soft tile fill, hard bottom edge and tilt per subject, from the intro
 * design. Used by the subject tiles on the handoff and the name chips on the
 * results page — the saturated highlighter colours are for the intro headings.
 */
export const SUBJECT_TILE: Record<Subject, { bg: string; edge: string; tilt: string }> = {
  'oral-reading': { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)', tilt: '-1.5deg' },
  'reading-comprehension': {
    bg: 'var(--olc-cyan-soft)',
    edge: 'var(--olc-cyan-soft-dark)',
    tilt: '1deg',
  },
  'vocabulary-spelling': {
    bg: 'var(--olc-pink-soft)',
    edge: 'var(--olc-pink-soft-dark)',
    tilt: '-1deg',
  },
  'sentence-writing': { bg: 'var(--olc-gold-soft)', edge: '#E5C46A', tilt: '1.5deg' },
  math: { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)', tilt: '-1deg' },
};
