import { describe, expect, it } from 'vitest';
import {
  DRAG_QUESTION_POSITION,
  STABILITY_WINDOW,
  buildResult,
  createSession,
  isTierStable,
  selectNextQuestion,
  submitAnswer,
  toSubjectResult,
} from './engine';
import { QUESTIONS, BANK_HAS_TEMPLATE_ITEMS } from './questionBank';
import { deriveReadingLevel, readingBottleneck, readingSubjectsFor } from './readingLevel';
import { QUESTIONS_PER_SUBJECT } from './sessionMeta';
import { SPEECH_SCORING_IS_STUB } from './speechScoring';
import type { Grade, SessionState, Subject, SubjectResult, Track } from './types';
import {
  MAX_TIER,
  MIN_TIER,
  TRACKS,
  ageBandForAge,
  startTierForGrade,
  subjectsForTrack,
  trackFor,
  tierGradeLabel,
  heardTextFor,
  isDraggedQuestion,
  correctOrderFor,
  isListenQuestion,
  isMatchQuestion,
  isNumberQuestion,
  isPairQuestion,
  isOrderQuestion,
  isSpokenQuestion,
  isWriteQuestion,
  isStudyQuestion,
} from './types';

/** Every subject in the product, both tracks, in sitting order. */
const EVERY_SUBJECT: Subject[] = [
  ...subjectsForTrack('little-reader'),
  ...subjectsForTrack('grade-level'),
];

function answer(state: SessionState, correct: boolean, at?: number): SessionState {
  const q = selectNextQuestion(state)!;
  // A spoken item is answered by speaking, and nothing scores it yet.
  if (isSpokenQuestion(q)) return submitAnswer(state, q, 'spoken', at, { scored: false });
  // A written item is marked by the rubric, not by an answer key.
  if (isWriteQuestion(q)) {
    return submitAnswer(state, q, 'written', at, { correct, writtenAnswer: 'A sentence.' });
  }
  if (isOrderQuestion(q)) {
    const right = correctOrderFor(q);
    const built = correct ? right : [...right].reverse();
    return submitAnswer(state, q, built.join('-'), at);
  }
  // A typed number has no options to pick a wrong one from.
  if (isNumberQuestion(q)) {
    return submitAnswer(state, q, correct ? q.correctAnswerId : `${q.correctAnswerId}0`, at);
  }
  const wrong = q.options.find((o) => o.id !== q.correctAnswerId)!.id;
  return submitAnswer(state, q, correct ? q.correctAnswerId : wrong, at);
}

/** Runs a whole subject sitting with a fixed answer pattern. */
function sit(
  grade: Grade,
  subject: Subject,
  correctAt: (i: number) => boolean,
  floored = false,
): SessionState {
  let s = createSession(grade, subject, { floored }, 0);
  let i = 0;
  while (!s.finishedAt) {
    i += 1;
    s = answer(s, correctAt(i), i * 10_000);
  }
  return s;
}

const ALL_GRADES: Grade[] = ['EL', 'JK', 'SK', '1', '2', '3', '4', '5', '6'];

describe('tracks and bands', () => {
  it('sends six and under to Little Readers and everyone older to the tower', () => {
    expect(trackFor(5, '1')).toBe('little-reader');
    expect(trackFor(6, '1')).toBe('little-reader');
    expect(trackFor(7, '1')).toBe('grade-level');
    expect(trackFor(11, '5')).toBe('grade-level');
  });

  it('falls back to grade only when the account never captured an age', () => {
    expect(trackFor(null, 'SK')).toBe('little-reader');
    expect(trackFor(null, '1')).toBe('little-reader');
    expect(trackFor(null, '2')).toBe('grade-level');
    expect(trackFor(null, null)).toBe('grade-level');
  });

  it('gives each track seven sittings, in the design’s order', () => {
    expect(subjectsForTrack('little-reader')).toEqual([
      'find-the-same',
      'match-making',
      'spot-the-difference',
      'shapes-colors',
      'number-fun',
      'letter-sounds',
      'word-practice',
    ]);
    expect(subjectsForTrack('grade-level')).toEqual([
      'words-speaking',
      'oral-reading',
      'vocabulary',
      'reading-comprehension',
      'spelling',
      'sentence-writing',
      'math',
    ]);
  });

  it('keeps the two tracks disjoint, so no subject belongs to both', () => {
    const little = new Set<Subject>(subjectsForTrack('little-reader'));
    expect(subjectsForTrack('grade-level').some((s) => little.has(s))).toBe(false);
  });

  it('rests each track’s decision only on subjects that track actually sits', () => {
    for (const track of ['little-reader', 'grade-level'] as Track[]) {
      const sat = new Set<Subject>(subjectsForTrack(track));
      for (const subject of readingSubjectsFor(track)) expect(sat.has(subject), subject).toBe(true);
    }
  });

  it('bands presentation on age, not grade', () => {
    expect(ageBandForAge(6)).toBe('junior');
    expect(ageBandForAge(8)).toBe('junior');
    expect(ageBandForAge(9)).toBe('senior');
    expect(ageBandForAge(13)).toBe('senior');
  });
});

