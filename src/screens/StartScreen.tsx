import head from '../assets/ms-hannah-head.png';
import { displayName, possessiveName } from '../assessment/childName';
import { CoinPill } from '../components/CoinPill';
import { PLACEMENT_COIN_AWARD, estimatedTimeLabel } from '../assessment/sessionMeta';

interface Props {
  childName: string;
  /** True when a stored placement is part-finished. */
  isResuming: boolean;
  /** Copy for what the next sitting covers, e.g. "Mathematics". */
  nextSubjectLabel: string | null;
  onStart: () => void;
  onDefer: () => void;
}

/**
 * Screen 0 — the parent hook. Parent-facing, so "placement" is the right word
 * here; the child never sees this screen.
 *
 * The name and avatar come from the child's profile rather than a field on
 * this screen — by the time a parent gets here the app already knows who they
 * are placing.
 */
export function StartScreen({
  childName,
  isResuming,
  nextSubjectLabel,
  onStart,
  onDefer,
}: Props) {
  const name = displayName(childName);

  return (
    <div className="stage">
      <div className="start hook">
        <p className="label hook__kicker">Placement check</p>

        <h1 className="display hook__headline">
          {isResuming ? 'Pick up where' : 'Where should'}{' '}
          <span className="avatar-chip" aria-hidden="true">
            <img className="avatar-chip__img" src={head} alt="" draggable={false} />
          </span>{' '}
          {name} <span style={{ whiteSpace: 'nowrap' }}>{isResuming ? 'left off' : 'begin?'}</span>
        </h1>

        <p className="body hook__lead">
          {isResuming
            ? `${nextSubjectLabel ?? 'The next subject'} is next. A few minutes, and ${name} can stop again any time.`
            : `A few quick questions for you, then ${name} takes over. About 3 minutes per subject — and there’s no pass or fail.`}
        </p>

        <div className="hook-stats">
          <div className="hook-stat">
            <span className="label">Takes about</span>
            <span className="hook-stat__value">{estimatedTimeLabel()}</span>
          </div>
          <div className="hook-stat">
            <span className="label">{name} earns</span>
            <CoinPill amount={`+${PLACEMENT_COIN_AWARD.toLocaleString('en-CA')}`} />
          </div>
        </div>

        <div className="hook__go">
          <button type="button" className="btn btn--primary btn--large" onClick={onStart}>
            {isResuming
              ? `Continue ${possessiveName(childName)} placement`
              : `Find ${possessiveName(childName)} starting point`}
          </button>
          <button type="button" className="text-btn" onClick={onDefer}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
