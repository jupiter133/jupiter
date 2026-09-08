import type { ParentContext, PlacementResult } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';
import { STRAND_TAG, Tag } from '../components/Tag';

interface Props {
  context: ParentContext;
  result: PlacementResult;
  onRestart: () => void;
}

/** The one-line read across strands. Lives here, not in the engine, because
 *  this is the only layer that knows the child's name. */
function strandSummary(childName: string, result: PlacementResult): string {
  const { even, strongest, weakest } = result.profile;
  const name = displayName(childName);
  if (even) return `${name} placed at a similar level in all three strands.`;
  return `${name} is strongest in ${SUBJECT_LABEL[strongest].toLowerCase()} and has the most room to grow in ${SUBJECT_LABEL[weakest].toLowerCase()}. Inside the program, each strand is paced to ${possessiveName(childName)} own level.`;
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
 * Leads with the one thing a parent needs: the program the child is placed
 * into, with its grade-equivalent level and the button that starts it. The
 * per-strand breakdown follows as three scannable rows — it explains the
 * placement, it is not a second decision. Tier numbers are never rendered.
 */
export function ParentResultsScreen({ context, result, onRestart }: Props) {
  const name = displayName(context.childName);
  const { program } = result;
  const facts: [string, string][] = [
    ['Grade', context.grade],
    ['Questions', String(result.questionsAnswered)],
    ['Time on task', formatDuration(result.durationMs)],
  ];

  return (
    <div className="stage">
      <div className="card card--tight results">
        <div className="stack stack--tight">
          <p className="label">Discovery quest complete · For the grown-up</p>
          <h1 className="title">{possessiveName(context.childName)} placement</h1>
        </div>

        {/* The decision. One program, one button. */}
        <section className="program-hero" aria-labelledby="program-name">
          <div className="program-hero__body">
            <p className="label program-hero__eyebrow">{name} is placed in</p>
            <h2 id="program-name" className="display program-hero__name">
              {program.name}
            </h2>
            <p className="program-hero__level">
              Working at a <strong>{program.gradeEquivalentDisplay}</strong> overall
            </p>
            <p className="body body--sm program-hero__desc">{program.description}</p>
          </div>
          <button type="button" className="btn btn--primary btn--large program-hero__cta" onClick={onRestart}>
            Start {program.name}
          </button>
        </section>

        {/* The reasoning, beside the session facts on a landscape tablet. */}
        <div className="results-body">
        <section className="strands" aria-labelledby="strands-heading">
          <div className="strands__head">
            <h3 id="strands-heading" className="heading heading--sm">How {name} did by strand</h3>
            <p className="body body--sm">{strandSummary(context.childName, result)}</p>
          </div>
          <ul className="strand-list">
            {result.subjects.map((placement) => (
              <li key={placement.subject} className="strand-row" data-strand={placement.subject}>
                <div className="strand-row__head">
                  <Tag color={STRAND_TAG[placement.subject]}>{SUBJECT_LABEL[placement.subject]}</Tag>
                  <span className="strand-row__level">{placement.gradeEquivalentDisplay}</span>
                </div>
                <p className="body body--sm strand-row__summary">{placement.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="results-meta">
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
              ? `You told us: “${context.learningChallenges}” — we’ve flagged this on ${possessiveName(context.childName)} profile so lesson length and repetition adjust as ${name} goes.`
              : `We don’t show ${name} a score, and we don’t recommend sharing one. Placement moves as they learn — it’s a starting point, not a label.`}
          </p>
          <button type="button" className="text-btn text-btn--sm" onClick={onRestart}>
            Run the quest again
          </button>
        </aside>
        </div>
      </div>
    </div>
  );
}