describe('question bank', () => {
  it('covers every tier from K through Grade 8 in every subject', () => {
    for (const subject of EVERY_SUBJECT) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
        expect(n, `${subject} tier ${tier}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('makes every vocabulary item a study item with both halves and a key', () => {
    const items = QUESTIONS.filter((q) => q.subject === 'vocabulary');
    expect(items.length).toBeGreaterThan(0);
    for (const q of items) {
      expect(isStudyQuestion(q), q.id).toBe(true);
      expect(q.studyWord, q.id).toBeTruthy();
      expect(q.studyMeaning, q.id).toBeTruthy();
      // The question is answered normally, so it still needs a valid key.
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });

  it('never writes a heard word anywhere a child could read it', () => {
    // The whole spelling item is that the word is heard and not seen. If it
    // appears in the question text, the child is proofreading, not spelling.
    // Spelling's heard WORD: the sentence-writing item is checked separately.
    const listen = QUESTIONS.filter((q) => isListenQuestion(q) && q.listenWord);
    expect(listen.length).toBeGreaterThan(0);
    for (const q of listen) {
      const word = (q.listenWord ?? '').toLowerCase();
      const onScreen = [q.questionText, q.questionTextJunior ?? '', q.passage ?? ''].join(' ');
      expect(onScreen.toLowerCase().includes(word), `${q.id}: ${q.questionText}`).toBe(false);
      // Exactly one option spells it, and it is the key.
      const spellings = q.options.filter((o) => o.text.toLowerCase() === word);
      expect(spellings, q.id).toHaveLength(1);
      expect(spellings[0].id, q.id).toBe(q.correctAnswerId);
    }
  });

  it('gives every heard word four distinct spellings to choose from', () => {
    for (const q of QUESTIONS.filter((q) => isListenQuestion(q) && q.listenWord)) {
      const texts = q.options.map((o) => o.text);
      // A distractor that is the answer with padding, or a repeat, is not a
      // choice at all — it just makes the item look harder than it is.
      expect(new Set(texts.map((t) => t.trim().toLowerCase())).size, q.id).toBe(texts.length);
      for (const t of texts) expect(t.trim(), q.id).toBe(t);
      expect(texts.length, q.id).toBe(4);
    }
  });

  it('never shows the same passage in two different subjects', () => {
    // A child sits Oral Reading and then Reading Comprehension in one
    // assessment. Reading the same text twice makes the second sitting a
    // memory check and the first one a rehearsal, and neither measures what
    // it claims to.
    const seen = new Map<string, string>();
    for (const q of QUESTIONS) {
      const text = (q.spokenPassage ?? q.passage ?? '').trim().toLowerCase();
      if (!text) continue;
      const previous = seen.get(text);
      expect(previous, `${q.id} repeats the passage from ${previous}`).toBeUndefined();
      seen.set(text, q.id);
    }
  });

  it('never reuses a passage title across subjects either', () => {
    // Different words under the same heading still read as the same piece to
    // a child, and to a teacher reviewing the session.
    const titles = new Map<string, string>();
    for (const q of QUESTIONS) {
      const title = (q.passageTitle ?? '').trim().toLowerCase();
      if (!title) continue;
      const previous = titles.get(title);
      expect(previous, `${q.id} reuses the title of ${previous}`).toBeUndefined();
      titles.set(title, q.id);
    }
  });

  it('never gives the answer away by word-matching', () => {
    // A question may use the studied word — "What is deteriorating?" is a fair
    // question and unanswerable without the meaning. What it must not do is
    // let a child match letters: if the correct option is the only one echoed
    // in the question text, the word can be picked without understanding it.
    for (const q of QUESTIONS.filter(isStudyQuestion)) {
      const asked = q.questionText.toLowerCase();
      const echoed = q.options.filter((o) => asked.includes(o.text.toLowerCase()));
      const giveaway =
        echoed.length === 1 && echoed[0].id === q.correctAnswerId;
      expect(giveaway, `${q.id}: ${q.questionText}`).toBe(false);
    }
  });

  it('gives every subject one format, all the way through', () => {
    // A sitting that mixed formats — a mic screen then tapped options, or a
    // heard word then a written one — would be incoherent, and a leftover
    // item in the wrong format silently shadows the new bank. The bank is
    // where that guarantee has to hold.
    const shape: Record<string, (q: (typeof QUESTIONS)[number]) => boolean> = {
      'words-speaking': isSpokenQuestion,
      'oral-reading': isSpokenQuestion,
      vocabulary: isStudyQuestion,
      'reading-comprehension': isStudyQuestion,
      spelling: isListenQuestion,
    };
    for (const [subject, isRight] of Object.entries(shape)) {
      const items = QUESTIONS.filter((q) => q.subject === subject);
      expect(items.length, subject).toBeGreaterThan(0);
      const wrong = items.filter((q) => !isRight(q)).map((q) => q.id);
      expect(wrong, `${subject} has items in the wrong format`).toEqual([]);
    }
  });

  it('holds at least six items per tier in the two reading subjects', () => {
    const tapped = [...readingSubjectsFor('little-reader'), ...readingSubjectsFor('grade-level')]
      .filter((s) => !QUESTIONS.filter((q) => q.subject === s).every(isSpokenQuestion));
    for (const subject of tapped) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter((q) => q.subject === subject && q.tier === tier).length;
        expect(n, `${subject} tier ${tier}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('knows the reading bank is a stub, so nobody ships on it by accident', () => {
    // Flip this expectation when the teacher-written banks land.
    expect(BANK_HAS_TEMPLATE_ITEMS).toBe(true);
  });

  it('uses unique ids and valid answer keys', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    const keyed = QUESTIONS.filter(
      (q) =>
        !isSpokenQuestion(q) &&
        !isWriteQuestion(q) &&
        !isOrderQuestion(q) &&
        // A typed number is its own key, not the id of an option.
        !isNumberQuestion(q) &&
        // A match is keyed by the PAIR of ids, not a single one, and a
        // pairing by the whole placement.
        !isMatchQuestion(q) &&
        !isPairQuestion(q),
    );
    for (const q of keyed) {
      expect(q.options.some((o) => o.id === q.correctAnswerId), q.id).toBe(true);
    }
  });

  it('keys an ordering item by the whole sequence, and uses every word', () => {
    const order = QUESTIONS.filter(isOrderQuestion);
    expect(order.length).toBeGreaterThan(0);
    for (const q of order) {
      const ids = correctOrderFor(q);
      // Every option appears exactly once in the key: a sentence that left a
      // word out, or used one twice, could never be built.
      expect([...ids].sort(), q.id).toEqual(q.options.map((o) => o.id).sort());
      expect(new Set(ids).size, q.id).toBe(ids.length);
      expect(ids.length, q.id).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives every written item a prompt and words to use, and no options', () => {
    const write = QUESTIONS.filter(isWriteQuestion);
    expect(write.length).toBeGreaterThan(0);
    for (const q of write) {
      expect(q.options, q.id).toHaveLength(0);
      expect(q.correctAnswerId, q.id).toBe('');
      expect(q.requiredWords ?? [], q.id).not.toHaveLength(0);
      expect(q.questionText.length, q.id).toBeGreaterThan(10);
    }
  });

  it('splits sentence writing by level, apart from the one heard item', () => {
    for (const q of QUESTIONS.filter((q) => q.subject === 'sentence-writing')) {
      // The heard-and-dragged item sits at every tier: it is the second
      // question of the sitting whatever level the child is working at.
      const expected = q.answerMode === 'order-drag' ? 'order-drag' : q.tier <= 3 ? 'order' : 'write';
      expect(q.answerMode, `${q.id} (tier ${q.tier})`).toBe(expected);
    }
  });

  it('gives the heard sentence-building item a sentence it can actually play', () => {
    const heard = QUESTIONS.filter((q) => q.answerMode === 'order-drag');
    expect(heard.length).toBeGreaterThan(0);
    for (const q of heard) {
      // It has to read as a listen item, or the screen renders no speaker and
      // the child has nothing to hear — the item becomes unanswerable.
      expect(isListenQuestion(q), q.id).toBe(true);
      expect(heardTextFor(q), q.id).toBe(q.listenSentence);
      const spoken = (q.listenSentence ?? '').toLowerCase();
      // Every tile must be a word of the sentence, and the key must rebuild it.
      const rebuilt = correctOrderFor(q)
        .map((id) => q.options.find((o) => o.id === id)!.text)
        .join(' ')
        .toLowerCase();
      expect(spoken.replace(/[.!?]$/, ''), q.id).toBe(rebuilt);
      // The sentence must not be written on the screen anywhere.
      expect(q.questionText.toLowerCase().includes(rebuilt), q.id).toBe(false);
    }
  });

  it('gives every spoken item something to say and no answer key to leak', () => {
    const spoken = QUESTIONS.filter(isSpokenQuestion);
    expect(spoken.length).toBeGreaterThan(0);
    for (const q of spoken) {
      expect(q.spokenWord ?? q.spokenPassage, q.id).toBeTruthy();
      expect(q.options, q.id).toHaveLength(0);
      expect(q.correctAnswerId, q.id).toBe('');
    }
  });

  it('holds enough items to run every sitting to its full length', () => {
    for (const subject of EVERY_SUBJECT) {
      const n = QUESTIONS.filter((q) => q.subject === subject).length;
      expect(n, subject).toBeGreaterThanOrEqual(QUESTIONS_PER_SUBJECT[subject]);
    }
  });
});

describe('start tier', () => {
  it('maps everything before Grade 1 to 0 and Grade n to n', () => {
    expect(startTierForGrade('EL')).toBe(0);
    expect(startTierForGrade('JK')).toBe(0);
    expect(startTierForGrade('SK')).toBe(0);
    expect(startTierForGrade('1')).toBe(1);
    expect(startTierForGrade('6')).toBe(6);
  });
});

describe('branching', () => {
  it('moves up one tier after two correct in a row', () => {
    let s = createSession('4', 'reading-comprehension');
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(4);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
  });

  it('moves down one tier after two incorrect in a row', () => {
    let s = createSession('4', 'reading-comprehension');
    s = answer(s, false);
    s = answer(s, false);
    expect(s.currentTier).toBe(3);
  });

  it('resets streaks when a run is broken', () => {
    let s = createSession('4', 'reading-comprehension');
    s = answer(s, true);
    s = answer(s, false);
    expect(s.currentTier).toBe(4);
    expect(s.consecutiveCorrect).toBe(0);
    expect(s.consecutiveIncorrect).toBe(1);
  });

  it('clamps at Kindergarten and Grade 8', () => {
    const low = sit('SK', 'reading-comprehension', () => false);
    expect(low.currentTier).toBe(MIN_TIER);

    let high = createSession('6', 'reading-comprehension');
    for (let i = 0; i < 6 && !high.finishedAt; i += 1) high = answer(high, true);
    expect(high.currentTier).toBeLessThanOrEqual(MAX_TIER);
  });

  it('serves the next question from the tier the branch moved to', () => {
    let s = createSession('4', 'reading-comprehension');
    s = answer(s, true);
    s = answer(s, true);
    expect(s.currentTier).toBe(5);
    expect(selectNextQuestion(s)!.tier).toBe(5);
  });
});

describe('length and stop rule', () => {
  it('never runs past its subject’s length', () => {
    for (const grade of ALL_GRADES) {
      for (const subject of subjectsForTrack(trackFor(null, grade))) {
        const s = sit(grade, subject, (i) => i % 3 === 0);
        expect(s.questionsAnswered.length, `${grade} ${subject}`).toBeLessThanOrEqual(
          QUESTIONS_PER_SUBJECT[subject],
        );
      }
    }
  });

  it('gives math the longer sitting its intro promises', () => {
    expect(QUESTIONS_PER_SUBJECT.math).toBe(10);
    expect(QUESTIONS_PER_SUBJECT['reading-comprehension']).toBe(8);
  });

  it('ends early once the tier has held for four questions', () => {
    // Alternating answers never build a streak, so the tier never moves.
    const s = sit('4', 'reading-comprehension', (i) => i % 2 === 0);
    expect(s.questionsAnswered.length).toBe(STABILITY_WINDOW);
    expect(isTierStable(s)).toBe(true);
  });

  it('keeps going while the tier is still moving', () => {
    const s = sit('4', 'reading-comprehension', (i) => i % 4 === 1 || i % 4 === 2);
    expect(s.questionsAnswered.length).toBeGreaterThan(STABILITY_WINDOW);
  });

  it('never serves the same question twice', () => {
    const s = sit('5', 'math', (i) => i % 2 === 0);
    const ids = s.questionsAnswered.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only serves questions from the subject being sat', () => {
    for (const subject of EVERY_SUBJECT) {
      const s = sit('5', subject, () => true);
      for (const a of s.questionsAnswered) expect(a.subject).toBe(subject);
    }
  });
});

describe('find the same', () => {
  it('has exactly one matching pair on every card set, and keys it', () => {
    const match = QUESTIONS.filter(isMatchQuestion);
    expect(match.length).toBeGreaterThan(0);
    for (const q of match) {
      const arts = q.options.map((o) => JSON.stringify(o.art));
      const tally = new Map<string, string[]>();
      arts.forEach((a, i) => tally.set(a, [...(tally.get(a) ?? []), q.options[i].id]));
      const pairs = [...tally.values()].filter((v) => v.length > 1);
      // Two identical pictures and no more: a second pair would make two
      // answers right, and none would make the question impossible.
      expect(pairs, q.id).toHaveLength(1);
      expect(pairs[0], q.id).toHaveLength(2);
      expect(q.correctAnswerId, q.id).toBe([...pairs[0]].sort().join('-'));
    }
  });

  it('gives a three-year-old a picture on every card and nothing to read', () => {
    for (const q of QUESTIONS.filter(isMatchQuestion)) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      for (const o of q.options) {
        expect(o.art, `${q.id} ${o.id}`).toBeTruthy();
        // Text on a card would be something to read, and the point of this
        // activity is that there is nothing to read.
        expect(o.text, `${q.id} ${o.id}`).toBe('');
      }
    }
  });

  it('grows by adding cards, never by shrinking the pictures', () => {
    const cardsAt = (tier: number) =>
      QUESTIONS.filter((q) => isMatchQuestion(q) && q.tier === tier).map((q) => q.options.length);
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      expect(cardsAt(tier).length, `tier ${tier}`).toBeGreaterThan(0);
    }
    expect(Math.max(...cardsAt(MIN_TIER))).toBeLessThan(Math.max(...cardsAt(MAX_TIER)));
  });
});

describe('match making', () => {
  it('gives every picture exactly one twin, and keys the whole placement', () => {
    const pairs = QUESTIONS.filter(isPairQuestion);
    expect(pairs.length).toBeGreaterThan(0);
    for (const q of pairs) {
      const optionIds = q.options.map((o) => o.id);
      // Each slot waits for one picture, and every picture has a slot.
      expect([...(q.pairOrder ?? [])].sort(), q.id).toEqual([...optionIds].sort());
      expect(q.correctAnswerId, q.id).toBe((q.pairOrder ?? []).join('-'));
      // Two identical pictures would make two placements right.
      const arts = q.options.map((o) => JSON.stringify(o.art));
      expect(new Set(arts).size, q.id).toBe(arts.length);
    }
  });

  it('never lines the slots up with the pictures', () => {
    // Slots in the same order as the pictures can be filled top to bottom
    // without looking at a single one of them.
    for (const q of QUESTIONS.filter(isPairQuestion)) {
      expect(q.pairOrder, q.id).not.toEqual(q.options.map((o) => o.id));
    }
  });

  it('keeps a three-year-old to three pairs, and never more than five', () => {
    for (const q of QUESTIONS.filter(isPairQuestion)) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.options.length, q.id).toBeLessThanOrEqual(5);
      for (const o of q.options) {
        expect(o.art, `${q.id} ${o.id}`).toBeTruthy();
        expect(o.text, `${q.id} ${o.id}`).toBe('');
      }
    }
    const at = (tier: number) =>
      Math.max(...QUESTIONS.filter((q) => isPairQuestion(q) && q.tier === tier).map((q) => q.options.length));
    expect(at(MIN_TIER)).toBeLessThan(at(MAX_TIER));
  });
});

