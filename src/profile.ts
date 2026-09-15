import type { Grade } from './assessment/types';
import { GRADES, GRADE_SHORT, MAX_AGE, MIN_AGE } from './assessment/types';

/**
 * The child profile the placement flow runs against.
 *
 * In the host app this comes from the signed-in family's account: name, age
 * and grade are all collected at sign-up, so the flow never asks for them
 * fresh. This module is the seam where the host injects that record.
 *
 * Age and grade are nullable on purpose. An older account, a migrated one, or
 * a second child added in a hurry may be missing either, so the intake screen
 * still has to be able to ask — and a parent must always be able to correct
 * what sign-up recorded, because a child's grade changes every September.
 *
 * The demo build accepts `?name=`, `?age=` and `?grade=` for trying values;
 * anything missing or invalid comes back null, which is the "ask for it" path.
 */
export interface ChildProfile {
  name: string;
  /** From the account. null means sign-up never captured it — intake asks. */
  age: number | null;
  /** From the account. null means sign-up never captured it — intake asks. */
  grade: Grade | null;
}

const DEMO_PROFILE: ChildProfile = { name: 'Maya', age: 7, grade: '2' };

function parseAge(raw: string | null): number | null {
  if (raw === null) return null;
  const age = Number(raw.trim());
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) return null;
  return age;
}

/**
 * Accepts the grade code (`EL`, `JK`, `SK`, `1`–`6`) or the short label the
 * chips show (`Early`), case-insensitively. Both are strings this product
 * already puts in front of people, so either is a fair guess for a host to
 * send. Anything else is rejected rather than guessed at: a grade quietly
 * accepted wrong produces a placement measured against nothing, and nobody
 * downstream can see that it happened.
 */
function parseGrade(raw: string | null): Grade | null {
  if (raw === null) return null;
  const value = raw.trim().toUpperCase();
  const code = (GRADES as string[]).find((g) => g.toUpperCase() === value);
  if (code) return code as Grade;
  const byLabel = GRADES.find((g) => GRADE_SHORT[g].toUpperCase() === value);
  return byLabel ?? null;
}

/** `search` is injectable so the parsing can be tested without a browser. */
export function loadChildProfile(search?: string): ChildProfile {
  if (search === undefined && typeof window === 'undefined') return DEMO_PROFILE;
  const params = new URLSearchParams(search ?? window.location.search);
  if (!params.has('name') && !params.has('age') && !params.has('grade')) {
    return DEMO_PROFILE;
  }
  const name = params.get('name')?.trim();
  return {
    name: name || DEMO_PROFILE.name,
    age: parseAge(params.get('age')),
    grade: parseGrade(params.get('grade')),
  };
}
