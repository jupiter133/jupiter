import { GLYPHS } from './glyphs';

const W = 620;
const H = 92;
const PAD = 34;
/** Stops sit on a gentle wave so the route reads as a trail, not a ruler. */
const MID = 52;
const AMP = 14;

function stopPoints(count: number) {
  const span = W - PAD * 2;
  return Array.from({ length: count }, (_, i) => ({
    x: PAD + (span * i) / Math.max(1, count - 1),
    y: MID + AMP * Math.sin(i * 1.15),
  }));
}

/** Smooth path through the stops, curving via the midpoint between each pair. */
function trailPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` Q ${midX} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`;
    d += ` Q ${midX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

interface Props {
  /** Stops in this strand. */
  total: number;
  /** 1-based position of the question now on screen. */
  current: number;
  /** Set briefly after an answer so the mascot hops as it moves on. */
  cheering?: boolean;
}

/**
 * The strand progress indicator: a trail of camp stops with Nanuk walking it.
 *
 * Replaces the plain bar — filling a route the mascot is walking gives the
 * child something to watch advance, and the stops make remaining effort
 * countable at a glance rather than an abstract percentage.
 */
export function TrailProgress({ total, current, cheering = false }: Props) {
  const points = stopPoints(total);
  const walked = Math.min(current, total) - 1;
  const mascotAt = points[Math.max(0, Math.min(walked, total - 1))];
  const path = trailPath(points);

  return (
    <svg
      className="trail"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Stop ${current} of ${total} on the trail`}
    >
      <path d={path} className="trail__route" />
      {/* Second copy clipped to the walked portion, so the route fills behind
          the mascot as the strand progresses. */}
      <clipPath id="trail-walked">
        <rect x="0" y="0" width={mascotAt.x} height={H} />
      </clipPath>
      <path d={path} className="trail__route trail__route--walked" clipPath="url(#trail-walked)" />

      {points.map((point, i) => {
        const done = i < walked;
        const here = i === walked;
        return (
          <g key={i} className={`trail__stop${done ? ' trail__stop--done' : ''}`}>
            <circle cx={point.x} cy={point.y} r={here ? 11 : 8} className="trail__stop-dot" />
          </g>
        );
      })}

      {/* The flag marks the end of the strand — something to walk toward. */}
      <g transform={`translate(${points[total - 1].x} ${points[total - 1].y - 34})`}>
        <line x1="0" y1="0" x2="0" y2="26" className="trail__flagpole" />
        <path d="M2 1 L20 8 L2 15 Z" className="trail__flag" />
      </g>

      <g
        className={`trail__mascot${cheering ? ' trail__mascot--cheer' : ''}`}
        style={{ transform: `translate(${mascotAt.x - 21}px, ${mascotAt.y - 44}px)` }}
      >
        <g className="trail__mascot-bob">
          <svg width="42" height="42" viewBox="0 0 100 100" overflow="visible">
            {GLYPHS.bearcub}
          </svg>
        </g>
      </g>
    </svg>
  );
}