describe('maths variants', () => {
  const shapeOf = (q: { answerMode?: string }) => q.answerMode ?? 'tap';

  it('offers all five shapes at every tier', () => {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      const shapes = QUESTIONS.filter((q) => q.subject === 'math' && q.tier === tier).map(shapeOf);
      // Four answers can be worked backwards; a sitting of nothing but four
      // answers measures recognition. Every tier carries the alternatives.
      expect(new Set(shapes), `tier ${tier}`).toEqual(new Set(['tap', 'number', 'order', 'drag']));
    }
  });

  it('actually serves a mix in one sitting, not ten of the same thing', () => {
    // Two right then two wrong keeps the tier moving, so the sitting runs its
    // full length instead of stopping on the stability window after four.
    let s = createSession('5', 'math');
    const shapes: string[] = [];
    for (let i = 0; i < QUESTIONS_PER_SUBJECT.math; i += 1) {
      const q = selectNextQuestion(s);
      if (!q) break;
      shapes.push(shapeOf(q));
      s = answer(s, i % 4 < 2, (i + 1) * 1000);
      if (s.finishedAt) break;
    }
    expect(shapes.length).toBeGreaterThan(4);
    expect(new Set(shapes).size, shapes.join(', ')).toBeGreaterThanOrEqual(3);
  });

  it('reaches the shapes that cannot be worked backwards before a sitting ends', () => {
    // A stable sitting stops after four or five questions. The typed-number
    // and ordering items are the two a child cannot back-solve, so they have
    // to appear inside that window rather than at the end of the tier.
    let s = createSession('5', 'math');
    const shapes: string[] = [];
    for (let i = 0; i < QUESTIONS_PER_SUBJECT.math; i += 1) {
      const q = selectNextQuestion(s);
      if (!q) break;
      shapes.push(shapeOf(q));
      // Alternating never builds a streak, so the tier holds and the
      // stability window ends the sitting early — the realistic case.
      s = answer(s, i % 2 === 0, (i + 1) * 1000);
      if (s.finishedAt) break;
    }
    expect(shapes, shapes.join(', ')).toContain('number');
    expect(shapes, shapes.join(', ')).toContain('order');
  });

  it('never trades the right tier for a fresh shape', () => {
    // Variety is a tie-break, not a reason to ask a question at the wrong
    // level. Every served item sits as close to the session tier as the
    // closest unserved one did.
    let s = createSession('5', 'math');
    for (let i = 0; i < 6; i += 1) {
      const served = new Set(s.servedQuestionIds);
      const available = QUESTIONS.filter((q) => q.subject === 'math' && !served.has(q.id));
      const best = Math.min(...available.map((q) => Math.abs(q.tier - s.currentTier)));
      const q = selectNextQuestion(s);
      if (!q) break;
      expect(Math.abs(q.tier - s.currentTier), `${q.id} at session tier ${s.currentTier}`).toBe(best);
      s = answer(s, i % 2 === 0, (i + 1) * 1000);
      if (s.finishedAt) break;
    }
  });

  it('keys a typed number by the number itself, and never by an option', () => {
    const typed = QUESTIONS.filter(isNumberQuestion);
    expect(typed.length).toBeGreaterThan(0);
    for (const q of typed) {
      expect(q.options, q.id).toHaveLength(0);
      expect(q.correctAnswerId, q.id).toMatch(/^-?\d+(\.\d+)?$/);
      // The answer must not be sitting in the question to be copied. Checked
      // as a whole token: "7" inside "47" is not a copyable answer, and
      // treating it as one rejects perfectly good algebra.
      const numbersAsked = q.questionText.match(/-?\d+(\.\d+)?/g) ?? [];
      expect(numbersAsked, `${q.id}: ${q.questionText}`).not.toContain(q.correctAnswerId);
    }
  });

  it('gives a negative or decimal answer the key to type it', () => {
    for (const q of QUESTIONS.filter(isNumberQuestion)) {
      if (q.correctAnswerId.startsWith('-')) expect(q.allowNegative, q.id).toBe(true);
      if (q.correctAnswerId.includes('.')) expect(q.allowDecimal, q.id).toBe(true);
    }
  });
});

