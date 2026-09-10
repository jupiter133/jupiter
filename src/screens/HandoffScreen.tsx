import { Teacher } from '../components/Teacher';
import { firstName } from '../assessment/childName';

interface Props {
  childName: string;
  onStart: () => void;
}

/** Screen 2 — the handoff. The parent passes the tablet over here, and Ms Hannah
 *  frames what follows as a quest. The word "test" appears nowhere. */
export function HandoffScreen({ childName, onStart }: Props) {
  // Child-facing copy has no fallback for a missing name — Ms Hannah greets by
  // name or not at all.
  const name = firstName(childName);

  return (
    <div className="stage">
      <div className="card card--center">
        <div className="handoff">
          <Teacher size={260} mood="greeting" />

          <div className="stack">
            <div className="speech-bubble stack stack--tight">
              <p className="label">
                Pass the tablet to {name ?? 'your explorer'}
              </p>
              <h1 className="display">{name ? `Hi ${name}! I’m Ms Hannah.` : 'Hi! I’m Ms Hannah.'}</h1>
              <p className="body" style={{ color: 'var(--text-primary)' }}>
                I’m one of the teachers here, and I’ve been mapping out a brand new trail.
                I need someone to explore it with me — we’ll read a few short stories, spell
                some words, fix up some sentences, and work out some numbers together.
              </p>
              <p className="body">
                There’s no score and nothing to get wrong — just pick what you think fits.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <button type="button" className="btn btn--primary" onClick={onStart}>
                Start the discovery quest
              </button>
              <span className="field__hint">About 5 minutes · You can stop any time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
