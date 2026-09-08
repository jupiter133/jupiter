import { PolarBear } from '../components/PolarBear';

interface Props {
  onStart: () => void;
}

/** Screen 2 — the handoff. The parent passes the tablet over here, and Nanuk
 *  frames what follows as a quest. The word "test" appears nowhere. */
export function HandoffScreen({ onStart }: Props) {
  return (
    <div className="stage">
      <div className="card">
        <div className="handoff">
          <PolarBear size={260} mood="greeting" />

          <div className="stack">
            <div className="speech-bubble stack stack--tight">
              <p className="label">Pass the tablet to your explorer</p>
              <h1 className="display">Hi! I’m Nanuk.</h1>
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
