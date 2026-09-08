import { useState } from 'react';
import { Glyph } from '../components/glyphs';
import { displayName, possessiveName } from '../assessment/childName';

interface Props {
  onStart: (childName: string) => void;
  onDefer: () => void;
}

/**
 * Screen 0 — the invitation. Parent-facing, so "placement" is the right word
 * here; the child never sees this screen.
 *
 * The name is optional. Personalising the headline is the point of the screen,
 * but gating entry on a text field to get it would cost more parents than it
 * wins, so blank falls back to "your child" everywhere.
 */
export function StartScreen({ onStart, onDefer }: Props) {
  const [name, setName] = useState('');

  return (
    <div className="stage stage--narrow">
      <div className="start">
        <h1 className="display start__headline">
          What lesson should{' '}
          <span className="avatar-chip" aria-hidden="true">
            <Glyph name="bearcub" size={44} />
          </span>{' '}
          {displayName(name)} begin at?
        </h1>

        <div className="field start__field">
          <label className="field__hint" htmlFor="child-name">
            Your child’s first name (optional)
          </label>
          <input
            id="child-name"
            className="text-input text-input--center"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a name"
            autoComplete="given-name"
            maxLength={24}
          />
        </div>

        <p className="body start__sub">
          Two quick questions for you, then {displayName(name)} takes over for a short
          reading, math and writing activity. About 5 minutes, and there’s no pass or fail.
        </p>

        <button type="button" className="btn btn--primary btn--large" onClick={() => onStart(name)}>
          Calculate {possessiveName(name)} placement
        </button>

        <button type="button" className="text-btn" onClick={onDefer}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
