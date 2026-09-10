import type { ParentContext, PlacementResult, Subject, SubjectPlacement } from '../assessment/types';
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
 * What one subject row says.
 *
 * A row only reports a level when the result is a real measure of that subject.
 * A floored sitting, or one the gate never read, is reported as an observation
 * instead: it was sat, it is on file, and it is not a level. Presenting it as
 * one would invite a parent to argue with a number we do not stand behind.
 */
function levelTextFor(placement: SubjectPlacement): string {
  if (placement.floored) return 'Observed only — see note below';
  if (placement.nonDetermining) return `${placement.gradeEquivalentDisplay} · not used for placement`;
  return placement.gradeEquivalentDisplay;
}

/**
 * Screen 5 — parent-facing results.
 *
 * One program, never a program per subject. All four subjects are listed for
 * every child, because every child sits all four. Tier and gap numbers never
 * render; levels are said in grade-equivalent language only.
 */
export function ParentResultsScreen({
  context,
  childName,
  result,
  onContinue,
  onRestart,
}: Props) {
  const name = displayName(context?.childName ?? childName);
  const { program, subjects, nextSubject, complete, readingGated } = result;
  const bySubject = (subject: Subject) => subjects.find((p) => p.subject === subject);

  return (
    <div className="stage">
      <div className="card card--center results">
        <div className="results__head">
          <p className="label">
            {complete ? 'Placement complete' : 'Progress saved'} · For the grown-up
          </p>
          <h1 className="title">{possessiveName(context?.childName ?? childName)} placement</h1>
        </div>

        <div className="results-split">

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

        <div className="results-detail">
        {complete && program && <p className="body">{program.description}</p>}

        <section className="strands" aria-labelledby="strands-heading">
          <h3 id="strands-heading" className="heading heading--sm">
            By subject
          </h3>
          <ul className="strand-list">
            {result.requiredSubjects.map((subject) => {
              const placement = bySubject(subject);
              return (
                <li
                  key={subject}
                  className={`strand-row${placement ? '' : ' strand-row--pending'}`}
                  data-strand={subject}
                >
                  <Tag color={STRAND_TAG[subject]}>{SUBJECT_LABEL[subject]}</Tag>
                  <span
                    className={
                      placement && !placement.nonDetermining
                        ? 'strand-row__level'
                        : 'strand-row__level strand-row__level--pending'
                    }
                  >
                    {placement ? levelTextFor(placement) : 'Not yet assessed'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {readingGated && (
          <p className="note">
            Reading comes first. {name} is reading below a Grade 3 level, and spelling,
            writing and math all sit on top of reading — a spelling question a child
            cannot read is a reading question. So the other three are recorded as
            observations, not levels, and get measured once reading is solid.
          </p>
        )}

        {result.ageGradeMismatch && (
          <p className="note">
            Flagged for teacher review: {possessiveName(context?.childName ?? childName)} age
            and grade are two or more years apart. Placement is measured against grade, so a
            teacher will confirm this is the right comparison before the program starts.
          </p>
        )}

        <p className="note">
          We don’t show {name} a score. Placement is a starting point, not a label.
        </p>
        </div>
        </div>

        <button type="button" className="text-btn text-btn--sm" onClick={onRestart}>
          Start the placement over
        </button>
      </div>
    </div>
  );
}