describe('the one drag item', () => {
  it('lands at the second question of its sitting and nowhere else', () => {
    for (const subject of ['spelling', 'sentence-writing', 'math'] as Subject[]) {
      let s = createSession('5', subject);
      const positions: number[] = [];
      for (let i = 0; i < QUESTIONS_PER_SUBJECT[subject]; i += 1) {
        const q = selectNextQuestion(s);
        if (!q) break;
        if (isDraggedQuestion(q)) positions.push(i + 1);
        s = answer(s, true, (i + 1) * 1000);
        if (s.finishedAt) break;
      }
      expect(positions, subject).toEqual([DRAG_QUESTION_POSITION]);
    }
  });

  it('is heard as a whole sentence, and the sentence contains the word', () => {
    // SPELLING's single-gap drag only. Sentence writing's dragged item has no
    // single target word, and maths' drags a number into an equation with
    // nothing spoken at all — keying this off answerMode alone stopped being
    // enough the moment a second subject started dragging.
    const drag = QUESTIONS.filter((q) => q.subject === 'spelling' && q.answerMode === 'drag');
    expect(drag.length).toBeGreaterThan(0);
    for (const q of drag) {
      expect(q.listenSentence, q.id).toBeTruthy();
      const words = (q.listenSentence ?? '').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      expect(words, `${q.id}: “${q.listenSentence}” omits “${q.listenWord}”`).toContain(
        (q.listenWord ?? '').toLowerCase(),
      );
      // Sentence or bare word, heardTextFor is what actually gets played.
      expect(heardTextFor(q)).toBe(q.listenSentence);
    }
  });

  it('gives each dragging subject exactly one such item per tier', () => {
    const bySubject = new Set(QUESTIONS.filter(isDraggedQuestion).map((q) => q.subject));
    expect([...bySubject].sort()).toEqual(['math', 'sentence-writing', 'spelling']);
    for (const subject of ['spelling', 'sentence-writing', 'math'] as Subject[]) {
      for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
        const n = QUESTIONS.filter(
          (q) => isDraggedQuestion(q) && q.subject === subject && q.tier === tier,
        ).length;
        // Two would make the position rule ambiguous; none would leave a
        // child at that tier never meeting it.
        expect(n, `${subject} tier ${tier}`).toBe(1);
      }
    }
  });

  it('falls back to a tapped item when the dragged one is used up', () => {
    // Nothing should ever render a sitting short just because the drag item
    // for that tier has already been served.
    let s = createSession('5', 'spelling');
    const first = selectNextQuestion(s)!;
    s = submitAnswer(s, first, first.correctAnswerId, 1000);
    const second = selectNextQuestion(s)!;
    expect(isDraggedQuestion(second)).toBe(true);
    s = submitAnswer(s, second, second.correctAnswerId, 2000);
    const third = selectNextQuestion(s);
    expect(third).not.toBeNull();
    expect(isDraggedQuestion(third!)).toBe(false);
  });
});

