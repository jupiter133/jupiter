import { useEffect, useRef, useState } from 'react';
import type { Question, Subject } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';
import { STRAND_TAG, Tag } from '../components/Tag';
import { useSpeech } from '../audio/useSpeech';
import { ACTIVE_SPEECH_SCORER, type SpokenVerdict } from '../assessment/speechScoring';

/** Hold the mic at least this long before "next" is offered. */
const MIN_HOLD_MS = 400;
/** A take runs out here, so nobody holds the button forever. */
const MAX_HOLD_MS = 8000;

type Phase = 'ready' | 'recording' | 'captured';

interface Props {
  question: Question;
  subject: Subject;
  questionNumber: number;
  questionsPerSubject: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  /** Hands the attempt up. `scored` is false while no scorer exists. */
  onSpoken: (verdict: SpokenVerdict, spokenMs: number) => void;
}

/**
 * The spoken item. One word at a time, a mic, and a next button.
 *
 * NOTHING HERE JUDGES THE CHILD. The scorer behind `ACTIVE_SPEECH_SCORER` is a
 * stub that returns "captured, not judged", and this screen renders that
 * honestly: it confirms the take was heard and moves on. It never says right
 * or wrong, because no right or wrong has been established — and the rest of
 * the flow has no colour role for an error, by design.
 *
 * Recording is best-effort. Without a microphone, or with permission refused,
 * the child still speaks and still taps on: the take is simply marked as
 * having no audio. A placement is not the place to fight a browser prompt.
 */
export function SpeakingScreen({
  question,
  subject,
  questionNumber,
  questionsPerSubject,
  audioEnabled,
  onToggleAudio,
  onSpoken,
}: Props) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [level, setLevel] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const startedAt = useRef(0);
  const heldMs = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const stopTimer = useRef(0);
  const { supported: canSpeak, speaking, speak, stop: stopSpeaking } = useSpeech();

  const word = question.spokenWord ?? question.questionText;

  function releaseMic() {
    window.cancelAnimationFrame(raf.current);
    window.clearTimeout(stopTimer.current);
    recorder.current?.state === 'recording' && recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLevel(0);
  }

  // A new word is a fresh take — never carry a previous recording into it.
  useEffect(() => {
    setPhase('ready');
    heldMs.current = 0;
    return releaseMic;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Model the word first when read-aloud is on, so a child who cannot read it
  // yet still knows what they are being asked to say.
  useEffect(() => {
    if (audioEnabled) speak([word], 0.85);
    return stopSpeaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, audioEnabled]);

  async function startRecording() {
    if (phase === 'recording') return;
    stopSpeaking();
    startedAt.current = Date.now();
    setPhase('recording');
    stopTimer.current = window.setTimeout(stopRecording, MAX_HOLD_MS);

    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      const rec = new MediaRecorder(media);
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.start();
      recorder.current = rec;

      // The waveform is the child's own voice, so the screen visibly responds
      // to them rather than animating on a timer.
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevel(peak);
        raf.current = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // No mic, or permission refused. The take still counts as attempted.
      setMicDenied(true);
    }
  }

  function stopRecording() {
    if (phase !== 'recording') return;
    heldMs.current = Math.max(MIN_HOLD_MS, Date.now() - startedAt.current);
    releaseMic();
    setPhase('captured');
  }

  async function next() {
    const audio = chunks.current.length ? new Blob(chunks.current, { type: 'audio/webm' }) : undefined;
    const verdict = await ACTIVE_SPEECH_SCORER.score({
      target: word,
      durationMs: heldMs.current,
      audio,
    });
    onSpoken(verdict, heldMs.current);
  }

  const progress = Math.min(100, (questionNumber / questionsPerSubject) * 100);
  const bars = [0.35, 0.7, 1, 0.55, 0.85, 0.4];

  return (
    <div className="stage">
      <div className="card card--tight question-screen speaking">
        <div className="quest-bar">
          <span className="label">
            <Tag color={STRAND_TAG[subject]}>{SUBJECT_LABEL[subject]}</Tag> · Word {questionNumber}
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
                onClick={() => (speaking ? stopSpeaking() : speak([word], 0.85))}
                aria-label="Hear the word"
              >
                <EarIcon speaking={speaking} />
                <span className="icon-btn__text">Hear it</span>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                onClick={onToggleAudio}
                aria-pressed={audioEnabled}
                aria-label="Hear every word automatically"
              >
                {audioEnabled ? 'Auto-read on' : 'Auto-read off'}
              </button>
            </div>
          )}
        </div>

        <div key={question.id} className="speaking__body question-anim">
          <div className={`word-card${phase === 'recording' ? ' word-card--live' : ''}`}>
            <span className="wave" aria-hidden="true">
              {bars.map((b, i) => (
                <span
                  key={i}
                  className="wave__bar"
                  style={{
                    height: `${12 + b * 26 * (phase === 'recording' ? 0.4 + level * 3 : 0.35)}px`,
                  }}
                />
              ))}
            </span>
            <span className="word-card__word">{word}</span>
            <span className="wave wave--right" aria-hidden="true">
              {bars.map((b, i) => (
                <span
                  key={i}
                  className="wave__bar"
                  style={{
                    height: `${12 + b * 26 * (phase === 'recording' ? 0.4 + level * 3 : 0.35)}px`,
                  }}
                />
              ))}
            </span>
          </div>

          <p className="body speaking__prompt">
            {phase === 'ready' && 'Tap the microphone, then say the word out loud.'}
            {phase === 'recording' && 'Listening — say it nice and clear!'}
            {phase === 'captured' && 'Got it. Ready for the next word?'}
          </p>

          <button
            type="button"
            className={`mic${phase === 'recording' ? ' mic--live' : ''}${
              phase === 'captured' ? ' mic--done' : ''
            }`}
            onClick={phase === 'recording' ? stopRecording : startRecording}
            aria-label={phase === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            <MicIcon done={phase === 'captured'} />
          </button>
          <span className="mic__caption">
            {phase === 'recording' ? 'Tap when you’re done' : phase === 'captured' ? 'Nice one!' : 'Tap to speak'}
          </span>

          <div className="speaking__go">
            <button
              type="button"
              className="btn btn--primary btn--large"
              disabled={phase === 'recording'}
              onClick={next}
            >
              {questionNumber >= questionsPerSubject ? 'Finish' : 'Next word'}
            </button>
            {phase === 'ready' && (
              <button type="button" className="text-btn text-btn--sm" onClick={next}>
                Skip this word
              </button>
            )}
            <span className="field__hint">
              {micDenied
                ? 'No microphone — say it out loud anyway and tap next.'
                : 'No pass or fail · Your best try is exactly right'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Same speaker as the tapped-question screen, so "hear it" reads the same. */
function EarIcon({ speaking }: { speaking: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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

function MicIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5l5.2 5.2L20 7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
    </svg>
  );
}
