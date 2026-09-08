import { PolarBear } from '../components/PolarBear';
import { firstName } from '../assessment/childName';

interface Props {
  childName: string;
  onStart: () => void;
}

/** Screen 2 — the handoff. The parent passes the tablet over here, and Nanuk
 *  frames what follows as a quest. The word "test" appears nowhere. */
export function HandoffScreen({ childName, onStart }: Props) {
  // Child-facing copy has no fallback for a missing name — Nanuk greets by
  // name or not at all.
  const name = firstName(childName);

  return (
    <div className="stage">
      <div className="card">
        <div className="handoff">
          <PolarBear size={260} mood="greeting" />

          <div className="stack">
            <div className="speech-bubble stack stack--tight">
              <p className="label">
                Pass the tablet to {name ?? 'your explorer'}
              </p>
              <h1 className="display">{name ? `Hi ${name}! I’m Nanuk.` : 'Hi! I’m Nanuk.'}</h1>
              <p className="body" style={{ color: 'var(--text-primary)' }}>
                I’m mapping out a brand new trail, and I need a reading buddy to help me
                explore it. We’ll read some short stories and puzzle out a few words
                together.
              </p>
              <p className="body">
                There’s no score and nothing to get wrong — just pick what you think fits.
                Every stop on the trail earns you coins.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <button type="button" className="btn btn--primary" onClick={onStart}>
                Start the discovery quest
              </button>
              <span className="field__hint">About 10 minutes · You can stop any time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
