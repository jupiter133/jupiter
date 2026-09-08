import { useState } from 'react';
import type { Grade, ParentContext } from '../assessment/types';

const GRADES: Grade[] = ['K', '1', '2', '3', '4', '5', '6'];

interface Props {
  onContinue: (context: ParentContext) => void;
}

/** Screen 1 — parent-facing. Deliberately a plain form: no gamification,
 *  no mascot. This is the only place a grown-up enters data. */
export function ParentContextScreen({ onContinue }: Props) {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [learningChallenges, setLearningChallenges] = useState('');

  return (
    <div className="stage" style={{ maxWidth: 820 }}>
      <div className="card stack">
        <div className="stack stack--tight">
          <p className="label">Step 1 of 2 · For the grown-up</p>
          <h1 className="title">Let’s find the right starting point</h1>
          <p className="body">
            Two quick questions, then we’ll hand the tablet to your child for a short
            reading activity. It takes about 10 minutes and there is no pass or fail.
          </p>
        </div>

        <div className="field">
          <label className="heading" id="grade-label">
            What grade is your child in?
          </label>
          <span className="field__hint">
            We use this only to choose the first question. The activity adjusts from there.
          </span>
          <div className="grade-grid" role="group" aria-labelledby="grade-label">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                className="grade-chip"
                aria-pressed={grade === g}
                onClick={() => setGrade(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="heading" htmlFor="challenges">
            Any known learning challenges?{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>(optional)</span>
          </label>
          <span className="field__hint">
            For example dyslexia, ADHD, or an IEP. This never changes the questions your
            child sees — it helps us tailor the pacing advice in your results.
          </span>
          <textarea
            id="challenges"
            className="textarea"
            placeholder="Leave blank if none, or tell us anything that helps."
            value={learningChallenges}
            onChange={(e) => setLearningChallenges(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--primary"
            disabled={grade === null}
            onClick={() => grade && onContinue({ grade, learningChallenges: learningChallenges.trim() })}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
