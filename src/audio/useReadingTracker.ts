import { useCallback, useEffect, useRef, useState } from 'react';
import { advanceMarker, countWords } from './readingProgress';

/**
 * Follows a child through a passage while they read it aloud.
 *
 * WHAT THIS IS FOR: moving a highlight along the line so their eyes stay on
 * it. It is not a scorer and must never become one — see readingProgress.ts
 * for why counting rather than matching is the point rather than a shortcut.
 *
 * WHERE THE AUDIO GOES: this is the browser's own SpeechRecognition. In Chrome
 * the audio is sent to Google's servers to transcribe; in Safari it may be
 * handled on device. Nothing is stored by this app either way, and nothing it
 * returns reaches the placement — the transcript is read for its word count
 * and thrown away. If that trade is not acceptable, set TRACKING_ENABLED to
 * false and the passage simply renders without a highlight.
 */
export const TRACKING_ENABLED = true;

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: never) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface ReadingTracker {
  /** False on a browser without speech recognition — render no highlight. */
  supported: boolean;
  /** How many words of the passage the child has got through. */
  marker: number;
  start(totalWords: number): void;
  stop(): void;
}

export function useReadingTracker(): ReadingTracker {
  const [supported] = useState(() => TRACKING_ENABLED && recognitionCtor() !== null);
  const [marker, setMarker] = useState(0);
  const recognition = useRef<Recognition | null>(null);
  const finalWords = useRef(0);
  const total = useRef(0);

  const stop = useCallback(() => {
    const active = recognition.current;
    recognition.current = null;
    if (!active) return;
    active.onresult = null;
    active.onerror = null;
    active.onend = null;
    try {
      active.abort();
    } catch {
      // Already stopped, or stopped by the browser. Nothing to do.
    }
  }, []);

  const start = useCallback(
    (totalWords: number) => {
      stop();
      setMarker(0);
      finalWords.current = 0;
      total.current = totalWords;
      const Ctor = recognitionCtor();
      if (!TRACKING_ENABLED || !Ctor) return;

      let active: Recognition;
      try {
        active = new Ctor();
      } catch {
        return;
      }
      active.continuous = true;
      active.interimResults = true;
      active.lang = 'en-CA';
      active.onresult = ((event: {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
      }) => {
        let interim = 0;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const words = countWords(result[0].transcript);
          if (result.isFinal) finalWords.current += words;
          else interim += words;
        }
        setMarker((prev) => advanceMarker(prev, finalWords.current + interim, total.current));
      }) as unknown as (event: never) => void;
      // Recognition stopping on its own — a pause, a network blip, a refused
      // permission — is not the child's problem. The highlight simply holds
      // where it is and the sitting carries on.
      active.onerror = () => {};
      active.onend = () => {};

      try {
        active.start();
        recognition.current = active;
      } catch {
        // Another recognition is still shutting down. No highlight this take.
      }
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { supported, marker, start, stop };
}
