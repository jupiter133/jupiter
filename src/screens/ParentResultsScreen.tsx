import type { ParentContext, PlacementResult, Subject, SubjectPlacement } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_SHORT, SUBJECT_TILE } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';

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
 * A row only reports a level when the result is a real measure of that
 * subject. A floored sitting, or one the gate never read, reads "Observed
 * only": it was sat, it is on file, and it is not a level.
 */
function levelTextFor(placement: SubjectPlacement | undefined): string {
  if (!placement) return 'Not yet assessed';
  if (placement.floored || placement.nonDetermining) return 'Observed only';
  return placement.gradeEquivalentDisplay;
}

/**
 * Screen 5 — parent-facing results, built to the assessment intro design.
 *
 * One program on the left, all seven of the track’s subjects on the right. Tier and gap
 * numbers never render; levels are said in grade-equivalent language only.
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
      <div className="card card--center">
        <div className="placement">
          <div className="placement__head">
            <p className="label placement__kicker">
              {complete ? 'Placement complete' : 'Progress saved'} · For the grown-up
            </p>
            <h1 className="title placement__title">
              {possessiveName(context?.childName ?? childName)} placement
            </h1>
          </div>

          <div className="placement__split">
            {complete && program ? (
              /* The decision. One program, one level, one button. */
              <section className="placement-card" aria-labelledby="program-name">
                <p className="label placement-card__eyebrow">{name} is placed in</p>
                <h2 id="program-name" className="placement-card__name">
                  {program.name.replace(/(\d)-(\d)/, '$1‑$2')}
                </h2>
                <p className="placement-card__level">{program.gradeEquivalentDisplay}</p>
                <button type="button" className="btn btn--primary" onClick={onRestart}>
                  Start {program.name}
                </button>
                <p className="placement-card__blurb">{program.description}</p>
              </section>
            ) : (
              /* Mid-placement: what is left, and the way back in. */
              <section className="placement-card" aria-labelledby="next-subject">
                <p className="label placement-card__eyebrow">
                  {subjects.length} of {result.requiredSubjects.length} done · next up
                </p>
                <h2 id="next-subject" className="placement-card__name">
                  {nextSubject ? SUBJECT_SHORT[nextSubject] : 'All done'}
                </h2>
                <p className="placement-card__level">A few minutes, any time</p>
                <button type="button" className="btn btn--primary" onClick={onContinue}>
                  {nextSubject ? `Start ${SUBJECT_SHORT[nextSubject]}` : 'See placement'}
                </button>
                <p className="placement-card__blurb">
                  {name} can pick this up whenever suits — nothing is lost in between.
                </p>
              </section>
            )}

            <div className="placement__rows">
              <p className="label placement__rows-heading">By subject</p>

              {result.requiredSubjects.map((subject) => {
                const placement = bySubject(subject);
                const measured = Boolean(placement && !placement.nonDetermining);
                const tile = SUBJECT_TILE[subject];
                return (
                  <div key={subject} className="placement-row">
                    <span
                      className="placement-row__name"
                      style={{ background: tile.bg, boxShadow: `0 3px 0 ${tile.edge}` }}
                    >
                      {SUBJECT_LABEL[subject]}
                    </span>
                    <span
                      className={`placement-row__value${measured ? '' : ' placement-row__value--muted'}`}
                    >
                      {levelTextFor(placement)}
                    </span>
                  </div>
                );
              })}

              {readingGated && result.track === 'grade-level' && (
                <p className="placement-explainer">
                  Reading comes first. {name} is reading below a Grade&nbsp;3 level, and
                  comprehension, vocabulary, writing and math all sit on top of reading — so the
                  other five are recorded as observations for now, and get measured once reading
                  is solid.
                </p>
              )}

              {result.track === 'little-reader' && (
                <p className="placement-explainer">
                  Reading comes first. The placement rests on Letter Sounds and Word Practice;
                  the five earlier activities are readiness, recorded as observations rather than
                  measured. At this age that is the point — {name} is starting to read, and the
                  program starts where the reading does.
                </p>
              )}

              {result.ageGradeMismatch && (
                <p className="placement-explainer">
                  Flagged for teacher review: {possessiveName(context?.childName ?? childName)} age
                  and grade are two or more years apart. A teacher will confirm the grade is the
                  right comparison before the program starts.
                </p>
              )}

              <p className="placement-footnote">
                {name} never sees a score. Placement is a starting point, not a label.
              </p>
            </div>
          </div>

          <div className="placement__restart">
            <button type="button" className="text-btn text-btn--sm" onClick={onRestart}>
              Start the placement over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
