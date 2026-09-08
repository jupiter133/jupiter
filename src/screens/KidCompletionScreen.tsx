import { Badge } from '../components/Badge';
import { PolarBear } from '../components/PolarBear';
import { firstName } from '../assessment/childName';

interface Props {
  childName: string;
  coins: number;
  onHandBack: () => void;
}

/**
 * Screen 4 — the child's payoff. By design this screen shows NO score, no
 * accuracy, no tier, and no grade level. The only numbers on it are coins, which
 * are awarded for finishing rather than for being right.
 *
 * Laid out as two columns so the whole celebration fits a landscape tablet
 * without scrolling — the CTA must always be on screen.
 */
export function KidCompletionScreen({ childName, coins, onHandBack }: Props) {
  const coinPips = Array.from({ length: 5 });
  const name = firstName(childName);

  return (
    <div className="stage" style={{ maxWidth: 980 }}>
      <div className="card card--tight celebration-split">
        <div className="celebration-art">
          <Badge size={200} />
          <div className="celebration-art__mascot">
            <PolarBear size={130} mood="cheering" float={false} />
          </div>
        </div>

        <div className="celebration-copy">
          <p className="label">Quest complete</p>
          <h1 className="display">You mapped the whole trail!</h1>
          <p className="body">
            Nanuk says {name ? `you’re officially a Trail Blazer, ${name}` : 'you’re officially a Trail Blazer'}.
            Every stop is on the map now.
          </p>

          <div className="coin-row" aria-hidden="true">
            {coinPips.map((_, i) => (
              <span key={i} className="coin" style={{ animationDelay: `${300 + i * 90}ms` }} />
            ))}
          </div>
          <p className="coin-total">+{coins} coins</p>

          <button type="button" className="btn btn--primary" onClick={onHandBack}>
            Give the tablet back to your grown-up
          </button>
        </div>
      </div>
    </div>
  );
}
