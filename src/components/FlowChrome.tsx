/**
 * Global chrome from the assessment intro design: nine progress pills in the
 * top-right, and a back link at the foot of every step except the first.
 *
 * The nine map to the design's steps: hook, grown-up setup, meet Ms Hannah,
 * the five subjects, results.
 */
export const FLOW_STEPS = 9;

interface Props {
  /** 0-based, 0–8. */
  current: number;
  onBack: (() => void) | null;
}

export function FlowChrome({ current, onBack }: Props) {
  return (
    <>
      <div className="flow-dots" role="progressbar" aria-valuemin={1} aria-valuemax={FLOW_STEPS} aria-valuenow={current + 1} aria-label={`Step ${current + 1} of ${FLOW_STEPS}`}>
        {Array.from({ length: FLOW_STEPS }, (_, i) => (
          <span
            key={i}
            className={`flow-dot${i === current ? ' flow-dot--current' : i < current ? ' flow-dot--done' : ''}`}
          />
        ))}
      </div>
      {onBack && (
        <button type="button" className="flow-back" onClick={onBack}>
          ← Back
        </button>
      )}
    </>
  );
}