describe('unscored answers', () => {
  it('records a spoken attempt without moving the tier', () => {
    let s = createSession('5', 'words-speaking');
    const start = s.currentTier;
    for (let i = 0; i < 6; i += 1) {
      const q = selectNextQuestion(s);
      if (!q) break;
      s = submitAnswer(s, q, 'spoken', (i + 1) * 1000, { scored: false });
    }
    expect(s.questionsAnswered.length).toBeGreaterThan(0);
    expect(s.questionsAnswered.every((a) => a.scored === false)).toBe(true);
    expect(s.currentTier).toBe(start);
    expect(s.tierHistory.every((t) => t === start)).toBe(true);
  });

  it('never counts an unscored attempt as wrong', () => {
    // Six unscored takes would be three tier drops if they were read as wrong.
    let s = createSession('5', 'words-speaking');
    for (let i = 0; i < 6; i += 1) {
      const q = selectNextQuestion(s);
      if (!q) break;
      s = submitAnswer(s, q, 'spoken', (i + 1) * 1000, { scored: false });
    }
    expect(s.consecutiveIncorrect).toBe(0);
    expect(toSubjectResult(s).finalTier).toBe(5);
  });

  it('moves the tier again the moment a real scorer reports', () => {
    let s = createSession('5', 'words-speaking');
    for (let i = 0; i < 2; i += 1) {
      const q = selectNextQuestion(s)!;
      s = submitAnswer(s, q, 'spoken', (i + 1) * 1000, { scored: true, correct: true });
    }
    expect(s.currentTier).toBe(6);
  });

  it('marks a whole sitting unscored, and never levels it', () => {
    let s = createSession('5', 'oral-reading');
    for (let i = 0; i < 5; i += 1) {
      const q = selectNextQuestion(s);
      if (!q) break;
      s = submitAnswer(s, q, 'spoken', (i + 1) * 1000, { scored: false });
    }
    expect(toSubjectResult(s).unscored).toBe(true);

    const result = buildResult('5', 10, [
      toSubjectResult(s),
      { subject: 'reading-comprehension', finalTier: 3, floored: false, unscored: false, questionsAnswered: 8, durationMs: 1, completedAt: 2, history: [] },
    ]);
    const row = result.subjects.find((p) => p.subject === 'oral-reading')!;
    expect(row.unscored).toBe(true);
    expect(row.nonDetermining).toBe(true);
    // The level rests on the one sitting that was actually measured.
    expect(result.readingRestsOn).toEqual(['reading-comprehension']);
    expect(result.readingTier).toBe(3);
  });

  it('runs an unscored sitting to its full length instead of stopping on a still tier', () => {
    let s = createSession('5', 'words-speaking');
    for (let i = 0; i < 12; i += 1) {
      if (s.finishedAt) break;
      const q = selectNextQuestion(s);
      if (!q) break;
      s = submitAnswer(s, q, 'spoken', (i + 1) * 1000, { scored: false });
    }
    // Four identical tiers would trip the stability window on a scored sitting.
    expect(s.questionsAnswered.length).toBe(QUESTIONS_PER_SUBJECT['words-speaking']);
  });

  it('knows speech scoring is a stub, so nobody ships on it by accident', () => {
    expect(SPEECH_SCORING_IS_STUB).toBe(true);
  });
});

