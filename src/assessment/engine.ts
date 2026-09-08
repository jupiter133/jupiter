import type {
  AnsweredQuestion,
  Grade,
  PlacementResult,
  ProgramPlacement,
  Question,
  SessionState,
  Subject,
  SubjectPlacement,
  SubjectState,
  Tier,
} from './types';
import { MAX_TIER, MIN_TIER, SUBJECT_ORDER } from './types';
import { QUESTIONS } from './questionBank';

/**
 * Session length. Each strand gets a fixed number of questions so the total run
 * time is predictable — roughly five minutes at ~14s per item. Length is fixed
 * rather than cut short on a stable tier, because a consistent sitting is worth
 * more here than shaving a question off.
 */
export const QUESTIONS_PER_SUBJECT = 7;
export const TOTAL_QUESTIONS = QUESTIONS_PER_SUBJECT * SUBJECT_ORDER.length;
/** Consecutive answers needed to move a tier, within a subject. */
export const STREAK_TO_MOVE = 2;

/** Where a child starts, by the grade the parent stated. Kindergarten–1 start at
 *  the foundation tier, 2–4 mid, 5–6 at the top. The engine moves them from there
 *  within a couple of questions if the start was wrong. */
const GRADE_START_TIER: Record<Grade, Tier> = {
  K: 1,
  '1': 1,
  '2': 2,
  '3': 2,
  '4': 2,
  '5': 3,
  '6': 3,
};

export function startTierForGrade(grade: Grade): Tier {
  return GRADE_START_TIER[grade];
}

function freshSubjectState(tier: Tier): SubjectState {
  return {
    currentTier: tier,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    answeredCount: 0,
    tierHistory: [],
  };
}

export function createSession(grade: Grade, now: number = Date.now()): SessionState {
  const startTier = startTierForGrade(grade);
  return {
    grade,
    subjectIndex: 0,
    subjects: {
      reading: freshSubjectState(startTier),
      math: freshSubjectState(startTier),
      writing: freshSubjectState(startTier),
    },
    questionsAnswered: [],
    startedAt: now,
    servedQuestionIds: [],
  };
}

function clampTier(tier: number): Tier {
  return Math.min(MAX_TIER, Math.max(MIN_TIER, tier)) as Tier;
}

export function currentSubject(state: SessionState): Subject | null {
  return SUBJECT_ORDER[state.subjectIndex] ?? null;
}

/**
 * Picks the next unserved question in the active subject, preferring that
 * subject's current tier. If the tier is exhausted it walks outward to the
 * nearest tier with items left, so a short placeholder bank can never dead-end
 * the flow. Never crosses into another subject.
 */
export function selectNextQuestion(state: SessionState): Question | null {
  const subject = currentSubject(state);
  if (subject === null) return null;

  const tier = state.subjects[subject].currentTier;
  const served = new Set(state.servedQuestionIds);

  const candidates = QUESTIONS.filter((q) => q.subject === subject && !served.has(q.id)).sort(
    (a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier),
  );
  return candidates[0] ?? null;
}

/** True once the active subject has had its full allotment of questions. */
export function isSubjectComplete(state: SessionState, subject: Subject): boolean {
  if (state.subjects[subject].answeredCount >= QUESTIONS_PER_SUBJECT) return true;
  // Guard against a bank too small to fill the allotment.
  const served = new Set(state.servedQuestionIds);
  return !QUESTIONS.some((q) => q.subject === subject && !served.has(q.id));
}

export function isSessionComplete(state: SessionState): boolean {
  return currentSubject(state) === null;
}

/**
 * Applies one answer and returns the next session state.
 *
 * Branching, scoped to the active subject: two correct in a row moves that
 * subject up a tier, two incorrect moves it down. Either move resets both
 * streaks, so a fresh pair is needed at the new tier before moving again. When a
 * subject uses up its allotment the session advances to the next strand.
 */
export function submitAnswer(
  state: SessionState,
  question: Question,
  selectedAnswerId: string,
  now: number = Date.now(),
): SessionState {
  const subject = question.subject;
  const prevSubject = state.subjects[subject];
  const wasCorrect = selectedAnswerId === question.correctAnswerId;
  const lastAnsweredAt =
    state.questionsAnswered[state.questionsAnswered.length - 1]?.answeredAt ?? state.startedAt;

  const record: AnsweredQuestion = {
    questionId: question.id,
    subject,
    tier: question.tier,
    selectedAnswerId,
    wasCorrect,
    answeredAt: now,
    elapsedMs: Math.max(0, now - lastAnsweredAt),
  };

  let consecutiveCorrect = wasCorrect ? prevSubject.consecutiveCorrect + 1 : 0;
  let consecutiveIncorrect = wasCorrect ? 0 : prevSubject.consecutiveIncorrect + 1;
  let currentTier = prevSubject.currentTier;

  if (consecutiveCorrect >= STREAK_TO_MOVE) {
    currentTier = clampTier(currentTier + 1);
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
  } else if (consecutiveIncorrect >= STREAK_TO_MOVE) {
    currentTier = clampTier(currentTier - 1);
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
  }

  const nextSubjectState: SubjectState = {
    currentTier,
    consecutiveCorrect,
    consecutiveIncorrect,
    answeredCount: prevSubject.answeredCount + 1,
    tierHistory: [...prevSubject.tierHistory, currentTier],
  };

  const next: SessionState = {
    ...state,
    subjects: { ...state.subjects, [subject]: nextSubjectState },
    questionsAnswered: [...state.questionsAnswered, record],
    servedQuestionIds: [...state.servedQuestionIds, question.id],
  };

  if (isSubjectComplete(next, subject)) {
    next.subjectIndex = state.subjectIndex + 1;
  }

  return isSessionComplete(next) ? { ...next, finishedAt: now } : next;
}

