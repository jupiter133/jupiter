import { useState } from 'react';
import type { ParentContext } from '../assessment/types';
import { GRADES, GRADE_LABEL, MAX_AGE, MIN_AGE, hasAgeGradeMismatch } from '../assessment/types';
import type { Grade } from '../assessment/types';
import { displayName } from '../assessment/childName';

const AGES: number[] = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

interface Props {
  /** From the child's profile; carried through, never re-asked. */
  childName: string;
  /** From the account, set at sign-up. null means it was never captured. */
  knownAge: number | null;
  knownGrade: Grade | null;
  onContinue: (context: ParentContext) => void;
}

/**
 * Screen 1 — the grown-up setup, built to the assessment intro design: two
 * numbered cards, nothing else to do.
 *
 * Age and grade come from the account, so the normal path is a glance and one
 * tap. They are shown rather than hidden because a grade goes stale every
 * September and a placement measured against the wrong grade is wrong in a way
 * nobody downstream can see. Change opens the two selects; when sign-up never
 * captured one, they are open from the start.
 */
export function ParentContextScreen({ childName, knownAge, knownGrade, onContinue }: Props) {
  const [age, setAge] = useState<number | null>(knownAge);
  const [grade, setGrade] = useState<Grade | null>(knownGrade);
  const [editing, setEditing] = useState(knownAge === null || knownGrade === null);
  const [learningChallenges, setLearningChallenges] = useState('');

  // Shown, never blocking: an unusual pairing is a fact about the child, not an
  // input error, and the parent is the one who knows why.
  const mismatch = age !== null && grade !== null && hasAgeGradeMismatch(age, grade);
  const name = displayName(childName);
  const ready = age !== null && grade !== null;
  const ageGradeLabel = ready ? `Age ${age} · ${GRADE_LABEL[grade]}` : 'Not set yet';

  return (
    <div className="stage">
      <div className="card card--center">
        <div className="setup">
          <div className="setup__head">
            <p className="label setup__kicker">Step 1 of 2 · For the grown-up</p>
            <h1 className="title setup__title">First, two quick things from you</h1>
            <p className="body setup__lead">
              Check the details below, then hand the tablet to {name} for their part.
            </p>
          </div>

          <section className="setup-card">
            <span className="setup-card__num" aria-hidden="true">1</span>
            <div className="setup-card__body">
              <h2 className="setup-card__title">
                Is this {name}? <span className="setup-card__aside">· from your account</span>
              </h2>

              <div className="setup-card__value-row">
                <p className="setup-card__value">{ageGradeLabel}</p>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => setEditing((open) => !open)}
                >
                  {editing ? 'Done' : 'Change'}
                </button>
              </div>

              {editing && (
                <div className="setup-edit">
                  <label className="field-select">
                    Age
                    <select
                      className="select"
                      value={age ?? ''}
                      onChange={(e) => setAge(e.target.value === '' ? null : Number(e.target.value))}
                    >
                      <option value="" disabled>
                        Choose
                      </option>
                      {AGES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-select">
                    Grade
                    <select
                      className="select"
                      value={grade ?? ''}
                      onChange={(e) =>
                        setGrade(e.target.value === '' ? null : (e.target.value as Grade))
                      }
                    >
                      <option value="" disabled>
                        Choose
                      </option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {GRADE_LABEL[g]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <p className="setup-card__hint">
                Age sets how activities look and sound; grade is what their placement is measured
                against.
              </p>

              {mismatch && (
                <p className="note setup-card__flag">
                  That age and grade are a couple of years apart. Nothing is wrong — we’ll flag it
                  on your results so a teacher can take a look.
                </p>
              )}
            </div>
          </section>

          <section className="setup-card">
            <span className="setup-card__num" aria-hidden="true">2</span>
            <div className="setup-card__body">
              <h2 className="setup-card__title" id="challenges-label">
                Anything we should know? <span className="setup-card__aside">(optional)</span>
              </h2>
              <p className="setup-card__hint">
                For example dyslexia, ADHD, or an IEP. It never changes the questions — it only
                shapes the pacing advice in your results.
              </p>
              <textarea
                aria-labelledby="challenges-label"
                className="textarea textarea--short"
                placeholder="Leave blank if none, or tell us anything that helps."
                value={learningChallenges}
                onChange={(e) => setLearningChallenges(e.target.value)}
              />
            </div>
          </section>

          <div className="setup__go">
            <button
              type="button"
              className="btn btn--primary btn--large"
              disabled={!ready}
              onClick={() =>
                ready &&
                onContinue({
                  childName,
                  age: age as number,
                  grade: grade as Grade,
                  learningChallenges: learningChallenges.trim(),
                })
              }
            >
              Looks right — {name}’s turn
            </button>
            <span className="field__hint">Next: hand the tablet to {name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