describe('subject result', () => {
  it('reports the tier the sitting ended on', () => {
    const s = sit('4', 'reading-comprehension', () => true);
    const result = toSubjectResult(s);
    expect(result.finalTier).toBe(s.currentTier);
    expect(result.subject).toBe('reading-comprehension');
    expect(result.questionsAnswered).toBe(s.questionsAnswered.length);
    expect(result.durationMs).toBeGreaterThan(0);
  });
});

describe('reading level derivation', () => {
  const parts = [
    { subject: 'oral-reading' as const, finalTier: 2 },
    { subject: 'reading-comprehension' as const, finalTier: 5 },
  ];

  it('defaults to the lower of the two reading subjects', () => {
    expect(deriveReadingLevel('grade-level', parts)).toBe(2);
  });

  it('withholds a level until both reading subjects are sat', () => {
    expect(deriveReadingLevel('grade-level', [parts[0]])).toBeNull();
  });

  it('offers a weighted rule the teachers can switch to', () => {
    expect(deriveReadingLevel('grade-level', parts, 'weighted')).toBe(3);
  });

  it('names the weaker reading subject as the bottleneck', () => {
    expect(readingBottleneck(parts)!.subject).toBe('oral-reading');
  });

  it('reads Little Readers off its own two activities', () => {
    const little = [
      { subject: 'letter-sounds' as const, finalTier: 1 },
      { subject: 'word-practice' as const, finalTier: 0 },
    ];
    expect(deriveReadingLevel('little-reader', little)).toBe(0);
    expect(deriveReadingLevel('little-reader', [little[0]])).toBeNull();
  });
});

