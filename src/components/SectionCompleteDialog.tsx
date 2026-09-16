import { useEffect, useRef } from 'react';
import type { Subject } from '../assessment/types';
import { SUBJECT_LABEL } from '../assessment/types';

interface Props {
  /** The sitting that just finished. */
  subject: Subject;
  /** How many of the five are done, and how many there are. */
  done: number;
  total: number;
  onContinue: () => void;
}

/**
 * Shown over the quest when a sitting's last question is answered.
 *
 * A popup rather than a screen: the section ending is a moment, not a
 * destination. It still says nothing numeric about how the child did — how
 * many parts are finished is progress, not a score.
 */
export function SectionCompleteDialog({ subject, done, total, onContinue }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allDone = done >= total;

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The dialog has one way out, so Escape takes it rather than trapping.
      if (e.key === 'Escape') onContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinue]);

  return (
    <div className="dialog-scrim">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="section-done">
        <div className="dialog__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="38" height="38" fill="none">
            <path
              d="M6 12.5l3.6 3.6L18 8"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="label dialog__kicker">
          {allDone ? 'All done' : `Part ${done} of ${total} complete`}
        </p>
        <h2 id="section-done" className="dialog__title">
          {SUBJECT_LABEL[subject]} — done!
        </h2>
        <p className="body dialog__body">
          {allDone
            ? 'That’s every part finished. Nice exploring — Ms Hannah has everything she needs now.'
            : 'Nice exploring! That part is finished and saved. There’s no rush to do the next one right now.'}
        </p>

        <button
          ref={buttonRef}
          type="button"
          className="btn btn--primary btn--large"
          onClick={onContinue}
        >
          Give the tablet back to your grown-up
        </button>
      </div>
    </div>
  );
}
