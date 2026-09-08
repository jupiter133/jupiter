import type { GlyphName } from '../components/glyphs';

/** Difficulty tiers for v1. Tier data ships in the content JSON; these are the
 *  only three tiers the placement engine knows about. */
export type Tier = 1 | 2 | 3;

export const TIERS: Tier[] = [1, 2, 3];
export const MIN_TIER: Tier = 1;
export const MAX_TIER: Tier = 3;

export type Grade = 'K' | '1' | '2' | '3' | '4' | '5' | '6';

/**
 * How a question is *presented*, derived from the grade the parent entered.
 * This is a separate axis from difficulty tier: a Grade 5 child who drops to
 * tier 1 still gets the senior presentation, because a struggling ten-year-old
 * should not be handed cartoon bunnies.
 *
 * - `junior`  (K–3): art-led, big type, simplest wording, picture answers.
 * - `senior`  (4–6): text-led, art supports rather than carries, fuller wording.
 */
export type AgeBand = 'junior' | 'senior';

const JUNIOR_GRADES: Grade[] = ['K', '1', '2', '3'];

export function ageBandForGrade(grade: Grade): AgeBand {
  return JUNIOR_GRADES.includes(grade) ? 'junior' : 'senior';
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

/** The three strands assessed in v1. Order here is the order they are asked. */
export type Subject = 'reading' | 'math' | 'writing';

export const SUBJECT_ORDER: Subject[] = ['reading', 'math', 'writing'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  reading: 'Reading',
  math: 'Math',
  writing: 'Writing',
};

export interface AnswerOption {
  id: string;
  text: string;
  /** Picture answer. Rendered for the junior band; hidden for senior. */
  art?: ArtSpec;
}

export interface Question {
  id: string;
  subject: Subject;
  tier: Tier;
  /** Fine-grained content tag, e.g. "vocabulary", "word-problem", "conventions". */
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
   *  to the parent on the results screen so pacing advice can account for it. */
  learningChallenges: string;
}

export interface AnsweredQuestion {
  questionId: string;
  subject: Subject;
  tier: Tier;
  selectedAnswerId: string;
  /** Recorded for later analysis. Never rendered to the child mid-session. */
  wasCorrect: boolean;
  answeredAt: number;
  /** ms spent on this single item. */
  elapsedMs: number;
}

/** Independent branching state for one subject. A child can sit at a different
 *  tier in math than in reading, and each strand moves on its own streaks. */
export interface SubjectState {
  currentTier: Tier;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  answeredCount: number;
  tierHistory: Tier[];
}

export interface SessionState {
  grade: Grade;
  /** Index into SUBJECT_ORDER. */
  subjectIndex: number;
  subjects: Record<Subject, SubjectState>;
  questionsAnswered: AnsweredQuestion[];
  startedAt: number;
  /** Ids already served, so the engine never repeats an item. */
  servedQuestionIds: string[];
  finishedAt?: number;
}

export interface SubjectPlacement {
  subject: Subject;
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  recommendedStartingModule: string;
  summary: string;
  questionsAnswered: number;
}

/** Shape of the result across strands, as data rather than prose.
 *  The engine has no business writing sentences about a child by name. */
export interface StrandProfile {
  /** True when every strand landed on the same tier. */
  even: boolean;
  strongest: Subject;
  weakest: Subject;
}

export interface PlacementResult {
  /** Rounded average across strands — drives the overall starting point. */
  finalTier: Tier;
  gradeEquivalentDisplay: string;
  /** Overall track name, e.g. "Trailhead". */
  recommendedStartingModule: string;
  profile: StrandProfile;
  subjects: SubjectPlacement[];
  questionsAnswered: number;
  durationMs: number;
  history: AnsweredQuestion[];
}
