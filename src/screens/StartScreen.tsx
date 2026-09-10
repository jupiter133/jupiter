import { Glyph } from '../components/glyphs';
import { displayName, possessiveName } from '../assessment/childName';

interface Props {
  childName: string;
  /** True when a stored placement is part-finished. */
  isResuming: boolean;
  /** Copy for what the next sitting covers, e.g. "Math". */
  nextSubjectLabel: string | null;
  onStart: () => void;
  onDefer: () => void;
}

/**
 * Screen 0 — the invitation. Parent-facing, so "placement" is the right word
 * here; the child never sees this screen.
 *
 * The name comes from the child's profile rather than a field on this screen —
 * by the time a parent gets here the app already knows who they're placing.
 */
export function StartScreen({
  childName,
  isResuming,
  nextSubjectLabel,
  onStart,
  onDefer,
}: Props) {
  return (
    <div className="stage">
      <div className="start">
        <h1 className="display start__headline">
          What lesson should{' '}
          <span className="avatar-chip" aria-hidden="true">
            <Glyph name="teacher" size={44} />
          </span>{' '}
          {displayName(childName)} begin at?
        </h1>

        <p className="body start__sub">
          {isResuming
            ? `Picking up where ${displayName(childName)} left off${nextSubjectLabel ? ` — ${nextSubjectLabel} is next` : ''}. About 3 minutes, and there’s no pass or fail.`
            : `A couple of quick questions for you, then ${displayName(childName)} takes over. About 3 minutes per subject, and there’s no pass or fail.`}
        </p>

        <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
          {isResuming
            ? `Continue ${possessiveName(childName)} placement`
            : `Calculate ${possessiveName(childName)} placement`}
        </button>

        <button type="button" className="text-btn" onClick={onDefer}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
