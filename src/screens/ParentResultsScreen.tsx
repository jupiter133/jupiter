import type { ParentContext, PlacementResult } from '../assessment/types';

interface Props {
  context: ParentContext;
  result: PlacementResult;
  onRestart: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  return `${minutes} min ${seconds} sec`;
}

/**
 * Screen 5 — parent-facing results.
 *
 * Shows grade-equivalent placement language and a recommended starting module.
 * The internal tier number is intentionally never rendered; it stays in the
 * result object for the app to consume.
 */
export function ParentResultsScreen({ context, result, onRestart }: Props) {
  return (
    <div className="stage">
      <div className="card stack">
        <div className="stack stack--tight">
          <p className="label">Discovery quest complete · For the grown-up</p>
          <h1 className="title">Here’s where your child is starting</h1>
        </div>

        <div className="results-grid">
          <div className="stack">
            <div className="panel panel--highlight stack stack--tight">
              <p className="label" style={{ color: 'var(--text-secondary)' }}>
                Reading placement
              </p>
              <h2 className="heading">{result.gradeEquivalentDisplay}</h2>
              <p className="body" style={{ color: 'var(--text-primary)' }}>
                {result.summary}
              </p>
            </div>

            <div className="panel stack stack--tight">
              <p className="label">Recommended starting point</p>
              <h2 className="heading">{result.recommendedStartingModule}</h2>
              <p className="body">
                Lessons run 8–12 minutes. We recommend one per day to start — short and
                consistent beats long and occasional for rebuilding attention.
              </p>
            </div>
          </div>

          <div className="stack">
            <div className="panel">
              <div className="stat-row">
                <span className="body">Grade you told us</span>
                <span className="stat-row__value">{context.grade}</span>
              </div>
              <div className="stat-row">
                <span className="body">Questions explored</span>
                <span className="stat-row__value">{result.questionsAnswered}</span>
              </div>
              <div className="stat-row">
                <span className="body">Time on task</span>
                <span className="stat-row__value">{formatDuration(result.durationMs)}</span>
              </div>
              <div className="stat-row">
                <span className="body">Focus areas</span>
                <span className="stat-row__value">Vocabulary · Comprehension</span>
              </div>
            </div>

            {context.learningChallenges && (
              <div className="panel stack stack--tight">
                <p className="label">What you told us</p>
                <p className="body">{context.learningChallenges}</p>
                <p className="body">
                  We’ve flagged this on the profile so lesson length and repetition can be
                  adjusted as your child works through the track.
                </p>
              </div>
            )}

            <p className="note">
              We don’t show your child a score, and we don’t recommend sharing one. Placement
              moves as they learn — it’s a starting point, not a label.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Start over
          </button>
          <button type="button" className="btn btn--primary" onClick={onRestart}>
            Go to {result.recommendedStartingModule.split(':')[0]}
          </button>
        </div>
      </div>
    </div>
  );
}
