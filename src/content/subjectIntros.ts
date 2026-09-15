import type { Subject } from '../assessment/subjects';

/**
 * Subject intro copy, verbatim from the OLC assessment intro design bundle
 * (`design_handoff_olc_assessment_intro`). The design is the source of truth;
 * treat this file as content, not prose to improve.
 *
 * NOTE: three of these describe input modes the question engine does not
 * implement yet — speaking into a microphone (oral reading), typing a word on
 * a keyboard (vocabulary & spelling), and free writing about a picture
 * (sentence writing). Today every item is multiple choice. See the README.
 */
export interface IntroChip {
  label: string;
  /** Fill and hard bottom edge, as CSS custom property names. */
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
  kicker: string;
  lead: string;
  cta: string;
  chips: IntroChip[];
  sections: IntroSection[];
}

const CYAN = { bg: 'var(--olc-cyan-soft)', edge: 'var(--olc-cyan-soft-dark)' };
const LIME = { bg: 'var(--olc-lime)', edge: 'var(--olc-lime-dark)' };
const PINK = { bg: 'var(--olc-pink-soft)', edge: 'var(--olc-pink-soft-dark)' };

export const SUBJECT_INTROS: Record<Subject, SubjectIntro> = {
  'oral-reading': {
    kicker: 'First up · Part 1 of 5',
    lead: 'Read the words and short sentences out loud, clearly — you have 3 seconds per word.',
    cta: 'Start reading aloud',
    chips: [
      { label: 'Speak aloud', ...CYAN },
      { label: '3s per word', ...LIME },
      { label: '~3 minutes', ...PINK },
    ],
    sections: [
      {
        num: '1',
        chip: 'var(--olc-cyan-soft)',
        title: 'Before you start',
        body: 'Find a quiet spot and sit with your grown-up nearby. Make sure the sound is on so Ms Hannah can hear you.',
      },
      {
        num: '2',
        chip: 'var(--olc-lime)',
        title: 'Reading out loud',
        body: 'A word or short sentence appears on the screen. Read it out loud, nice and clearly. Not sure? Take your best guess — guessing is part of exploring!',
      },
      {
        num: '3',
        chip: 'var(--olc-gold-soft)',
        title: 'How we listen',
        body: 'The tablet listens while you read and marks each one for Ms Hannah. Nothing is saved except your answers.',
      },
      {
        num: '4',
        chip: 'var(--olc-pink-soft)',
        title: 'The rules',
        body: 'One at a time, about 3 seconds each. You can pause between words whenever you need a break.',
      },
    ],
  },
  'reading-comprehension': {
    kicker: 'Next · Part 2 of 5',
    lead: 'Read a short story, then answer a few questions about what happened.',
    cta: 'Start the story questions',
    chips: [
      { label: 'Short stories', ...CYAN },
      { label: 'Tap answers', ...LIME },
      { label: '~5 minutes', ...PINK },
    ],
    sections: [
      {
        num: '1',
        chip: 'var(--olc-cyan-soft)',
        title: 'The stories',
        body: 'You’ll read two or three very short stories. Read at your own pace — you can look back at the story any time.',
      },
      {
        num: '2',
        chip: 'var(--olc-lime)',
        title: 'The questions',
        body: 'After each story, a few questions ask what happened, who did it, or why. Tap the answer you think is right.',
      },
      {
        num: '3',
        chip: 'var(--olc-gold-soft)',
        title: 'Need it read to you?',
        body: 'Tap the speaker to hear a story out loud — that’s allowed, and it tells Ms Hannah something helpful too.',
      },
      {
        num: '4',
        chip: 'var(--olc-pink-soft)',
        title: 'The rules',
        body: 'No time limit. Your best guess always beats a blank — there’s no losing points.',
      },
    ],
  },
  'vocabulary-spelling': {
    kicker: 'Next · Part 3 of 5',
    lead: 'Ms Hannah says a word out loud — type it the way you think it’s spelled, and match words to their meanings.',
    cta: 'Start the word round',
    chips: [
      { label: 'Listen first', ...CYAN },
      { label: 'Type the word', ...LIME },
      { label: '~4 minutes', ...PINK },
    ],
    sections: [
      {
        num: '1',
        chip: 'var(--olc-cyan-soft)',
        title: 'Hearing the word',
        body: 'Ms Hannah says each word out loud, then uses it in a sentence so you know exactly which word she means. Tap the speaker to hear it again.',
      },
      {
        num: '2',
        chip: 'var(--olc-lime)',
        title: 'Typing your answer',
        body: 'Type the word with the keyboard, then press the green check. Your best guess is always okay.',
      },
      {
        num: '3',
        chip: 'var(--olc-gold-soft)',
        title: 'Word meanings',
        body: 'A few questions show a word and four pictures or meanings — tap the one that matches.',
      },
      {
        num: '4',
        chip: 'var(--olc-pink-soft)',
        title: 'The rules',
        body: 'One word at a time, no time limit. Once you press the check we move on — no going back, and that’s fine.',
      },
    ],
  },
  'sentence-writing': {
    kicker: 'Next · Part 4 of 5',
    lead: 'Look at a picture, then write a few sentences about what you see.',
    cta: 'Start writing',
    chips: [
      { label: 'One picture', ...CYAN },
      { label: 'Write freely', ...LIME },
      { label: '~5 minutes', ...PINK },
    ],
    sections: [
      {
        num: '1',
        chip: 'var(--olc-cyan-soft)',
        title: 'The picture',
        body: 'You’ll see one fun picture. Look at it for as long as you like — who’s there, what’s happening, what might happen next?',
      },
      {
        num: '2',
        chip: 'var(--olc-lime)',
        title: 'Your writing',
        body: 'Write a few sentences about the picture. There’s no right answer — your own ideas are exactly what we want.',
      },
      {
        num: '3',
        chip: 'var(--olc-gold-soft)',
        title: 'Spelling doesn’t count here',
        body: 'Don’t worry about perfect spelling — this one is about your ideas and sentences.',
      },
      {
        num: '4',
        chip: 'var(--olc-pink-soft)',
        title: 'The rules',
        body: 'One picture, about 5 minutes. When you’re happy with your writing, press the green check.',
      },
    ],
  },
  math: {
    kicker: 'Last one · Part 5 of 5',
    lead: 'Solve some number puzzles — they start easy and only get harder if you’re doing great.',
    cta: 'Start the math puzzles',
    chips: [
      { label: 'Number puzzles', ...CYAN },
      { label: 'Starts easy', ...LIME },
      { label: '~10 puzzles', ...PINK },
    ],
    sections: [
      {
        num: '1',
        chip: 'var(--olc-cyan-soft)',
        title: 'How it works',
        body: 'Each puzzle shows numbers or shapes with one question. Tap the answer you think is right.',
      },
      {
        num: '2',
        chip: 'var(--olc-lime)',
        title: 'It adjusts to you',
        body: 'The puzzles start easy and only get trickier while you’re doing well — so a hard one means you’re doing great!',
      },
      {
        num: '3',
        chip: 'var(--olc-gold-soft)',
        title: 'Scratch space',
        body: 'You can count on your fingers or ask your grown-up for paper — whatever helps you think.',
      },
      {
        num: '4',
        chip: 'var(--olc-pink-soft)',
        title: 'The rules',
        body: 'About 10 puzzles, no time limit. It’s okay to say “I don’t know yet” — that helps us too.',
      },
    ],
  },
};
