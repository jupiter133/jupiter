import { useEffect, useState } from 'react';
import type { AgeBand, Question, Subject } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_ORDER, questionTextFor } from '../assessment/types';
import { Illustration } from '../components/Illustration';
import { AnswerSparkles } from '../components/AnswerSparkles';
import { STRAND_TAG, Tag } from '../components/Tag';
import { useSpeech } from '../audio/useSpeech';
import { speechRateFor, speechScriptFor } from '../audio/speechScript';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];
/**
 * Beat between tapping an answer and the next question arriving. Long enough
 * for the sparkles to land, short enough that nobody
 * starts waiting for a verdict that is never coming.
 */
const TRANSITION_MS = 620;

interface Props {
  question: Question;
  subject: Subject;
  /** Presentation mode, from the grade the parent entered — not from the tier. */
  band: AgeBand;
  /** Position within the active strand, 1-based. */
  questionNumber: number;
  /** Questions in each strand, used only to render progress. */
  questionsPerSubject: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onAnswer: (selectedAnswerId: string) => void;
}

/**
 * Screen 3 — the reusable question view, looped for the whole session.
 *
 * It never reveals whether an answer was right. Tapping an option highlights it
 * neutrally, sparkles pop, and the card slides on. Every one of those plays
 * identically for a right and a wrong answer — the component is not told which it was, it only passes the choice up.
 *
 * Presentation scales with the age band:
 *  - junior (K–3): the illustration leads, wording is the short variant,
 *    picture answers render in the buttons, and read-aloud starts on.
 *  - senior (4–6): text leads, art is a smaller supporting strip, picture
 *    answers are suppressed, and read-aloud is available but off by default.
 */
export function QuestionScreen({
  question,
  subject,
  band,
  questionNumber,
  questionsPerSubject,
  audioEnabled,
  onToggleAudio,
  onAnswer,
}: Props) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { supported: canSpeak, speaking, speak, stop } = useSpeech();

  const script = speechScriptFor(question, band);
  const rate = speechRateFor(band);

  // Reset per item so a recycled component never carries a stale selection.
  useEffect(() => {
    setChosenId(null);
    setLeaving(false);
  }, [question.id]);

  // Auto-read when the preference is on. Replays are the button's job.
  useEffect(() => {
    if (audioEnabled) speak(script, rate);
    return stop;
    // Re-reading is keyed to the item and the preference, not to every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, audioEnabled]);

  function choose(optionId: string) {
    if (chosenId !== null) return;
    stop();
    setChosenId(optionId);
    setLeaving(true);
    window.setTimeout(() => onAnswer(optionId), TRANSITION_MS);
  }

  const isJunior = band === 'junior';
  const hasPassage = Boolean(question.passage);
  const showOptionArt = isJunior && question.options.some((o) => o.art);
  /* Sentence-length answers read better one-up; two columns wrap them into
     three or four lines each. */
  const longOptions = question.options.some((o) => o.text.length > 36);
  const leg = SUBJECT_ORDER.indexOf(subject) + 1;
  const progress = Math.min(100, (questionNumber / questionsPerSubject) * 100);
  const prompt = questionTextFor(question, band);

  return (
    <div className="stage">
      <div className={`card card--tight question-screen question-screen--${band}`}>
        <div className="quest-bar">
          <span className="label">
            Leg {leg} · <Tag color={STRAND_TAG[subject]}>{SUBJECT_LABEL[subject]}</Tag> · Stop{' '}
            {questionNumber}
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
          {canSpeak && (
            <div className="audio-controls">
              <button
                type="button"
                className={`icon-btn${speaking ? ' icon-btn--active' : ''}`}
                onClick={() => (speaking ? stop() : speak(script, rate))}
                aria-label={speaking ? 'Stop reading' : 'Read this out loud'}
              >
                <SpeakerIcon speaking={speaking} />
                <span className="icon-btn__text">{speaking ? 'Stop' : 'Read to me'}</span>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                onClick={onToggleAudio}
                aria-pressed={audioEnabled}
                aria-label="Read every question out loud automatically"
              >
                {audioEnabled ? 'Auto-read on' : 'Auto-read off'}
              </button>
            </div>
          )}
        </div>

        <div
          key={question.id}
          className={`question-body question-anim${leaving ? ' question-anim--out' : ''}${
            hasPassage ? ' question-body--with-passage' : ''
          }${longOptions && !showOptionArt ? ' question-body--long' : ''}`}
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
                showOptionArt
                  ? ' options--picture'
                  : hasPassage || longOptions
                    ? ' options--single'
                    : ''
              }${longOptions && !showOptionArt ? ' options--long' : ''}`}
              role="group"
              aria-label="Answer choices"
            >
              {question.options.map((option, index) => (
                /* The answer and its speaker are siblings, not nested — a
                   button inside a button is invalid, and the speaker must be
                   able to fire without choosing the answer. */
                <div
                  key={option.id}
                  className={`option-row${showOptionArt ? ' option-row--picture' : ''}`}
                >
                  <button
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
                    {chosenId === option.id && <AnswerSparkles />}
                  </button>
                  {canSpeak && (
                    <button
                      type="button"
                      className="option__speak"
                      disabled={chosenId !== null}
                      onClick={() => speak([option.text], rate)}
                      aria-label={`Read answer ${OPTION_KEYS[index] ?? index + 1}: ${option.text}`}
                    >
                      <SpeakerIcon speaking={false} size={22} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeakerIcon({ speaking, size = 26 }: { speaking: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        className={speaking ? 'speaker-wave speaker-wave--on' : 'speaker-wave'}
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
