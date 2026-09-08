import type { ParentContext, PlacementResult } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';
import { STRAND_TAG, Tag } from '../components/Tag';

interface Props {
  context: ParentContext;
  result: PlacementResult;
  onRestart: () => void;
}

/**
 * Screen 5 — parent-facing results, kept to what a parent needs at a glance:
 * the one program the child is placed into, its level, the button that
 * starts it, and a three-line read of how the strands compare. Everything
 * else (per-strand narrative, session facts, the learning-challenges echo)
 * stays in the result object for the profile; it is not on this page.
 * Tier numbers are never rendered.
 */
export function ParentResultsScreen({ context, result, onRestart }: Props) {
  const name = displayName(context.childName);
  const { program, profile } = result;

  return (
    <div className="stage">
      <div className="card card--center results">
        <p className="label">Discovery quest complete · For the grown-up</p>
        <h1 className="title">{possessiveName(context.childName)} placement</h1>

        {/* The decision. One program, one level, one button. */}
        <section className="program-hero" aria-labelledby="program-name">
          <p className="label program-hero__eyebrow">{name} is placed in</p>
          <h2 id="program-name" className="display program-hero__name">
            {program.name}
          </h2>
          <p className="program-hero__level">{program.gradeEquivalentDisplay}</p>
          <button type="button" className="btn btn--primary btn--large program-hero__cta" onClick={onRestart}>
            Start {program.name}
          </button>
        </section>

        {/* The strands, one line each. */}
        <section className="strands" aria-labelledby="strands-heading">
          <h3 id="strands-heading" className="heading heading--sm">By strand</h3>
          <ul className="strand-list">
            {result.subjects.map((placement) => (
              <li key={placement.subject} className="strand-row" data-strand={placement.subject}>
                <Tag color={STRAND_TAG[placement.subject]}>{SUBJECT_LABEL[placement.subject]}</Tag>
                <span className="strand-row__level">{placement.gradeEquivalentDisplay}</span>
              </li>
            ))}
          </ul>
          {!profile.even && (
            <p className="body body--sm strands__note">
              Strongest in {SUBJECT_LABEL[profile.strongest].toLowerCase()} · most room to grow in{' '}
              {SUBJECT_LABEL[profile.weakest].toLowerCase()}
            </p>
          )}
        </section>

        <p className="note">
          We don’t show {name} a score. Placement is a starting point, not a label.
        </p>

        <button type="button" className="text-btn text-btn--sm" onClick={onRestart}>
          Run the quest again
        </button>
      </div>
    </div>
  );
}
