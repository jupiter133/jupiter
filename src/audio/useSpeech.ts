import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper over the Web Speech API.
 *
 * Speech is a progressive enhancement: where the browser has no synthesis
 * support the hook reports `supported: false` and the UI hides the control
 * rather than offering a button that does nothing.
 */
export function useSpeech() {
  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function';

  const [speaking, setSpeaking] = useState(false);
  /** Guards against a cancelled run's handlers clobbering a newer run's state. */
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    if (!supported) return;
    runIdRef.current += 1;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (parts: string[], rate = 1) => {
      if (!supported || parts.length === 0) return;

      // Replaying restarts from the top rather than queueing behind the last run.
      window.speechSynthesis.cancel();
      runIdRef.current += 1;
      const runId = runIdRef.current;
      setSpeaking(true);

      parts.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1.1;
        if (index === parts.length - 1) {
          utterance.onend = () => {
            if (runIdRef.current === runId) setSpeaking(false);
          };
        }
        utterance.onerror = () => {
          if (runIdRef.current === runId) setSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    [supported],
  );

  // Never let speech outlive the screen that started it.
  useEffect(() => stop, [stop]);

  return { supported, speaking, speak, stop };
}
