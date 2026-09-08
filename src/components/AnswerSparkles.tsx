/** Fixed angles rather than random, so the burst looks composed every time. */
const SPARKS = [
  { dx: -46, dy: -34, delay: 0, kind: 'star' },
  { dx: -18, dy: -52, delay: 40, kind: 'dot' },
  { dx: 14, dy: -56, delay: 20, kind: 'star' },
  { dx: 44, dy: -38, delay: 60, kind: 'dot' },
  { dx: 0, dy: -30, delay: 90, kind: 'star' },
] as const;

/**
 * The small pop that plays on the option a child just tapped.
 *
 * It fires on every answer regardless of correctness — it acknowledges the tap,
 * it does not judge it. Nothing here may ever vary by whether the answer was
 * right, or the whole no-feedback rule leaks through the animation.
 */
export function AnswerSparkles() {
  return (
    <span className="sparkles" aria-hidden="true">
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className={`spark spark--${spark.kind}`}
          style={
            {
              '--spark-dx': `${spark.dx}px`,
              '--spark-dy': `${spark.dy}px`,
              animationDelay: `${spark.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
