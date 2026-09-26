import { useEffect, useRef, useState } from 'react';
import type { AgeBand, Question, Subject } from '../assessment/types';
import {
  SUBJECT_LABEL,
  heardTextFor,
  isDragQuestion,
  isListenQuestion,
  isMatchQuestion,
  isNumberQuestion,
  isOddQuestion,
  isPairQuestion,
  isOrderQuestion,
  isWriteQuestion,
  isStudyPassage,
  isStudyQuestion,
  questionTextFor,
} from '../assessment/types';
import { Illustration } from '../components/Illustration';
import { AnswerSparkles } from '../components/AnswerSparkles';
import { DragAnswer } from '../components/DragAnswer';
import { OrderAnswer } from '../components/OrderAnswer';
import { WriteAnswer } from '../components/WriteAnswer';
import { NumberAnswer } from '../components/NumberAnswer';
import { MatchAnswer } from '../components/MatchAnswer';
import { PairAnswer } from '../components/PairAnswer';
import { markSentence } from '../assessment/sentenceScoring';
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

/**
 * Replays of the spoken word, after the one it opens with.
 *
 * A limit at all is a product decision, not a technical one: unlimited
 * replays turn a spelling item into a listening-comprehension item, and the
 * child can sit on one word forever. Three is generous enough that no child
 * loses a word for mis-hearing it once.
 */
