import type { ParentContext, PlacementResult } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';

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
 * Shows grade-equivalent placement language per strand and a recommended
 * starting module for each. The internal tier number is intentionally never
 * rendered; it stays in the result object for the app to consume.
 */
export function ParentResultsScreen({ context, result, onRestart }: Props) {
  return (
    <div className="stage">
      <div className="card stack">
        <div className="stack stack--tight">
          <p className="label">Discovery quest complete · For the grown-up</p>
          <h1 className="title">Here’s where your child is starting</h1>
          <p className="body">{result.recommendedStartingModule}</p>
        </div>

        <div className="subject-results">
          {result.subjects.map((placement) => (
            <div key={placement.subject} className="panel stack stack--tight">
              <p className="label">{SUBJECT_LABEL[placement.subject]}</p>
              <h2 className="heading">{placement.gradeEquivalentDisplay}</h2>
              <p className="body">{placement.summary}</p>
              <div className="panel panel--highlight" style={{ marginTop: 'auto' }}>
                <p className="label" style={{ color: 'var(--text-secondary)' }}>
                  Start here
                </p>
                <p className="body" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {placement.recommendedStartingModule}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="results-footer">
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
              <span className="body">Strands assessed</span>
              <span className="stat-row__value">Reading · Math · Writing</span>
            </div>
          </div>

          <div className="stack stack--tight">
            {context.learningChallenges && (
              <div className="panel stack stack--tight">
                <p className="label">What you told us</p>
                <p className="body">{context.learningChallenges}</p>
                <p className="body">
                  We’ve flagged this on the profile so lesson length and repetition can be
                  adjusted as your child works through the tracks.
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
            Start these tracks
          </button>
        </div>
      </div>
    </div>
  );
}
