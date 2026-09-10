import type { GlyphName } from '../components/glyphs';
import type { Tier } from './tiers';

export type { Tier };
export { MIN_TIER, MAX_TIER, TIERS, clampTier, tierGradeLabel } from './tiers';

export type Grade = 'K' | '1' | '2' | '3' | '4' | '5' | '6';

export const GRADES: Grade[] = ['K', '1', '2', '3', '4', '5', '6'];

/** Grade K is tier 0, Grade n is tier n. The session starts here. */
export function startTierForGrade(grade: Grade): Tier {
  return grade === 'K' ? 0 : Number(grade);
}

/**
 * How a question is *presented*, derived from the child's grade.
 *
 * A separate axis from difficulty tier: a Grade 5 child who drops to tier 1
 * still gets the senior presentation, because a struggling ten-year-old should
 * not be handed cartoon bunnies.
 *
 * - `junior` (K–3): art-led, big type, simplest wording, picture answers,
 *   read-aloud on by default.
 * - `senior` (4–6): text-led, art supports rather than carries, fuller wording,
 *   read-aloud available but off by default.
 */
export type AgeBand = 'junior' | 'senior';

const JUNIOR_GRADES: Grade[] = ['K', '1', '2', '3'];

export function ageBandForGrade(grade: Grade): AgeBand {
  return JUNIOR_GRADES.includes(grade) ? 'junior' : 'senior';
}

export type Subject = 'reading' | 'math' | 'writing';

export const SUBJECT_ORDER: Subject[] = ['reading', 'math', 'writing'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  reading: 'Reading',
  math: 'Math',
  writing: 'Writing',
};

/**
 * Which subjects a grade is assessed on, in the order they are sat.
 *
 * K–3 is reading only. Math and writing are never served below Grade 4: a
 * seven-year-old's writing score would measure handwriting stamina and reading
 * ability, not writing, and placing on it would be worse than not placing.
 */
export function subjectsForGrade(grade: Grade): Subject[] {
  return ageBandForGrade(grade) === 'junior' ? ['reading'] : ['reading', 'math', 'writing'];
}

export type SceneName =
  | 'lost-mitten'
  | 'camp-breakfast'
  | 'compass'
  | 'aurora'
  | 'ice-road'
  | 'two-maps'
  | 'bear-cubs'
  | 'narrow-trail'
  | 'trail-guide'
  | 'pack-list'
  | 'wind-out'
  | 'moose'
  | 'canoe';

/** Declarative illustration spec. Content stays in JSON; drawing stays in code. */
export type ArtSpec =
  | { kind: 'glyph'; glyph: GlyphName }
  | { kind: 'count'; glyph: GlyphName; n: number }
  | { kind: 'countPlus'; glyph: GlyphName; n: number; m: number }
  | { kind: 'countTakeAway'; glyph: GlyphName; n: number; takeAway: number }
  | { kind: 'shape'; shape: 'triangle' | 'square' | 'circle' | 'rectangle' }
  | { kind: 'fraction'; n: number; d: number }
  | { kind: 'areaGrid'; w: number; h: number }
  | { kind: 'pair'; left: GlyphName; right: GlyphName }
  | { kind: 'scene'; scene: SceneName };

export interface AnswerOption {
  id: string;
  text: string;
  /** Picture answer. Rendered for the junior band; hidden for senior. */
  art?: ArtSpec;
}

export interface Question {
  id: string;
  subject: Subject;
  /** 0 (Kindergarten) to 8 (Grade 8). */
  tier: Tier;
  /** Fine-grained content tag, e.g. "letter-sound", "main-idea", "fractions". */
  skill: string;
  /** Present on comprehension items — rendered beside the question. */
  passage?: string;
  passageTitle?: string;
  /** Illustration for the item. Leads the layout for junior, supports for senior. */
  art?: ArtSpec;
  /** Default wording, used as-is for the senior band. */
  questionText: string;
  /** Shorter, plainer wording for the junior band. Falls back to questionText. */
  questionTextJunior?: string;
  options: AnswerOption[];
  correctAnswerId: string;
}

/** Resolves the wording to show for a band. */
export function questionTextFor(question: Question, band: AgeBand): string {
  if (band === 'junior' && question.questionTextJunior) return question.questionTextJunior;
  return question.questionText;
}

export interface ParentContext {
  /** Child's first name. Optional — every screen degrades gracefully without it. */
  childName: string;
  grade: Grade;
  /** Optional, self-reported. Never used to gate content — only surfaced back
   *  to the parent so pacing advice can account for it. */
  learningChallenges: string;
}

export interface AnsweredQuestion {
  questionId: string;
  subject: Subject;
  /** The tier the question came from. */
  tier: Tier;
  selectedAnswerId: string;
  /** Recorded for later analysis. Never rendered to the child mid-session. */
  wasCorrect: boolean;
  answeredAt: number;
  /** ms spent on this single item. */
  elapsedMs: number;
}

/**
 * One sitting assesses ONE subject. K–3 sit reading and are done; Grade 4–6 sit
 * reading, then math, then writing as separate resumable sessions.
 */
export interface SessionState {
  grade: Grade;
  subject: Subject;
  currentTier: Tier;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  questionsAnswered: AnsweredQuestion[];
  /** The session tier after each answer — the stop rule reads this. */
  tierHistory: Tier[];
  /** Ids already served, so the engine never repeats an item. */
  servedQuestionIds: string[];
  startedAt: number;
  finishedAt?: number;
}

/** What one completed subject session yields. Stored between sessions. */
export interface SubjectResult {
  subject: Subject;
  /** The placement for this subject. Internal — never rendered raw. */
  finalTier: Tier;
  questionsAnswered: number;
  durationMs: number;
  completedAt: number;
  history: AnsweredQuestion[];
}

export interface SubjectPlacement {
  subject: Subject;
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  questionsAnswered: number;
}

/** The one program the child is placed into, once every required subject is
 *  done. Parent-facing language only — the tier number stays internal. */
export interface ProgramPlacement {
  tier: Tier;
  name: string;
  gradeEquivalentDisplay: string;
  description: string;
}

export interface PlacementResult {
  grade: Grade;
  /** Subjects this grade is assessed on, in sitting order. */
  requiredSubjects: Subject[];
  /** Only the subjects actually completed. K–3 has one entry; the parent view
   *  iterates this, so empty math / writing slots can never render. */
  subjects: SubjectPlacement[];
  /** The subject the next session assesses, or null when everything is done. */
  nextSubject: Subject | null;
  complete: boolean;
  /** Set only when every required subject is done. */
  program: ProgramPlacement | null;
  /** Rounded average across completed subjects. Internal. */
  finalTier: Tier;
  questionsAnswered: number;
  durationMs: number;
}