describe('floored sittings', () => {
  it('starts at the lowest tier and never drops below it', () => {
    const s = sit('5', 'vocabulary', () => false, true);
    expect(s.tierHistory.every((t) => t === MIN_TIER)).toBe(true);
    expect(toSubjectResult(s).floored).toBe(true);
  });

  it('still branches upward, so a child who can spell climbs out', () => {
    const s = sit('5', 'vocabulary', () => true, true);
    expect(s.currentTier).toBeGreaterThan(MIN_TIER);
  });

  it('leaves an unfloored sitting starting at the grade tier', () => {
    expect(createSession('5', 'vocabulary').currentTier).toBe(5);
    expect(createSession('5', 'vocabulary', { floored: true }).currentTier).toBe(MIN_TIER);
  });
});

describe('placement result', () => {
  const ALL: Subject[] = [
    'words-speaking',
    'oral-reading',
    'vocabulary',
    'reading-comprehension',
    'spelling',
    'sentence-writing',
    'math',
  ];

  const resultFor = (
    grade: Grade,
    tiers: Partial<Record<Subject, number>>,
    options: { age?: number; floored?: Subject[]; unscored?: Subject[] } = {},
  ) => {
    const floored = new Set(options.floored ?? []);
    const completed: SubjectResult[] = ALL.filter((s) => s in tiers).map((subject) => ({
      subject,
      finalTier: tiers[subject] as number,
      floored: floored.has(subject),
      unscored: (options.unscored ?? []).includes(subject),
      questionsAnswered: 8,
      durationMs: 60_000,
      completedAt: 1,
      history: [],
    }));
    return buildResult(grade, options.age ?? null, completed);
  };

  const onLevel = (grade: number) =>
    Object.fromEntries(ALL.map((s) => [s, grade])) as Partial<Record<Subject, number>>;

  it('assesses all seven subjects for every child, and stops nobody early', () => {
    const result = resultFor('5', { 'words-speaking': 5 }, { age: 10 });
    expect(result.track).toBe('grade-level');
    expect(result.requiredSubjects).toEqual(ALL);
    expect(result.complete).toBe(false);
    expect(result.nextSubject).toBe('oral-reading');
  });

  it('puts a little one on the park track instead', () => {
    const result = buildResult('1', 5, []);
    expect(result.track).toBe('little-reader');
    expect(result.requiredSubjects).toEqual(TRACKS['little-reader'].subjects);
    expect(result.nextSubject).toBe('find-the-same');
  });

  it('withholds the program until every subject is sat', () => {
    const partial = resultFor('5', { 'oral-reading': 5, 'reading-comprehension': 5 });
    expect(partial.complete).toBe(false);
    expect(partial.program).toBeNull();

    const done = resultFor('5', onLevel(5));
    expect(done.complete).toBe(true);
    expect(done.program!.name).toBe('Core Skills Enriched 4-6');
  });

  it('derives the reading level from both reading subjects', () => {
    const result = resultFor('5', { ...onLevel(5), 'oral-reading': 2 });
    expect(result.readingTier).toBe(2);
    expect(result.readingGated).toBe(true);
    expect(result.program!.name).toMatch(/^Core Reading /);
  });

  it('flags every subject the decision did not rest on', () => {
    const gated = resultFor(
      '5',
      { ...onLevel(0), 'oral-reading': 1, 'reading-comprehension': 1 },
      { floored: ['vocabulary', 'spelling', 'sentence-writing', 'math'] },
    );
    const nonDetermining = gated.subjects.filter((s) => s.nonDetermining).map((s) => s.subject);
    expect(nonDetermining).toContain('sentence-writing');
    expect(nonDetermining).toContain('math');
    expect(nonDetermining).not.toContain('oral-reading');

    // Words Speaking is an observation in every outcome — it is never a gate
    // input, so it is non-determining even when everything is on level.
    const enriched = resultFor('5', onLevel(5));
    const flagged = enriched.subjects.filter((s) => s.nonDetermining).map((s) => s.subject);
    expect(flagged).toEqual(['words-speaking']);
  });

  it('sets math content by grade, never by the assessed math tier', () => {
    const behind = resultFor('5', { ...onLevel(5), math: 1 });
    const ahead = resultFor('5', { ...onLevel(5), math: 8 });
    expect(behind.mathContentLevel).toBe(5);
    expect(ahead.mathContentLevel).toBe(5);
    expect(behind.program!.name).toBe('Core Skills Math 4-6');
  });

  it('flags an age and grade two or more years apart', () => {
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 7 }).ageGradeMismatch).toBe(false);
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 10 }).ageGradeMismatch).toBe(true);
    expect(resultFor('2', { 'oral-reading': 3 }, { age: 5 }).ageGradeMismatch).toBe(true);
  });

  it('orders subjects by the sitting order, not completion order', () => {
    const result = buildResult('4', 10, [
      { subject: 'math', finalTier: 4, floored: false, unscored: false, questionsAnswered: 8, durationMs: 1, completedAt: 3, history: [] },
      { subject: 'oral-reading', finalTier: 5, floored: false, unscored: false, questionsAnswered: 8, durationMs: 1, completedAt: 1, history: [] },
      { subject: 'sentence-writing', finalTier: 4, floored: false, unscored: false, questionsAnswered: 8, durationMs: 1, completedAt: 2, history: [] },
    ]);
    expect(result.subjects.map((s) => s.subject)).toEqual([
      'oral-reading',
      'sentence-writing',
      'math',
    ]);
  });

  it('never renders a raw tier number in parent-facing language', () => {
    for (let tier = MIN_TIER; tier <= MAX_TIER; tier += 1) {
      const label = tierGradeLabel(tier);
      expect(label).not.toMatch(/tier/i);
      expect(label).toBe(tier === 0 ? 'Kindergarten level' : `Grade ${tier} level`);
    }
    const result = resultFor('6', onLevel(6));
    expect(result.program!.gradeEquivalentDisplay).not.toMatch(/tier/i);
    for (const s of result.subjects) expect(s.gradeEquivalentDisplay).not.toMatch(/tier/i);
  });
});
