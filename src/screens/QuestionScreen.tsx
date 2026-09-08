import { useEffect, useState } from 'react';
import type { AgeBand, Question, Subject } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_ORDER, questionTextFor } from '../assessment/types';
import { Illustration } from '../components/Illustration';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];
/** Beat between tapping an answer and the next question sliding in. Long enough
 *  to feel acknowledged, short enough that no one waits for a verdict. */
const TRANSITION_MS = 320;

interface Props {
  question: Question;
  subject: Subject;
  /** Presentation mode, from the grade the parent entered — not from the tier. */
  band: AgeBand;
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
 *
 * Presentation scales with the age band:
 *  - junior (K–3): the illustration leads, wording is the short variant, and
 *    picture answers render inside the option buttons.
 *  - senior (4–6): text leads, the illustration is a smaller supporting strip,
 *    and picture answers are suppressed so options stay word-based.
 */
export function QuestionScreen({
  question,
  subject,
  band,
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

  const isJunior = band === 'junior';
  const hasPassage = Boolean(question.passage);
  const showOptionArt = isJunior && question.options.some((o) => o.art);
  const progress = Math.min(100, (questionNumber / questionsPerSubject) * 100);
  const leg = SUBJECT_ORDER.indexOf(subject) + 1;
  const prompt = questionTextFor(question, band);

  return (
    <div className="stage">
      <div className={`card card--tight question-screen question-screen--${band}`}>
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
              {/* Junior readers get the scene above the text as a way in. */}
              {isJunior && question.art && <Illustration art={question.art} />}
              {question.passageTitle && <h2 className="heading">{question.passageTitle}</h2>}
              <p className="passage__text">{question.passage}</p>
            </section>
          )}

          <div className="stack">
            {/* Without a passage the art heads the question. Senior keeps it, at
                a smaller size, so the screen stays friendly without being babyish. */}
            {!hasPassage && question.art && (
              <div className={`art-panel art-panel--${band}`}>
                <Illustration art={question.art} />
              </div>
            )}

            <h1 className={isJunior ? 'display' : 'title'}>{prompt}</h1>

            <div
              className={`options${
                showOptionArt ? ' options--picture' : hasPassage ? ' options--single' : ''
              }`}
              role="group"
              aria-label="Answer choices"
            >
              {question.options.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  className={`option${chosenId === option.id ? ' option--chosen' : ''}${
                    showOptionArt ? ' option--picture' : ''
                  }`}
                  disabled={chosenId !== null}
                  onClick={() => choose(option.id)}
                >
                  {showOptionArt && option.art ? (
                    <Illustration art={option.art} variant="option" />
                  ) : (
                    <span className="option__key" aria-hidden="true">
                      {OPTION_KEYS[index] ?? index + 1}
                    </span>
                  )}
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