/** Parent-facing placement language, per strand.
 *  Deliberately never exposes the tier number. */
const PLACEMENT: Record<
  Subject,
  Record<Tier, { gradeEquivalentDisplay: string; recommendedStartingModule: string; summary: string }>
> = {
  reading: {
    1: {
      gradeEquivalentDisplay: 'Grade K–1 level',
      recommendedStartingModule: 'Trailhead Reading: Sounds, Sight Words & First Stories',
      summary:
        'Decoding words and pulling simple facts out of a short story. Starting here keeps every lesson winnable, which is what rebuilds confidence.',
    },
    2: {
      gradeEquivalentDisplay: 'Grade 2–3 level',
      recommendedStartingModule: 'Ridge Trail Reading: Context Clues & Story Details',
      summary:
        'Reads short passages comfortably and finds details in them. The next step is inference — what a story implies rather than states.',
    },
    3: {
      gradeEquivalentDisplay: 'Grade 4–6 level',
      recommendedStartingModule: 'Summit Path Reading: Inference & Main Idea',
      summary:
        'Handles longer passages and reasons about why things happen. This track pushes into main idea, author’s purpose and richer vocabulary.',
    },
  },
  math: {
    1: {
      gradeEquivalentDisplay: 'Grade K–1 level',
      recommendedStartingModule: 'Trailhead Math: Counting, Adding & Shapes',
      summary:
        'Working with numbers to twenty and basic shapes. Short daily practice on number facts is the fastest lever here.',
    },
    2: {
      gradeEquivalentDisplay: 'Grade 2–3 level',
      recommendedStartingModule: 'Ridge Trail Math: Times Tables, Fractions & Word Problems',
      summary:
        'Confident with multi-digit addition and starting on multiplication. Fluency with times tables unlocks most of what comes next.',
    },
    3: {
      gradeEquivalentDisplay: 'Grade 4–6 level',
      recommendedStartingModule: 'Summit Path Math: Fractions, Decimals & Multi-Step Problems',
      summary:
        'Handles multi-step problems and fraction reasoning. This track moves into decimals, ratios and problems with more than one operation.',
    },
  },
  writing: {
    1: {
      gradeEquivalentDisplay: 'Grade K–1 level',
      recommendedStartingModule: 'Trailhead Writing: Capitals, Periods & Simple Sentences',
      summary:
        'Building sentences with correct capitals and end punctuation. This is the foundation everything else in writing sits on.',
    },
    2: {
      gradeEquivalentDisplay: 'Grade 2–3 level',
      recommendedStartingModule: 'Ridge Trail Writing: Complete Sentences & Word Choice',
      summary:
        'Writes complete sentences and is starting to punctuate lists and dialogue. Next is variety — joining ideas and choosing sharper words.',
    },
    3: {
      gradeEquivalentDisplay: 'Grade 4–6 level',
      recommendedStartingModule: 'Summit Path Writing: Paragraph Structure & Editing',
      summary:
        'Combines ideas and spots run-ons. This track works on paragraph organization, precise language and editing their own drafts.',
    },
  },
};

/**
 * The three programs. A child is placed into exactly one, decided by the
 * average tier across strands; inside the program each strand is paced to
 * the child's own level, which is what the per-strand breakdown is for.
 */
const PROGRAMS: Record<Tier, Omit<ProgramPlacement, 'tier'>> = {
  1: {
    name: 'Trailhead',
    gradeEquivalentDisplay: 'Grade K–1 level',
    description:
      'Our foundations program: letters and sounds, numbers to twenty, and first sentences. Short daily lessons that keep every step winnable.',
  },
  2: {
    name: 'Ridge Trail',
    gradeEquivalentDisplay: 'Grade 2–3 level',
    description:
      'Our core program: reading for detail, times tables and fractions, and writing complete sentences. Lessons build in inference and word choice.',
  },
  3: {
    name: 'Summit Path',
    gradeEquivalentDisplay: 'Grade 4–6 level',
    description:
      'Our junior program: main idea and author’s purpose, multi-step problems and decimals, and paragraph structure and editing.',
  },
};

export function buildResult(state: SessionState): PlacementResult {
  const finishedAt = state.finishedAt ?? Date.now();

  const subjects: SubjectPlacement[] = SUBJECT_ORDER.map((subject) => {
    const tier = state.subjects[subject].currentTier;
    return {
      subject,
      finalTier: tier,
      questionsAnswered: state.subjects[subject].answeredCount,
      ...PLACEMENT[subject][tier],
    };
  });

  // Overall placement is the average across strands, rounded to the nearest tier.
  const averageTier = clampTier(
    Math.round(subjects.reduce((sum, s) => sum + s.finalTier, 0) / subjects.length),
  );
  const strongest = subjects.reduce((a, b) => (b.finalTier > a.finalTier ? b : a));
  const weakest = subjects.reduce((a, b) => (b.finalTier < a.finalTier ? b : a));

  const program: ProgramPlacement = { tier: averageTier, ...PROGRAMS[averageTier] };

  return {
    finalTier: averageTier,
    gradeEquivalentDisplay: program.gradeEquivalentDisplay,
    recommendedStartingModule: program.name,
    program,
    profile: {
      even: strongest.finalTier === weakest.finalTier,
      strongest: strongest.subject,
      weakest: weakest.subject,
    },
    subjects,
    questionsAnswered: state.questionsAnswered.length,
    durationMs: Math.max(0, finishedAt - state.startedAt),
    history: state.questionsAnswered,
  };
}

