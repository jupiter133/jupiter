import { useEffect, useRef } from 'react';
import type { Subject } from '../assessment/types';
import { SUBJECT_LABEL, SUBJECT_SHORT } from '../assessment/types';

interface Props {
  /** The sitting that just finished. */
  subject: Subject;
  /** How many of the track’s sittings are done, and how many there are. */
  done: number;
  total: number;
  /** The next sitting, or null when that was the last one. */
  nextSubject: Subject | null;
  /** Straight into the next subject, without handing the tablet over. */
  onKeepGoing: () => void;
  /** Stop here and hand back to the grown-up. */
  onHandBack: () => void;
}

/**
 * Shown over the quest when a sitting's last question is answered.
 *
 * A popup rather than a screen: the section ending is a moment, not a
 * destination. Two ways on — keep going, or hand the tablet back — because a
 * child in flow should not have to be handed the tablet again to continue,
 * and a tired one should not have to keep going. It still says nothing
 * numeric about how the child did: how many parts are finished is progress,
 * not a score.
 */
export function SectionCompleteDialog({
  subject,
  done,
  total,
  nextSubject,
  onKeepGoing,
  onHandBack,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allDone = nextSubject === null || done >= total;

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape takes the cautious exit: stop here, hand the tablet back.
      if (e.key === 'Escape') onHandBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHandBack]);

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
            : 'Nice exploring! That part is saved. Keep going, or stop here and come back to it later.'}
        </p>

        <div className="dialog__actions">
          {!allDone && nextSubject && (
            <button
              ref={buttonRef}
              type="button"
              className="btn btn--primary btn--large"
              onClick={onKeepGoing}
            >
              Keep going — {SUBJECT_SHORT[nextSubject]}
            </button>
          )}
          <button
            ref={allDone ? buttonRef : undefined}
            type="button"
            className={allDone ? 'btn btn--primary btn--large' : 'btn btn--ghost'}
            onClick={onHandBack}
          >
            Give the tablet back to your grown-up
          </button>
        </div>
      </div>
    </div>
  );
}
