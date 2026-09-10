/** The four assessed subjects, in the order they are sat. */
export type Subject = 'reading' | 'spelling' | 'writing' | 'math';

export const SUBJECT_ORDER: Subject[] = ['reading', 'spelling', 'writing', 'math'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  reading: 'Reading',
  spelling: 'Spelling',
  writing: 'Writing',
  math: 'Math',
};
