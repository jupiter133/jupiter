import { useState } from 'react';
import type { ParentContext } from '../assessment/types';
import { GRADES, GRADE_LABEL, GRADE_SHORT, MAX_AGE, MIN_AGE, hasAgeGradeMismatch } from '../assessment/types';
import type { Grade } from '../assessment/types';
import { displayName, possessiveName } from '../assessment/childName';

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
 * Screen 1 — parent-facing. A plain form: no gamification, no guide character.
 *
 * Age and grade come from the account, so the normal path is a glance and one
 * tap on Continue. They are shown rather than hidden because a grade goes stale
 * every September and a placement measured against the wrong grade is wrong in
 * a way nobody downstream can see. Tapping Change opens the pickers; when
 * sign-up never captured one, the pickers are open from the start.
 */
export function ParentContextScreen({ childName, knownAge, knownGrade, onContinue }: Props) {
  const [age, setAge] = useState<number | null>(knownAge);
  const [grade, setGrade] = useState<Grade | null>(knownGrade);
  // Anything the account is missing has to be asked for straight away.
  const [editing, setEditing] = useState(knownAge === null || knownGrade === null);
  const [learningChallenges, setLearningChallenges] = useState('');

  // Shown, never blocking: an unusual pairing is a fact about the child, not an
  // input error, and the parent is the one who knows why.
  const mismatch = age !== null && grade !== null && hasAgeGradeMismatch(age, grade);
  const name = displayName(childName);

  return (
    <div className="stage">
      <div className="card stack">
        <div className="stack stack--tight">
          <p className="label">Step 1 of 2 · For the grown-up</p>
          <h1 className="title">Let’s find {possessiveName(childName)} starting point</h1>
          <p className="body">
            {editing ? 'A couple of questions' : 'A quick check'}, then we’ll hand the tablet
            over. {name} does four short activities — reading, spelling, writing and math —
            one at a time, and can stop and pick up again whenever. There is no pass or fail.
          </p>
        </div>

        {editing ? (
          <div className="intake-pair">
            <div className="field">
              <label className="heading" id="age-label">
                How old is {name}?
              </label>
              <span className="field__hint">
                Sets how the activity looks and sounds. Never changes the placement.
              </span>
              <div className="grade-grid grade-grid--age" role="group" aria-labelledby="age-label">
                {AGES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="grade-chip"
                    aria-pressed={age === a}
                    onClick={() => setAge(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="heading" id="grade-label">
                What grade is {name} in?
              </label>
              <span className="field__hint">What the placement is measured against.</span>
              <div className="grade-grid grade-grid--grade" role="group" aria-labelledby="grade-label">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className="grade-chip"
                    aria-pressed={grade === g}
                    aria-label={GRADE_LABEL[g]}
                    title={GRADE_LABEL[g]}
                    onClick={() => setGrade(g)}
                  >
                    {GRADE_SHORT[g]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* The account already knows both. Confirm at a glance, edit if wrong. */
          <div className="known">
            <div className="known__facts">
              <p className="label known__source">From your account</p>
              <p className="known__value">
                Age {age} · {GRADE_LABEL[grade!]}
              </p>
              <span className="field__hint">
                Age sets how the activity looks and sounds. Grade is what the placement is
                measured against.
              </span>
            </div>
            <button type="button" className="btn btn--ghost known__edit" onClick={() => setEditing(true)}>
              Change
            </button>
          </div>
        )}

        {mismatch && (
          <p className="note">
            That age and grade are a couple of years apart. Nothing is wrong — we’ll just
            flag it on your results so a teacher can take a look at the placement.
          </p>
        )}

        <div className="field">
          <label className="heading" htmlFor="challenges">
            Any known learning challenges?{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>(optional)</span>
          </label>
          <span className="field__hint">
            For example dyslexia, ADHD, or an IEP. It never changes the questions — it
            shapes the pacing advice in your results.
          </span>
          <textarea
            id="challenges"
            className="textarea textarea--short"
            placeholder="Leave blank if none, or tell us anything that helps."
            value={learningChallenges}
            onChange={(e) => setLearningChallenges(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--primary"
            disabled={grade === null || age === null}
            onClick={() =>
              grade !== null &&
              age !== null &&
              onContinue({
                childName,
                age,
                grade,
                learningChallenges: learningChallenges.trim(),
              })
            }
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
