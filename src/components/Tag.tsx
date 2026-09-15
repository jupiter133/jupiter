import type { ReactNode } from 'react';
import type { Subject } from '../assessment/types';
import { SUBJECT_COLOR } from '../assessment/types';

export type TagColor = 'green' | 'pink' | 'cyan' | 'gold' | 'lime';

/** Each subject's highlighter colour, from the assessment intro design. */
export const STRAND_TAG: Record<Subject, TagColor> = SUBJECT_COLOR;

interface Props {
  color?: TagColor;
  children: ReactNode;
}

/** The DS highlighter word-tag: a solid colour block with black-weight text,
 *  sitting straight so a small subject name stays easy to read. */
export function Tag({ color = 'green', children }: Props) {
  return <span className={`tag tag--${color}`}>{children}</span>;
}
