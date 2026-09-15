import { Teacher } from '../components/Teacher';
import { firstName } from '../assessment/childName';
import { CoinPill } from '../components/CoinPill';
import { SUBJECT_LABEL, SUBJECT_ORDER, SUBJECT_TILE } from '../assessment/types';
import { PLACEMENT_COIN_AWARD, estimatedTimeLabel } from '../assessment/sessionMeta';

interface Props {
  childName: string;
  onStart: () => void;
}

/**
 * Screen 2 — meet Ms Hannah. The parent passes the tablet over here.
 *
 * The five numbered tiles are the whole assessment at a glance, built from
 * SUBJECT_ORDER so they cannot drift from what the child is actually asked.
 * The word "test" appears nowhere on this screen.
 */
export function HandoffScreen({ childName, onStart }: Props) {
  // Child-facing copy has no fallback for a missing name — Ms Hannah greets by
  // name or not at all.
  const name = firstName(childName);

  return (
    <div className="stage">
      <div className="card card--center">
        <div className="meet">
          <Teacher size={440} mood="greeting" />

          <div className="meet__col">
            <div className="meet-card">
              <p className="label meet-card__kicker">
                Pass the tablet to {name ?? 'your explorer'}
              </p>
              <h1 className="display meet-card__title">
                {name ? `Hi ${name}! I’m Ms Hannah.` : 'Hi! I’m Ms Hannah.'}
              </h1>
              <p className="body meet-card__lead">
                I’ve been mapping out a brand new trail and I need an explorer. There’s no
                score and nothing to get wrong — just pick what you think fits.
              </p>

              <ol className="subject-tiles">
                {SUBJECT_ORDER.map((subject, i) => {
                  const tile = SUBJECT_TILE[subject];
                  return (
                    <li
                      key={subject}
                      className="subject-tile"
                      style={{
                        background: tile.bg,
                        boxShadow: `0 4px 0 ${tile.edge}`,
                        transform: `rotate(${tile.tilt})`,
                      }}
                    >
                      <span className="subject-tile__num">{i + 1}</span>
                      <span className="subject-tile__name">{SUBJECT_LABEL[subject]}</span>
                    </li>
                  );
                })}
              </ol>

              <div className="meet-pills">
                <span className="meet-pill">{estimatedTimeLabel()} total</span>
                <CoinPill amount={`+${PLACEMENT_COIN_AWARD.toLocaleString('en-CA')} coins`} />
                <span className="meet-pill">Stop any time</span>
              </div>
            </div>

            <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
              Start the discovery quest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
