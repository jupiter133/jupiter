/**
 * Two assessments, one product.
 *
 * A five-year-old and a ten-year-old are not doing the same thing, so they do
 * not sit the same activities. **Little Readers** is pre-reading
 * and readiness; **Grade Level** is the full academic set. Age
 * chooses between them.
 */
export type Track = 'little-reader' | 'grade-level';

export type Subject =
  // Little Readers
  | 'find-the-same'
  | 'match-making'
  | 'spot-the-difference'
  | 'shapes-colors'
  | 'number-fun'
  | 'letter-sounds'
  | 'word-practice'
  // Grade Level
  | 'words-speaking'
  | 'oral-reading'
  | 'vocabulary'
  | 'reading-comprehension'
  | 'spelling'
  | 'sentence-writing'
  | 'math';

export const SUBJECT_LABEL: Record<Subject, string> = {
  'find-the-same': 'Find the Same',
  'match-making': 'Match Making',
  'spot-the-difference': 'Spot the Difference',
  'shapes-colors': 'Shapes & Colors',
  'number-fun': 'Number Fun',
  'letter-sounds': 'Letter Sounds',
  'word-practice': 'Word Practice',
  'words-speaking': 'Words Speaking',
  'oral-reading': 'Oral Reading',
  vocabulary: 'Vocabulary',
  'reading-comprehension': 'Reading Comprehension',
  spelling: 'Spelling',
  'sentence-writing': 'Sentence Writing',
  math: 'Math',
};

/** Short forms, for a results row or a button where the full name won't fit. */
export const SUBJECT_SHORT: Record<Subject, string> = {
  ...SUBJECT_LABEL,
  'spot-the-difference': 'Spot the Diff.',
  'reading-comprehension': 'Comprehension',
};

export type SubjectColor = 'green' | 'pink' | 'cyan' | 'gold' | 'lime';

/** Saturated highlighter per subject, for the intro headings. */
export const SUBJECT_COLOR: Record<Subject, SubjectColor> = {
  'find-the-same': 'pink',
  'match-making': 'gold',
  'spot-the-difference': 'green',
  'shapes-colors': 'cyan',
  'number-fun': 'lime',
  'letter-sounds': 'pink',
  'word-practice': 'green',
  'words-speaking': 'cyan',
  'oral-reading': 'pink',
  vocabulary: 'gold',
  'reading-comprehension': 'green',
  spelling: 'lime',
  'sentence-writing': 'gold',
  math: 'cyan',
};

/**
 * Soft tile fill and hard bottom edge, for the tiles and results chips.
 *
 * They sit STRAIGHT. Each tile used to carry its own hand-placed rotation,
 * which reads as charming on a marketing page and as a printing error on a
 * list of seven — the same call already made for `--tag-tilt` in tokens.css.
 */
export const SUBJECT_TILE: Record<Subject, { bg: string; edge: string }> = {
  'find-the-same': { bg: 'var(--olc-pink-soft)', edge: 'var(--olc-pink-soft-dark)' },
  'match-making': { bg: 'var(--olc-gold-soft)', edge: '#E5C46A' },
  'spot-the-difference': { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' },
  'shapes-colors': { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' },
  'number-fun': { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' },
  'letter-sounds': { bg: 'var(--olc-pink-soft)', edge: 'var(--olc-pink-soft-dark)' },
  'word-practice': { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' },
  'words-speaking': { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' },
  'oral-reading': { bg: 'var(--olc-pink-soft)', edge: 'var(--olc-pink-soft-dark)' },
  vocabulary: { bg: 'var(--olc-gold-soft)', edge: '#E5C46A' },
  'reading-comprehension': { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' },
  spelling: { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' },
  'sentence-writing': { bg: 'var(--olc-gold-soft)', edge: '#E5C46A' },
  math: { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' },
};

export interface TrackConfig {
  id: Track;
  /** The assessment's name, as the child's hero screen says it. */
  name: string;
  kicker: string;
  lead: string;
  cta: string;
  /** What one part is called in this track. */
  unit: string;
  unitPlural: string;
  /** The word the section intro uses for a sitting: a ride, or a test. */
  itemNoun: string;
  /** Whole-track estimate, for the stat chips. */
  minutes: number;
  /** The third chip on the hero: the track's character in two words. */
  character: string;
  subjects: Subject[];
  /**
   * The subjects a placement decision may rest on. Everything else in the
   * track is recorded as an observation.
   */
  readingSubjects: Subject[];
}

export const TRACKS: Record<Track, TrackConfig> = {
  'little-reader': {
    id: 'little-reader',
    name: 'Little Readers',
    kicker: 'Welcome to the park',
    lead: 'Step right up! Pick a ride and show off your reading superpowers!',
    cta: 'Enter the Park!',
    unit: 'Activity',
    unitPlural: 'Activities',
    itemNoun: 'ride',
    minutes: 15,
    character: 'Fun & Easy',
    subjects: [
      'find-the-same',
      'match-making',
      'spot-the-difference',
      'shapes-colors',
      'number-fun',
      'letter-sounds',
      'word-practice',
    ],
    // The two that are actually reading; the rest are readiness.
    readingSubjects: ['letter-sounds', 'word-practice'],
  },
  'grade-level': {
    id: 'grade-level',
    name: 'Grade Level',
    /*
     * Straight language, on purpose. A ten-year-old being told they are
     * ascending a tower of wisdom knows they are being managed, and the
     * sentence has to be decoded before it says anything true. Say what the
     * thing is: seven sections, they get harder, that is how we find the
     * level. The whimsy belongs in Little Readers, where the child is four.
     */
    kicker: 'Before you start',
    lead: 'Seven short sections. They get harder while you’re doing well — that’s how we find where you are.',
    cta: 'Let’s begin',
    unit: 'Section',
    unitPlural: 'Sections',
    itemNoun: 'section',
    minutes: 30,
    character: 'Adaptive',
    subjects: [
      'words-speaking',
      'oral-reading',
      'vocabulary',
      'reading-comprehension',
      'spelling',
      'sentence-writing',
      'math',
    ],
    readingSubjects: ['oral-reading', 'reading-comprehension'],
  },
};

/**
 * WHICH TRACK — CONFIG. PENDING TEACHER SIGN-OFF.
 *
 * Age chooses. Six and under sit Little Readers, which lines up
 * with Grade 1 and below; seven and up sit Grade Level. The
 * boundary is here, in one place, because it is a judgement about children
 * rather than a fact about code.
 */
export const LITTLE_READER_MAX_AGE = 6;

/** Grades that fall to Little Reader when the account has no age. */
const LITTLE_READER_GRADES = ['EL', 'JK', 'SK', '1'];

/**
 * Age decides. Grade is the fallback for an account that never captured an
 * age — a guess from grade beats putting a five-year-old through the full
 * Grade Level set.
 */
export function trackFor(age: number | null, grade: string | null): Track {
  if (age !== null) return age <= LITTLE_READER_MAX_AGE ? 'little-reader' : 'grade-level';
  if (grade !== null && LITTLE_READER_GRADES.includes(grade)) return 'little-reader';
  return 'grade-level';
}

export function subjectsForTrack(track: Track): Subject[] {
  return TRACKS[track].subjects;
}

export function trackOf(subject: Subject): Track {
  return TRACKS['little-reader'].subjects.includes(subject) ? 'little-reader' : 'grade-level';
}
