import type { Grade, Subject, SubjectResult } from './types';

/**
 * Where placement progress lives between sessions.
 *
 * Every child sits four subjects, one per session, so a partly-finished
 * placement has to survive the tablet being put down. In the host app this is the child's
 * profile record on the server; this module is the seam. The demo build keeps
 * it in `localStorage`, keyed by child, and degrades to in-memory when storage
 * is unavailable (private windows, blocked site data).
 */
export interface PlacementProgress {
  grade: Grade;
  /** Presentation only, but stored so a resumed sitting looks the same. */
  age: number | null;
  completed: SubjectResult[];
}

const KEY_PREFIX = 'olc.placement.';

/** Used when localStorage throws or is absent, so the flow still works. */
const memory = new Map<string, PlacementProgress>();

function keyFor(childId: string): string {
  return `${KEY_PREFIX}${childId || 'default'}`;
}

export function loadProgress(childId: string): PlacementProgress | null {
  const key = keyFor(childId);
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as PlacementProgress;
  } catch {
    // Storage unavailable — fall through to the in-memory copy.
  }
  return memory.get(key) ?? null;
}

export function saveProgress(childId: string, progress: PlacementProgress): void {
  const key = keyFor(childId);
  memory.set(key, progress);
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // In-memory copy above is enough for this session.
  }
}

export function clearProgress(childId: string): void {
  const key = keyFor(childId);
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

/** Records one finished subject, replacing any earlier attempt at it. */
export function recordSubjectResult(
  childId: string,
  grade: Grade,
  age: number | null,
  result: SubjectResult,
): PlacementProgress {
  const existing = loadProgress(childId);
  const keep = (existing?.grade === grade ? existing.completed : []).filter(
    (r) => r.subject !== result.subject,
  );
  const progress: PlacementProgress = {
    grade,
    age: age ?? existing?.age ?? null,
    completed: [...keep, result],
  };
  saveProgress(childId, progress);
  return progress;
}

/** The next subject to sit, or null when the grade's list is finished. */
export function nextSubjectFor(required: Subject[], completed: SubjectResult[]): Subject | null {
  const done = new Set(completed.map((r) => r.subject));
  return required.find((s) => !done.has(s)) ?? null;
}
