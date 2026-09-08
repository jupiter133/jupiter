import type { ParentContext, PlacementResult } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';

interface Props {
  context: ParentContext;
  result: PlacementResult;
  onRestart: () => void;
}

/** The overall read across strands. Lives here, not in the engine, because it
 *  is the only layer that knows the child's name. */
function overallSummary(childName: string, result: PlacementResult): string {
  const { even, strongest, weakest } = result.profile;
  const name = displayName(childName);
  if (even) {
    return `${name} places at a similar level across all three strands. Start with ${result.recommendedStartingModule} and run the three tracks together.`;
  }
  return `${name} is strongest in ${SUBJECT_LABEL[strongest].toLowerCase()} and has the most room to grow in ${SUBJECT_LABEL[weakest].toLowerCase()}. Each strand starts at its own level — no single grade label fits all three.`;
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
 *
 * Budgeted to fit the tablet screen without scrolling: three strand cards in a
 * row, session facts as a single chip strip rather than a stacked panel.
 */
export function ParentResultsScreen({ context, result, onRestart }: Props) {
  const facts: [string, string][] = [
    ['Grade', context.grade],
    ['Questions', String(result.questionsAnswered)],
    ['Time on task', formatDuration(result.durationMs)],
    ['Strands', 'Reading · Math · Writing'],
  ];

  return (
    <div className="stage">
      <div className="card card--tight results">
        <div className="stack stack--tight">
          <p className="label">Discovery quest complete · For the grown-up</p>
          <h1 className="title">Here’s where {displayName(context.childName)} is starting</h1>
          <p className="body body--sm">{overallSummary(context.childName, result)}</p>
        </div>

        <div className="subject-results">
          {result.subjects.map((placement) => (
            <div key={placement.subject} className="panel panel--strand" data-strand={placement.subject}>
              <p className="label">{SUBJECT_LABEL[placement.subject]}</p>
              <h2 className="heading heading--sm">{placement.gradeEquivalentDisplay}</h2>
              <p className="body body--sm">{placement.summary}</p>
              <div className="start-here">
                <span className="label">Start here</span>
                <span className="start-here__module">{placement.recommendedStartingModule}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="results-meta">
          <dl className="fact-strip">
            {facts.map(([term, value]) => (
              <div key={term} className="fact">
                <dt className="label">{term}</dt>
                <dd className="fact__value">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="note">
            {context.learningChallenges
              ? `You told us: “${context.learningChallenges}” — we’ve flagged this on ${possessiveName(context.childName)} profile so lesson length and repetition adjust through the tracks.`
              : `We don’t show ${displayName(context.childName)} a score, and we don’t recommend sharing one. Placement moves as they learn — it’s a starting point, not a label.`}
          </p>
        </div>

        <div className="results-actions">
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
