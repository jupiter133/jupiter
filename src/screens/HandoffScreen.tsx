import { Teacher } from '../components/Teacher';
import { firstName } from '../assessment/childName';
import { STRAND_TAG, Tag } from '../components/Tag';
import {
  INCLUDED_STRANDS,
  coinAwardLabel,
  estimatedTimeLabel,
} from '../assessment/sessionMeta';

interface Props {
  childName: string;
  onStart: () => void;
}

/** A check in a circle, drawn to the same weight as the question glyphs. */
function Check() {
  return (
    <svg className="included-row__check" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--accent-primary)" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Screen 2 — the handoff. The parent passes the tablet over here, and Ms Hannah
 * frames what follows as a quest. The word "test" appears nowhere.
 *
 * The brief under the bubble is the last thing a grown-up reads before letting
 * go of the tablet: how long it takes, what the child earns, and what is
 * actually covered. The covered list is derived from the assessment, so it
 * cannot promise something the child is never asked.
 */
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
                I need someone to explore it with me — there’s no score and nothing to get
                wrong, just pick what you think fits.
              </p>
            </div>

            <div className="quest-brief">
              <section className="included" aria-labelledby="included-heading">
                <h2 id="included-heading" className="heading heading--sm">
                  What’s included
                </h2>
                <ul className="included-list">
                  {INCLUDED_STRANDS.map((strand) => (
                    <li key={strand.subject} className="included-row">
                      <Check />
                      <span className="included-row__body">
                        <Tag color={STRAND_TAG[strand.subject]}>{strand.label}</Tag>
                        {strand.detail && (
                          <span className="included-row__detail">{strand.detail}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="quest-stats">
                <div className="quest-stat">
                  <span className="label">Estimated time</span>
                  <span className="quest-stat__value">{estimatedTimeLabel()}</span>
                </div>
                <div className="quest-stat quest-stat--coins">
                  <span className="label">Earn</span>
                  <span className="quest-stat__value">{coinAwardLabel()}</span>
                </div>
              </div>
            </div>

            <div className="handoff__go">
              <button type="button" className="btn btn--primary" onClick={onStart}>
                Start the discovery quest
              </button>
              <span className="field__hint">One subject at a time · You can stop any time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
