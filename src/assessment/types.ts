import type { GlyphName } from '../components/glyphs';
import type { Grade, Tier } from './tiers';
import { gradeTier } from './tiers';
import type { AgeBand } from './intake';
import type { Subject } from './subjects';
import { SUBJECT_ORDER } from './subjects';
import type { GateOutcome } from './gate';
import type { ReadingSubSkill, SubSkillResult } from './readingSkills';

export type { Tier };
export { MIN_TIER, MAX_TIER, TIERS, clampTier, tierGradeLabel } from './tiers';

export type { Grade };
export { GRADES, GRADE_LABEL, GRADE_SHORT, isPreGrade1, gradeTier, gapFor, isWithinOneGrade, isMoreThanOneGradeBehind } from './tiers';

/** Everything before Grade 1 is tier 0, Grade n is tier n. A normal sitting starts here. */
export function startTierForGrade(grade: Grade): Tier {
  return gradeTier(grade);
}

export type { AgeBand };
export { ageBandForAge, hasAgeGradeMismatch, ageGradeOffset, MIN_AGE, MAX_AGE } from './intake';

export type { Subject };
export { SUBJECT_ORDER, SUBJECT_LABEL } from './subjects';

export type { ReadingSubSkill, SubSkillResult };
export {
  READING_SUB_SKILLS,
  READING_SUB_SKILL_LABEL,
  QUESTIONS_PER_SUB_SKILL,
  SUB_SKILL_STABILITY_WINDOW,
} from './readingSkills';

/**
 * Every child sits all four subjects, in this order, whatever their grade and
 * whatever the earlier sittings say. Nobody is stopped early: a result we did
 * not gather is a result a teacher cannot look at.
 */
export function subjectsForGrade(_grade: Grade): Subject[] {
  return SUBJECT_ORDER;
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
  /** Reading items belong to one of the four reading sub-skills. */
  subSkill?: ReadingSubSkill;
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
  /**
   * Age in years. Drives PRESENTATION only: read-aloud default, art-led vs
   * text-led layout, tone, session length. It never touches placement.
   */
  age: number;
  /**
   * Grade. Drives PLACEMENT only: every "grades behind" figure and the Core
   * Skills band are measured against it.
   */
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
 * One sitting assesses ONE subject. Every child sits four: reading, then
 * spelling, then writing, then math, as separate resumable sessions.
 */
export interface SessionState {
  grade: Grade;
  subject: Subject;
  /** Set for a reading sub-skill sitting; the selector then stays inside it. */
  subSkill?: ReadingSubSkill;
  /** Length and early-stop window for this sitting. */
  maxQuestions: number;
  stabilityWindow: number;
  currentTier: Tier;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  questionsAnswered: AnsweredQuestion[];
  /** The session tier after each answer — the stop rule reads this. */
  tierHistory: Tier[];
  /** Ids already served, so the engine never repeats an item. */
  servedQuestionIds: string[];
  /**
   * Floored sitting: this child's reading gated, so the sitting starts at the
   * lowest tier and only ever branches upward. Everything it produces is an
   * observation, not a measure.
   */
  floored: boolean;
  startedAt: number;
  finishedAt?: number;
}

/** What one completed subject session yields. Stored between sessions. */
export interface SubjectResult {
  subject: Subject;
  /** The placement for this subject. Internal — never rendered raw. For
   *  reading this is DERIVED from the sub-skills, see readingSkills.ts. */
  finalTier: Tier;
  /** Reading only: the four sub-skill results, in sitting order. */
  subSkills?: SubSkillResult[];
  /** True when the sitting was floored — see SessionState.floored. */
  floored: boolean;
  questionsAnswered: number;
  durationMs: number;
  completedAt: number;
  history: AnsweredQuestion[];
}

export interface SubjectPlacement {
  subject: Subject;
  finalTier: Tier;
  /** Assessed tier minus grade tier. Negative is behind. Internal. */
  gap: number;
  gradeEquivalentDisplay: string;
  questionsAnswered: number;
  /**
   * True when this result did not move the placement decision — either the
   * gate stopped before reading it, or the sitting was floored. Downstream
   * views MUST NOT present a non-determining result as a measured level.
   */
  nonDetermining: boolean;
  floored: boolean;
  /** Reading only: per sub-skill, for the expandable row. */
  subSkills?: SubSkillPlacement[];
}

export interface SubSkillPlacement {
  subSkill: ReadingSubSkill;
  finalTier: Tier;
  gradeEquivalentDisplay: string;
}

/** The one program the child is placed into, once every subject is done.
 *  Parent-facing language only — the tier number stays internal. */
export interface ProgramPlacement {
  name: string;
  gradeEquivalentDisplay: string;
  description: string;
  /** Which gate rule fired, 1–5. Internal, for teacher review. */
  gateStep: number;
  outcome: GateOutcome;
}

export interface PlacementResult {
  grade: Grade;
  age: number | null;
  /** Age and grade disagree by two years or more. Shown for teacher review. */
  ageGradeMismatch: boolean;
  /** Subjects assessed, in sitting order. Always all four. */
  requiredSubjects: Subject[];
  /** Only the subjects actually completed so far. */
  subjects: SubjectPlacement[];
  /** The subject the next session assesses, or null when everything is done. */
  nextSubject: Subject | null;
  complete: boolean;
  /** Set only when every subject is done. */
  program: ProgramPlacement | null;
  /** True when reading came in below a Grade 3 level. */
  readingGated: boolean;
  /**
   * Math content level, set by GRADE placement, never by assessed math. The
   * assessed math tier only feeds gate step 4.
   */
  mathContentLevel: Tier;
  questionsAnswered: number;
  durationMs: number;
}
