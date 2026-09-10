import type { ParentContext, PlacementResult, Subject } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';
import { STRAND_TAG, Tag } from '../components/Tag';

interface Props {
  context: ParentContext | null;
  childName: string;
  result: PlacementResult;
  /** Hands the tablet back for the next subject sitting. */
  onContinue: () => void;
  onRestart: () => void;
}

/**
 * Screen 5 — parent-facing results.
 *
 * Renders only the subjects actually sat, so a K–3 child shows a single reading
 * row and no empty math or writing slots. Grade 4–6 sit one subject per session,
 * so mid-way this screen reports what is done and what is next; the program is
 * withheld until every required subject is finished. Tier numbers never render.
 */
export function ParentResultsScreen({
  context,
  childName,
  result,
  onContinue,
  onRestart,
}: Props) {
  const name = displayName(context?.childName ?? childName);
  const { program, subjects, nextSubject, complete } = result;

  return (
    <div className="stage">
      <div className="card card--center results">
        <p className="label">
          {complete ? 'Placement complete' : 'Progress saved'} · For the grown-up
        </p>
        <h1 className="title">{possessiveName(context?.childName ?? childName)} placement</h1>

        {complete && program ? (
          /* The decision. One program, one level, one button. */
          <section className="program-hero" aria-labelledby="program-name">
            <p className="label program-hero__eyebrow">{name} is placed in</p>
            <h2 id="program-name" className="display program-hero__name">
              {program.name}
            </h2>
            <p className="program-hero__level">{program.gradeEquivalentDisplay}</p>
            <button
              type="button"
              className="btn btn--primary btn--large program-hero__cta"
              onClick={onRestart}
            >
              Start {program.name}
            </button>
          </section>
        ) : (
          /* Mid-placement: what is left, and the way back in. */
          <section className="program-hero" aria-labelledby="next-subject">
            <p className="label program-hero__eyebrow">
              {subjects.length} of {result.requiredSubjects.length} done · next up
            </p>
            <h2 id="next-subject" className="display program-hero__name">
              {nextSubject ? SUBJECT_LABEL[nextSubject] : 'All done'}
            </h2>
            <p className="program-hero__level">
              About 3 minutes. {name} can pick this up any time.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--large program-hero__cta"
              onClick={onContinue}
            >
              {nextSubject ? `Start ${SUBJECT_LABEL[nextSubject]}` : 'See placement'}
            </button>
          </section>
        )}

        <section className="strands" aria-labelledby="strands-heading">
          <h3 id="strands-heading" className="heading heading--sm">
            {result.requiredSubjects.length === 1 ? 'Result' : 'By subject'}
          </h3>
          <ul className="strand-list">
            {subjects.map((placement) => (
              <li
                key={placement.subject}
                className="strand-row"
                data-strand={placement.subject}
              >
                <Tag color={STRAND_TAG[placement.subject]}>
                  {SUBJECT_LABEL[placement.subject]}
                </Tag>
                <span className="strand-row__level">{placement.gradeEquivalentDisplay}</span>
              </li>
            ))}
            {result.requiredSubjects
              .filter((s: Subject) => !subjects.some((p) => p.subject === s))
              .map((subject) => (
                <li
                  key={subject}
                  className="strand-row strand-row--pending"
                  data-strand={subject}
                >
                  <Tag color={STRAND_TAG[subject]}>{SUBJECT_LABEL[subject]}</Tag>
                  <span className="strand-row__level strand-row__level--pending">
                    Not yet assessed
                  </span>
                </li>
              ))}
          </ul>
        </section>

        <p className="note">
          We don’t show {name} a score. Placement is a starting point, not a label.
        </p>

        <button type="button" className="text-btn text-btn--sm" onClick={onRestart}>
          Start the placement over
        </button>
      </div>
    </div>
  );
}
