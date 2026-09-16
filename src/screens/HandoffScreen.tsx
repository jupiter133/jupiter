import { Teacher } from '../components/Teacher';
import { firstName } from '../assessment/childName';
import { CoinPill } from '../components/CoinPill';
import type { Track } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_TILE, TRACKS } from '../assessment/types';
import { PLACEMENT_COIN_AWARD, estimatedTimeLabel, includedStrands } from '../assessment/sessionMeta';

interface Props {
  childName: string;
  /** Which assessment this child sits — chosen by age, never by this screen. */
  track: Track;
  onStart: () => void;
}

/**
 * Screen 2 — meet Ms Hannah. The parent passes the tablet over here.
 *
 * Everything on it comes from the track config: Little Readers
 * and Grade Level are different assessments with different
 * names, leads, units and tiles, and this screen renders whichever one the
 * child's age selected. The numbered tiles are built from the track's own
 * subject list so they cannot drift from what the child is actually asked.
 * The word "test" appears nowhere on this screen.
 */
export function HandoffScreen({ childName, track, onStart }: Props) {
  // Child-facing copy has no fallback for a missing name — Ms Hannah greets by
  // name or not at all.
  const name = firstName(childName);
  const config = TRACKS[track];
  const strands = includedStrands(track);

  return (
    <div className="stage">
      <div className="card card--center">
        <div className="meet">
          <Teacher size={440} mood="greeting" />

          <div className="meet__col">
            <div className="meet-card">
              <p className="label meet-card__kicker">{config.kicker}</p>
              <h1 className="display meet-card__title">
                {name ? `Hi ${name}! I’m Ms Hannah.` : 'Hi! I’m Ms Hannah.'}
              </h1>
              <p className="body meet-card__lead">{config.lead}</p>

              <ol className="subject-tiles">
                {strands.map(({ subject }, i) => {
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
                <span className="meet-pill">
                  {strands.length} {config.unitPlural}
                </span>
                <span className="meet-pill">{estimatedTimeLabel(track)}</span>
                <span className="meet-pill">{config.character}</span>
                <CoinPill amount={`+${PLACEMENT_COIN_AWARD.toLocaleString('en-CA')} coins`} />
              </div>
            </div>

            <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
              {config.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
