import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Words the prompt asked for, shown as a reminder while they write. */
  requiredWords: string[];
  onCommit: (written: string) => void;
  disabled: boolean;
  /** Clears and refocuses when this changes. */
  seed: string;
}

/**
 * The child writes the sentence themselves.
 *
 * The required words are listed under the box rather than checked off as they
 * are typed. A live tick would be marking the sentence while the child is
 * still writing it, and this product does not tell a child they are right or
 * wrong mid-answer.
 */
export function WriteAnswer({ requiredWords, onCommit, disabled, seed }: Props) {
  const [text, setText] = useState('');
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText('');
    box.current?.focus();
  }, [seed]);

  const written = text.trim();

  return (
    <div className="write">
      <textarea
        ref={box}
        className="textarea write__box"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your sentence here…"
        rows={3}
        aria-label="Your sentence"
      />

      {requiredWords.length > 0 && (
        <p className="write__required">
          Use {requiredWords.length === 1 ? 'this word' : 'these words'}:{' '}
          {requiredWords.map((w) => (
            <span key={w} className="write__word">
              {w}
            </span>
          ))}
        </p>
      )}

      <div className="write__go">
        <button
          type="button"
          className="btn btn--primary btn--large"
          disabled={disabled || written.length === 0}
          onClick={() => onCommit(written)}
        >
          {written.length === 0 ? 'Write your sentence' : 'That’s my sentence'}
        </button>
        <span className="field__hint">
          Start with a capital and end with a full stop · No time limit
        </span>
      </div>
    </div>
  );
}
