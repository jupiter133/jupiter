import type { ReactNode } from 'react';
import type { Subject } from '../assessment/types';

export type TagColor = 'green' | 'pink' | 'cyan' | 'gold' | 'lime';

/** The three strands take the three O·L·C tile hues, in tile order. */
export const STRAND_TAG: Record<Subject, TagColor> = {
  reading: 'green',
  math: 'cyan',
  writing: 'pink',
};

interface Props {
  color?: TagColor;
  /** Alternate the tilt across a run of tags so they look hand-placed. */
  alt?: boolean;
  children: ReactNode;
}

/** The DS highlighter word-tag: a solid colour block with black-weight text,
 *  a slight tilt and a soft shadow, like a marker swipe over the word. */
export function Tag({ color = 'green', alt = false, children }: Props) {
  return <span className={`tag tag--${color}${alt ? ' tag--tilt-alt' : ''}`}>{children}</span>;
}
