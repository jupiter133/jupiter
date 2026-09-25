import type { Subject } from '../assessment/subjects';

/**
 * Subject intro copy.
 *
 * The Grade Level intros for oral reading, comprehension, sentence
 * writing and math are verbatim from the OLC assessment intro design bundle.
 * Vocabulary and spelling are that bundle's combined "Vocabulary & Spelling"
 * intro split in two. The Little Readers intros and Words Speaking
 * are written to the same shape and are PLACEHOLDER — teacher copy pending.
 *
 * NOTE: several of these describe input modes the question engine does not
 * implement yet — speaking into a microphone, typing a word, free writing.
 * Today every item is multiple choice. See the README.
 */
export interface IntroChip {
  label: string;
  bg: string;
  edge: string;
}

export interface IntroSection {
  num: string;
  chip: string;
  title: string;
  body: string;
}

export interface SubjectIntro {
  lead: string;
  cta: string;
  chips: IntroChip[];
  sections: IntroSection[];
}

const CYAN = { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' };
const LIME = { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' };
const PINK = { bg: 'var(--olc-pink-soft)', edge: 'var(--olc-pink-soft-dark)' };

const C1 = 'var(--olc-cyan-soft)';
const C2 = 'var(--olc-lime)';
const C3 = 'var(--olc-gold-soft)';
const C4 = 'var(--olc-pink-soft)';

/** Four rule cards, in the design's fixed colour order. */
function rules(items: [string, string][]): IntroSection[] {
  const chips = [C1, C2, C3, C4];
  return items.map(([title, body], i) => ({
    num: String(i + 1),
    chip: chips[i] ?? C1,
    title,
    body,
  }));
}

export const SUBJECT_INTROS: Record<Subject, SubjectIntro> = {
  /* ---------- Little Readers ---------- */
  'find-the-same': {
    lead: 'Look at the pictures and find the two that match.',
    cta: 'Start matching',
    chips: [{ label: 'Look closely', ...CYAN }, { label: 'Tap to pick', ...LIME }, { label: '~2 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'You’ll see a row of pictures. Two of them are exactly the same — tap the one that matches.'],
      ['Take your time', 'There’s no clock. Look at each picture for as long as you like before you choose.'],
      ['Need a hand?', 'Tap the speaker to hear the question read out loud, any time you want.'],
      ['The rules', 'One puzzle at a time. A guess is always okay — nothing here can go wrong.'],
    ]),
  },
  'match-making': {
    lead: 'Match each picture to the one that goes with it.',
    cta: 'Start the matching game',
    chips: [{ label: 'Pairs', ...CYAN }, { label: 'Tap to pick', ...LIME }, { label: '~2 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'You’ll see one picture at the top and a few below. Tap the one that belongs with it.'],
      ['Things that go together', 'A sock and a shoe. A bird and a nest. Think about which two are friends.'],
      ['Need a hand?', 'Tap the speaker to hear it read out loud whenever you like.'],
      ['The rules', 'No timer, no score. Pick the one you think fits best.'],
    ]),
  },
  'spot-the-difference': {
    lead: 'One of these is not like the others — can you spot it?',
    cta: 'Start spotting',
    chips: [{ label: 'Odd one out', ...CYAN }, { label: 'Tap to pick', ...LIME }, { label: '~2 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'You’ll see a few pictures. All of them go together except one — tap the odd one out.'],
      ['Look carefully', 'Sometimes it’s the shape, sometimes the colour, sometimes what it is. Trust your eyes.'],
      ['Need a hand?', 'Tap the speaker to hear the question again.'],
      ['The rules', 'One at a time, no rush, no wrong way to think about it.'],
    ]),
  },
  'shapes-colors': {
    lead: 'Shapes and colours — find the one being asked for.',
    cta: 'Start shapes & colours',
    chips: [{ label: 'Shapes', ...CYAN }, { label: 'Colours', ...LIME }, { label: '~2 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'A question asks for a shape or a colour. Tap the picture that matches it.'],
      ['The shapes', 'Circles, squares, triangles and rectangles — the ones you already know.'],
      ['Need a hand?', 'Tap the speaker to hear the shape or colour said out loud.'],
      ['The rules', 'One question at a time. Best guesses count for plenty.'],
    ]),
  },
  'number-fun': {
    lead: 'Counting and numbers, one little puzzle at a time.',
    cta: 'Start counting',
    chips: [{ label: 'Counting', ...CYAN }, { label: 'Starts easy', ...LIME }, { label: '~2 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'You’ll see things to count, or numbers to pick. Tap your answer.'],
      ['Fingers allowed', 'Count on your fingers, out loud, or in your head — whatever helps you.'],
      ['Need a hand?', 'Tap the speaker to hear the question read to you.'],
      ['The rules', 'It starts easy and only gets trickier while you’re doing well.'],
    ]),
  },
  'letter-sounds': {
    lead: 'Letters and the sounds they make.',
    cta: 'Start letter sounds',
    chips: [{ label: 'Listen', ...CYAN }, { label: 'Tap to pick', ...LIME }, { label: '~3 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'A sound or a letter comes up, and you tap the picture or word that goes with it.'],
      ['Sound it out', 'Say the sound to yourself first. Your mouth often knows before your eyes do.'],
      ['Need a hand?', 'Tap the speaker to hear the sound again, as many times as you like.'],
      ['The rules', 'One at a time, no timer. Guessing is part of learning.'],
    ]),
  },
  'word-practice': {
    lead: 'Words you’re starting to know by sight.',
    cta: 'Start word practice',
    chips: [{ label: 'Whole words', ...CYAN }, { label: 'Tap to pick', ...LIME }, { label: '~3 minutes', ...PINK }],
    sections: rules([
      ['How it works', 'You’ll see a word and a few choices. Tap the one that matches.'],
      ['Sight words', 'Some words you just know by looking — the, and, see, go. Those are the ones.'],
      ['Need a hand?', 'Tap the speaker to hear the word out loud.'],
      ['The rules', 'No pass or fail here. Every answer tells Ms Hannah something useful.'],
    ]),
  },

  /* ---------- Grade Level ---------- */
  'words-speaking': {
    lead: 'Say each word out loud, clearly, so Ms Hannah can hear you.',
    cta: 'Start speaking',
    chips: [{ label: 'Speak aloud', ...CYAN }, { label: 'One word at a time', ...LIME }, { label: '~3 minutes', ...PINK }],
    sections: rules([
      ['Before you start', 'Find a quiet spot. The tablet will ask to use the microphone — your grown-up can say yes and sit nearby.'],
      ['Saying the words', 'One word appears at a time. Tap the microphone, say the word out loud, then tap again when you are done.'],
      ['Take your time', 'There is no countdown and no pass or fail. Not sure how to say it? Tap “Hear it” and then try — your best try is exactly right.'],
      ['Moving on', 'Tap “Next word” when you are ready. You can skip a word and come back to speaking any time.'],
    ]),
  },
  'oral-reading': {
    lead: 'Read each short passage out loud, clearly, so Ms Hannah can hear you.',
    cta: 'Start reading aloud',
    chips: [{ label: 'Read aloud', ...CYAN }, { label: 'Short passages', ...LIME }, { label: '~3 minutes', ...PINK }],
    sections: rules([
      ['Before you start', 'Find a quiet spot. The tablet will ask to use the microphone — your grown-up can say yes and sit nearby.'],
      ['Reading out loud', 'A short passage appears. Tap the microphone, read it out loud at your normal speed, then tap again when you reach the end.'],
      ['Stuck on a word', 'Say your best try and keep going, or say “pass” and move to the next word. Getting stuck on one word is not the end of the passage.'],
      ['Take your time', 'There is no countdown and no pass or fail. Tap “Next passage” when you are ready, and you can stop between passages whenever you like.'],
    ]),
  },
  vocabulary: {
    lead: 'Read a word and what it means. Then it disappears, and a question comes.',
    cta: 'Start the word round',
    chips: [{ label: 'Read, then answer', ...CYAN }, { label: 'One word at a time', ...LIME }, { label: '~4 minutes', ...PINK }],
    sections: rules([
      ['Read it first', 'A word appears with what it means. Read both, as slowly as you like — nothing is being timed.'],
      ['Then it disappears', 'When you tap “I’ve read it”, the word and its meaning go away and a question takes their place. You get one chance to look again before that happens.'],
      ['Answering', 'The question is about what the word means, not about remembering the exact words you read. If you understood it, you can answer it.'],
      ['Need it read to you?', 'Tap the speaker to hear the word, its meaning and the choices out loud — that’s allowed.'],
    ]),
  },
  'reading-comprehension': {
    lead: 'Read a short passage. Then it disappears, and a question about it comes.',
    cta: 'Start the story questions',
    chips: [{ label: 'Read, then answer', ...CYAN }, { label: 'Short passages', ...LIME }, { label: '~5 minutes', ...PINK }],
    sections: rules([
      ['Read it first', 'A short passage appears on its own. Read it at your own pace — nothing is being timed, and it is only a few sentences.'],
      ['Then it disappears', 'When you tap “I’ve read it”, the passage goes away and a question takes its place. You get one chance to look again before that happens.'],
      ['The questions', 'They ask what happened, why, or what the passage meant — not the exact words. Understanding it is enough.'],
      ['Need it read to you?', 'Tap the speaker to hear the passage out loud before it goes — that’s allowed, and it tells Ms Hannah something helpful too.'],
    ]),
  },
  spelling: {
    lead: 'Ms Hannah says a word out loud — spell it the way you think it’s spelled.',
    cta: 'Start spelling',
    chips: [{ label: 'Listen first', ...CYAN }, { label: 'Pick the spelling', ...LIME }, { label: '~4 minutes', ...PINK }],
    sections: rules([
      ['Hearing the word', 'The word plays by itself when it appears — the word is never written down, so listening is the whole game. Turn the sound up before you start.'],
      ['Three more listens', 'Tap the big speaker to hear it again. You get three more listens per word, and the counter tells you how many are left.'],
      ['Your answer', 'Choose the spelling that looks right to you. Your best guess is always okay, even on the last listen.'],
      ['One of them is a sentence', 'For one word you hear a whole sentence instead, and you drag the spelling into the gap — or just tap it, whichever you like.'],
    ]),
  },
  'sentence-writing': {
    lead: 'Look at a picture, then write a few sentences about what you see.',
    cta: 'Start writing',
    chips: [{ label: 'One picture', ...CYAN }, { label: 'Write freely', ...LIME }, { label: '~5 minutes', ...PINK }],
    sections: rules([
      ['The picture', 'You’ll see one fun picture. Look at it for as long as you like — who’s there, what’s happening, what might happen next?'],
      ['Your writing', 'Write a few sentences about the picture. There’s no right answer — your own ideas are exactly what we want.'],
      ['Spelling doesn’t count here', 'Don’t worry about perfect spelling — this one is about your ideas and sentences.'],
      ['The rules', 'One picture, about 5 minutes. When you’re happy with your writing, press the green check.'],
    ]),
  },
  math: {
    lead: 'Solve some number puzzles — they start easy and only get harder if you’re doing great.',
    cta: 'Start the math puzzles',
    chips: [{ label: 'Number puzzles', ...CYAN }, { label: 'Starts easy', ...LIME }, { label: '~10 puzzles', ...PINK }],
    sections: rules([
      ['How it works', 'Each puzzle shows numbers or shapes with one question. Tap the answer you think is right.'],
      ['It adjusts to you', 'The puzzles start easy and only get trickier while you’re doing well — so a hard one means you’re doing great!'],
      ['Scratch space', 'You can count on your fingers or ask your grown-up for paper — whatever helps you think.'],
      ['The rules', 'About 10 puzzles, no time limit. It’s okay to say “I don’t know yet” — that helps us too.'],
    ]),
  },
};
