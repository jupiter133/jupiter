import { useEffect, useState } from 'react';
import type { AnswerOption } from '../assessment/types';
import { Illustration } from './Illustration';

interface Props {
  options: AnswerOption[];
  /** Fired with the two chosen ids, sorted and joined by '-'. */
  onCommit: (pair: string) => void;
  disabled: boolean;
  /** Clears when this changes. */
  seed: string;
}

/** How many cards make a match. Two, always — this is a pair game. */
const PAIR = 2;

/**
 * Tap the two pictures that are the same.
 *
 * This is the first thing a three-year-old meets in the whole product, so it
 * is built for someone who cannot read, cannot aim precisely, and will tap the
 * wrong card by accident:
 *
 *  - the pictures are the entire target, as large as the screen allows
 *  - a tapped card can be untapped, right up until they say they are done
 *  - nothing commits on its own, because an accidental second tap would
 *    otherwise end the question
 *  - no card is ever marked wrong; chosen cards simply look chosen
 */
export function MatchAnswer({ options, onCommit, disabled, seed }: Props) {
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => setChosen([]), [seed]);

  const toggle = (id: string) => {
    if (disabled) return;
    setChosen((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      // A third tap replaces the older choice rather than being ignored: a
      // child who changes their mind should not have to undo first.
      return c.length < PAIR ? [...c, id] : [c[1], id];
    });
  };

  const ready = chosen.length === PAIR;

  return (
    <div className="match">
      <div
        className={`match__cards match__cards--${options.length}`}
        role="group"
        aria-label="Pictures to match"
      >
        {options.map((option) => {
          const picked = chosen.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={`match__card${picked ? ' match__card--picked' : ''}`}
              disabled={disabled}
              aria-pressed={picked}
              aria-label={picked ? 'Chosen. Tap again to change your mind.' : 'A picture'}
              onClick={() => toggle(option.id)}
            >
              {option.art && <Illustration art={option.art} variant="option" />}
              {picked && <span className="match__tick" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="match__go">
        <button
          type="button"
          className="btn btn--primary btn--large"
          disabled={disabled || !ready}
          onClick={() => onCommit([...chosen].sort().join('-'))}
        >
          {ready ? 'All done!' : 'Tap two pictures'}
        </button>
      </div>
    </div>
  );
}
