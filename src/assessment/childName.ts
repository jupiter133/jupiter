/**
 * Name handling for a field the parent may leave blank.
 *
 * Parent-facing copy falls back to "your child", which reads fine in a sentence.
 * Child-facing copy cannot — Ms Hannah greeting "Hi your child!" is worse than no
 * greeting at all — so those screens use `firstName` and drop the name entirely
 * when there isn't one.
 */

export function firstName(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Parent-facing subject: "Maya" or "your child". */
export function displayName(raw: string): string {
  return firstName(raw) ?? 'your child';
}

/** Parent-facing possessive: "Maya’s" or "your child’s". */
export function possessiveName(raw: string): string {
  const name = firstName(raw);
  return name ? `${name}’s` : 'your child’s';
}
