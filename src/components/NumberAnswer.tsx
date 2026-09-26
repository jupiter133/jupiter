import { useEffect, useState } from 'react';

interface Props {
  /** Lets the child type a decimal point. Off for whole-number items. */
  allowDecimal?: boolean;
  /** Lets the child type a minus sign, for integers and algebra. */
  allowNegative?: boolean;
  onCommit: (value: string) => void;
  disabled: boolean;
  /** Clears when this changes. */
  seed: string;
}

/**
 * Type the number.
 *
 * WHY THIS EXISTS. Every other math item offers four answers, and four answers
 * can be worked backwards: try each one, see which fits. Typing the answer
 * cannot be back-solved, so it measures whether the child can actually do the
 * arithmetic rather than whether they can recognise it.
 *
 * The keypad is on screen rather than relying on the device keyboard: on a
 * tablet a text field summons a full alphabetic keyboard that covers half the
 * question, and a child hunting for the number row is not doing mathematics.
 */
export function NumberAnswer({
  allowDecimal = false,
  allowNegative = false,
  onCommit,
  disabled,
  seed,
}: Props) {
  const [value, setValue] = useState('');

  useEffect(() => setValue(''), [seed]);

  const press = (key: string) => {
    if (disabled) return;
    setValue((v) => {
      if (key === '⌫') return v.slice(0, -1);
      if (key === '-') return v.startsWith('-') ? v.slice(1) : `-${v}`;
      if (key === '.' && v.includes('.')) return v;
      // A leading zero is a typo, not a number — except for "0." itself.
      if (key === '0' && v === '') return '0';
      if (v === '0' && key !== '.') return key;
      return v + key;
    });
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const ready = value !== '' && value !== '-' && value !== '.' && !value.endsWith('.');

  return (
    <div className="pad">
      <div className={`pad__display${value ? ' pad__display--filled' : ''}`} aria-live="polite">
        {value || <span className="pad__placeholder">Your answer</span>}
      </div>

      <div className="pad__keys" role="group" aria-label="Number keypad">
        {keys.map((k) => (
          <button key={k} type="button" className="pad__key" disabled={disabled} onClick={() => press(k)}>
            {k}
          </button>
        ))}
        {allowNegative ? (
          <button type="button" className="pad__key pad__key--quiet" disabled={disabled} onClick={() => press('-')}>
            −
          </button>
        ) : allowDecimal ? (
          <button type="button" className="pad__key pad__key--quiet" disabled={disabled} onClick={() => press('.')}>
            .
          </button>
        ) : (
          <span className="pad__key pad__key--blank" aria-hidden="true" />
        )}
        <button type="button" className="pad__key" disabled={disabled} onClick={() => press('0')}>
          0
        </button>
        <button
          type="button"
          className="pad__key pad__key--quiet"
          disabled={disabled || value === ''}
          onClick={() => press('⌫')}
          aria-label="Delete the last digit"
        >
          ⌫
        </button>
        {allowNegative && allowDecimal && (
          <button type="button" className="pad__key pad__key--quiet" disabled={disabled} onClick={() => press('.')}>
            .
          </button>
        )}
      </div>

      <div className="pad__go">
        <button
          type="button"
          className="btn btn--primary btn--large"
          disabled={disabled || !ready}
          onClick={() => onCommit(value)}
        >
          {ready ? 'That’s my answer' : 'Type your answer'}
        </button>
        <span className="field__hint">No time limit · Your best try is exactly right</span>
      </div>
    </div>
  );
}
