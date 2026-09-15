import type { ReactNode } from 'react';
import type { Subject } from '../assessment/types';
import { SUBJECT_COLOR } from '../assessment/types';

export type TagColor = 'green' | 'pink' | 'cyan' | 'gold' | 'lime';

/** Each subject's highlighter colour, from the assessment intro design. */
export const STRAND_TAG: Record<Subject, TagColor> = SUBJECT_COLOR;

interface Props {
  color?: TagColor;
  /** Alternate the tilt across a run of tags so they look hand-placed. */
  alt?: boolean;
  /** No tilt. The intro headings set the subject tags straight. */
  straight?: boolean;
  children: ReactNode;
}

/** The DS highlighter word-tag: a solid colour block with black-weight text,
 *  a slight tilt and a soft shadow, like a marker swipe over the word. */
export function Tag({ color = 'green', alt = false, straight = false, children }: Props) {
  const tilt = straight ? ' tag--straight' : alt ? ' tag--tilt-alt' : '';
  return <span className={`tag tag--${color}${tilt}`}>{children}</span>;
}
