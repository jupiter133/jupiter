import { useEffect, useState } from 'react';
import type { Question, Subject } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_ORDER } from '../assessment/types';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];
/** Beat between tapping an answer and the next question sliding in. Long enough
 *  to feel acknowledged, short enough that no one waits for a verdict. */
const TRANSITION_MS = 320;

interface Props {
  question: Question;
  subject: Subject;
  /** Position within the active strand, 1-based. */
  questionNumber: number;
  /** Questions in each strand, used only to render trail progress. */
  questionsPerSubject: number;
  onAnswer: (selectedAnswerId: string) => void;
}

/**
 * Screen 3 — the reusable question view, looped for the whole session.
 *
 * It never reveals whether an answer was right. Tapping an option highlights it
 * neutrally, then the screen fades to the next question. The component holds no
 * knowledge of correctness beyond passing the choice up to the engine.
 */
export function QuestionScreen({
  question,
  subject,
  questionNumber,
  questionsPerSubject,
  onAnswer,
}: Props) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Reset per item so a recycled component never carries a stale selection.
  useEffect(() => {
    setChosenId(null);
    setLeaving(false);
  }, [question.id]);

  function choose(optionId: string) {
    if (chosenId !== null) return;
    setChosenId(optionId);
    setLeaving(true);
    window.setTimeout(() => onAnswer(optionId), TRANSITION_MS);
  }

  const hasPassage = Boolean(question.passage);
  const progress = Math.min(100, (questionNumber / questionsPerSubject) * 100);
  const leg = SUBJECT_ORDER.indexOf(subject) + 1;

  return (
    <div className="stage">
      <div className="card card--tight question-screen">
        <div className="quest-bar">
          <span className="label">
            Leg {leg} · {SUBJECT_LABEL[subject]} · Stop {questionNumber}
          </span>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={questionNumber}
            aria-valuemin={0}
            aria-valuemax={questionsPerSubject}
            aria-label={`${SUBJECT_LABEL[subject]} progress`}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div
          className={`question-fade${leaving ? ' question-fade--out' : ''} question-body${
            hasPassage ? ' question-body--with-passage' : ''
          }`}
        >
          {hasPassage && (
            <section className="passage">
              {question.passageTitle && <h2 className="heading">{question.passageTitle}</h2>}
              <p className="passage__text">{question.passage}</p>
            </section>
          )}

          <div className="stack">
            <h1 className="title">{question.questionText}</h1>
            <div
              className={`options${question.options.length <= 2 || hasPassage ? ' options--single' : ''}`}
              role="group"
              aria-label="Answer choices"
            >
              {question.options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className={`option${chosenId === option.id ? ' option--chosen' : ''}`}
                  disabled={chosenId !== null}
                  onClick={() => choose(option.id)}
                >
                  <span className="option__key" aria-hidden="true">
                    {OPTION_KEYS[index] ?? index + 1}
                  </span>
                  <span>{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