const SPELLING_REPLAYS = 3;

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
  onAnswer: (
    selectedAnswerId: string,
    options?: { scored?: boolean; correct?: boolean; writtenAnswer?: string },
  ) => void;
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
/** A study item runs in three beats: read it, confirm, then answer it. */
type StudyPhase = 'study' | 'confirm' | 'recall';

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
  const isStudy = isStudyQuestion(question);
  const studiesPassage = isStudyPassage(question);
  const isListen = isListenQuestion(question);
  const isDrag = isDragQuestion(question);
  const isOrder = isOrderQuestion(question);
  const isWrite = isWriteQuestion(question);
  const isNumber = isNumberQuestion(question);
  const isMatch = isMatchQuestion(question);
  const isPair = isPairQuestion(question);
  const isOdd = isOddQuestion(question);
  const [replaysLeft, setReplaysLeft] = useState(SPELLING_REPLAYS);
  const [phase, setPhase] = useState<StudyPhase>(isStudy ? 'study' : 'recall');
  const { supported: canSpeak, speaking, speak, stop } = useSpeech();

  const script = speechScriptFor(question, band);
  const rate = speechRateFor(band);

  // Reset per item so a recycled component never carries a stale selection.
  useEffect(() => {
    setChosenId(null);
    setLeaving(false);
    setPhase(isStudyQuestion(question) ? 'study' : 'recall');
    setReplaysLeft(SPELLING_REPLAYS);
  }, [question.id]);

  // Auto-read when the preference is on. Replays are the button's job.
  useEffect(() => {
    if (isListenQuestion(question)) {
      speak([heardTextFor(question)], rate);
      return stop;
    }
    if (!audioEnabled) return;
    if (phase === 'study') {
      speak(
        isStudyPassage(question)
          ? [question.passageTitle ?? '', question.passage ?? '']
          : [question.studyWord ?? '', question.studyMeaning ?? ''],
        rate,
      );
    }
    else if (phase === 'recall') speak(script, rate);
    return stop;
    // Re-reading is keyed to the item and the preference, not to every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, audioEnabled, phase]);

  function commitWritten(written: string) {
    if (chosenId !== null) return;
    stop();
    setChosenId(written);
    setLeaving(true);
    const marks = markSentence(written, { requiredWords: question.requiredWords ?? [] });
    window.setTimeout(
      () => onAnswer(written, { scored: true, correct: marks.correct, writtenAnswer: written }),
      TRANSITION_MS,
    );
  }

  function choose(optionId: string) {
    if (chosenId !== null) return;
    stop();
    setChosenId(optionId);
    setLeaving(true);
    /* A spelling item with no voice to read the word cannot measure spelling
       from dictation. The answer is still recorded — it is on file — but it is
       not scored, the same as an unjudged spoken take. Better a gap a teacher
       can see than a number nobody measured. */
    const scored = !(isListen && !canSpeak);
    window.setTimeout(() => onAnswer(optionId, { scored }), TRANSITION_MS);
  }

  const isJunior = band === 'junior';
  const hasPassage = Boolean(question.passage) && !isStudy;
  const showOptionArt = isJunior && question.options.some((o) => o.art);
  /* Picture-only answers — Shapes & Colors. Nothing is written on the cards,
     so the picture is the whole target and gets the whole card; a per-option
     speaker would also have nothing to say. */
  const wordlessOptions =
    showOptionArt && question.options.every((o) => o.art && !o.text.trim());
  /* Sentence-length answers read better one-up; two columns wrap them into
     three or four lines each. */
  const longOptions = question.options.some((o) => o.text.length > 36);
  /* What a sitting counts. A vocabulary item is a word, a comprehension item
     a passage, a sentence-writing item a sentence — calling all of them
     "question" reads as a test, which is the one word this flow avoids. */
  /* Little Readers count pictures, not questions: "Question 3" means
     nothing to someone who has never sat one. */
  const unitLabel = isMatch || isPair || isOdd || wordlessOptions
    ? 'Picture'
    : studiesPassage
    ? 'Passage'
    : subject === 'math'
      ? 'Question'
      : isOrder || isWrite
        ? 'Sentence'
        : isStudy || isListen
          ? 'Word'
          : 'Question';
  const progress = Math.min(100, (questionNumber / questionsPerSubject) * 100);
  const prompt = questionTextFor(question, band);

  return (
    <div className="stage">
      <div className={`card card--tight question-screen question-screen--${band}`}>
        <div className="quest-bar">
          <span className="label">
            {/* A vocabulary sitting counts words, not questions — the study
                card and the question it leads to are one item. */}
            <Tag color={STRAND_TAG[subject]}>{SUBJECT_LABEL[subject]}</Tag>{' '}
            · {unitLabel} {questionNumber}
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
          {canSpeak && !isListen && (
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

        {phase !== 'recall' && (
          /* The study beat. The word and its meaning are on screen together,
             and only here — the question that follows is answerable from
             having understood the meaning, not from copying it down. */
          <div key={`${question.id}-study`} className="study question-anim">
            <p className="label study__kicker">Read this, then it disappears</p>
            {studiesPassage ? (
              <div className="study__passage-card">
                {question.passageTitle && (
                  <p className="label study__passage-title">{question.passageTitle}</p>
                )}
                <p className="study__passage">{question.passage}</p>
              </div>
            ) : (
              <>
                <div className="study__word-card">
                  <span className="study__word">{question.studyWord}</span>
                </div>
                <div className="study__meaning-card">
                  <p className="study__meaning">{question.studyMeaning}</p>
                </div>
              </>
            )}
            <div className="study__go">
              <button
                type="button"
                className="btn btn--primary btn--large"
                onClick={() => setPhase('confirm')}
              >
                I’ve read it
              </button>
              <span className="field__hint">Take as long as you like · No timer</span>
            </div>
          </div>
        )}

        {phase === 'confirm' && (
          <ConfirmStudyDialog
            what={studiesPassage ? 'passage' : 'word'}
            word={question.studyWord ?? ''}
            onContinue={() => setPhase('recall')}
            onBack={() => setPhase('study')}
          />
        )}

        {phase === 'recall' && (
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
              /* On an ordering or writing item the picture IS the prompt, so
                 it leads at full size whatever the band — the senior
                 treatment shrinks it to a supporting strip, which is wrong
                 when it is the thing being written about. */
              <div
                className={`art-panel art-panel--${
                  isOrder || isWrite ? 'prompt' : band
                }`}
              >
                <Illustration art={question.art} />
              </div>
            )}

            {isListen && (
              /* The word is heard and never written. Everything visible here
                 has to work without giving it away — which is why the panel
                 shows a speaker and a count, and no text at all. */
              <div className="listen">
                {!canSpeak && (
                  <p className="listen__silent">
                    This tablet has no voice, so the word cannot be read out.
                    {heardTextFor(question) ? ` It says “${heardTextFor(question)}”.` : ''} A
                    grown-up can read it instead — this one is recorded for review rather than
                    marked.
                  </p>
                )}
                <button
                  type="button"
                  className={`listen__button${speaking ? ' listen__button--playing' : ''}`}
                  disabled={!canSpeak || (replaysLeft === 0 && !speaking)}
                  onClick={() => {
                    if (speaking) return;
                    if (replaysLeft === 0) return;
                    setReplaysLeft((n) => n - 1);
                    speak([heardTextFor(question)], rate);
                  }}
                  aria-label="Hear the word again"
                >
                  <SpeakerIcon speaking={speaking} size={40} />
                </button>
                <span className="listen__count">
                  {speaking
                    ? 'Listening…'
                    : replaysLeft > 0
                      ? `${replaysLeft} more ${replaysLeft === 1 ? 'listen' : 'listens'}`
                      : 'That was the last listen — your best guess is fine'}
                </span>
              </div>
            )}

            <h1 className={isJunior ? 'display' : 'title'}>{prompt}</h1>

            {isPair ? (
              <PairAnswer
                options={question.options}
                slots={question.pairOrder ?? []}
                disabled={chosenId !== null}
                onCommit={choose}
                seed={question.id}
              />
            ) : isMatch || isOdd ? (
              <MatchAnswer
                options={question.options}
                disabled={chosenId !== null}
                onCommit={choose}
                seed={question.id}
                pick={isOdd ? 1 : 2}
              />
            ) : isDrag ? (
              <DragAnswer
                options={question.options}
                disabled={chosenId !== null}
                onCommit={choose}
              />
            ) : isOrder ? (
              <OrderAnswer
                options={question.options}
                disabled={chosenId !== null}
                onCommit={choose}
                seed={question.id}
                draggable={question.answerMode === 'order-drag'}
                of={subject === 'math' ? 'numbers' : 'words'}
              />
            ) : isNumber ? (
              <NumberAnswer
                allowDecimal={question.allowDecimal}
                allowNegative={question.allowNegative}
                disabled={chosenId !== null}
                onCommit={choose}
                seed={question.id}
              />
            ) : isWrite ? (
              <WriteAnswer
                requiredWords={question.requiredWords ?? []}
                disabled={chosenId !== null}
                onCommit={commitWritten}
                seed={question.id}
              />
            ) : (
            <div
              className={`options${
                showOptionArt
                  ? ` options--picture${
                      wordlessOptions
                        ? ` options--wordless options--wordless-${question.options.length}`
                        : ''
                    }`
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
                  className={`option-row${showOptionArt ? ' option-row--picture' : ''}${
                    wordlessOptions ? ' option-row--wordless' : ''
                  }`}
                >
                  <button
                    type="button"
                    className={`option${chosenId === option.id ? ' option--chosen' : ''}${
                      showOptionArt ? ' option--picture' : ''
                    }${wordlessOptions ? ' option--wordless' : ''}`}
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
                  {canSpeak && !isListen && !wordlessOptions && (
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
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

/**
 * The one confirmation in the whole flow.
 *
 * It exists because the next tap takes the meaning away, and a child who
 * tapped by accident cannot get it back. It is a question, not a warning:
 * there is no error colour here and nothing has gone wrong.
 */
function ConfirmStudyDialog({
  what,
  word,
  onContinue,
  onBack,
}: {
  what: 'word' | 'passage';
  word: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  return (
    <div
      className="dialog-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-confirm"
      /* Escape goes back to the word rather than past it: the safe way out of
         an accidental tap keeps the meaning on screen. */
      onKeyDown={(e) => e.key === 'Escape' && onBack()}
    >
      <div className="dialog">
        <p className="label dialog__kicker">Ready?</p>
        <h2 id="study-confirm" className="dialog__title">
          {what === 'passage'
            ? 'Have you read the passage?'
            : `Have you read ${word ? `“${word}”` : 'the word'} and what it means?`}
        </h2>
        <p className="body dialog__body">
          {what === 'passage' ? 'It disappears next' : 'They disappear next'}, and the question
          comes after. You can go back and look again — nothing is being timed.
        </p>
        <div className="dialog__actions">
          <button type="button" ref={first} className="btn btn--primary" onClick={onContinue}>
            Yes, I’ve read it
          </button>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Let me look again
          </button>
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
