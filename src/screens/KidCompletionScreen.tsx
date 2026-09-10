import { Teacher } from '../components/Teacher';
import { firstName } from '../assessment/childName';
import { Tag } from '../components/Tag';

interface Props {
  childName: string;
  onHandBack: () => void;
}

/**
 * Screen 4 — the child's payoff. By design this screen shows NO score, no
 * accuracy, no tier and no grade level: a badge for finishing, and a handoff.
 *
 * Laid out as two columns so the whole celebration fits a landscape tablet
 * without scrolling — the CTA must always be on screen.
 */
export function KidCompletionScreen({ childName, onHandBack }: Props) {
  const name = firstName(childName);

  return (
    <div className="stage">
      <div className="card card--center celebration-split">
        <div className="celebration-art">
          <Teacher size={300} mood="cheering" />
        </div>

        <div className="celebration-copy">
          <p className="label">Quest complete</p>
          <h1 className="display">You mapped the whole trail!</h1>
          <p className="body">
            Ms Hannah says you’re officially a <Tag color="gold">Trail Blazer</Tag>
            {name ? `, ${name}` : ''}. Every stop is on the map now.
          </p>

          <button type="button" className="btn btn--primary" onClick={onHandBack}>
            Give the tablet back to your grown-up
          </button>
        </div>
      </div>
    </div>
  );
}
