import { Glyph } from '../components/glyphs';
import { displayName, possessiveName } from '../assessment/childName';

interface Props {
  childName: string;
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
export function StartScreen({ childName, onStart, onDefer }: Props) {
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
          Two quick questions for you, then {displayName(childName)} takes over for a short
          reading, math and writing activity. About 5 minutes, and there’s no pass or fail.
        </p>

        <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
          Calculate {possessiveName(childName)} placement
        </button>

        <button type="button" className="text-btn" onClick={onDefer}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
