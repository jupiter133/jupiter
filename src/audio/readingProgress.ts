/**
 * How far through a passage a child has read, by COUNTING what was heard —
 * never by checking whether it was right.
 *
 * This is the whole design rule for this feature. A highlight that advanced
 * only on a correctly recognised word would stall on the exact word a
 * struggling reader is stuck on, which tells them mid-sentence that they got
 * it wrong. That is the one thing this product never does. So nothing here
 * compares a spoken word to the text: it counts words heard and moves the
 * marker along. Recognition being sloppy — and with a seven-year-old it will
 * be — costs a little accuracy in where the marker sits, and costs the child
 * nothing at all.
 */

/** Splits a passage into renderable words, punctuation kept with the word. */
export function splitPassage(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Words in a transcript fragment. */
export function countWords(transcript: string): number {
  return splitPassage(transcript).length;
}

/**
 * The marker only ever moves forward, and never past the end.
 *
 * Recognition revises itself: an interim result can shrink when the engine
 * changes its mind mid-phrase. Letting the marker follow it backwards would
 * un-read words in front of the child, so it holds instead.
 */
export function advanceMarker(current: number, heard: number, total: number): number {
  return Math.min(total, Math.max(current, heard));
}
