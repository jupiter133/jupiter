import { useEffect, useMemo, useState } from 'react';
import type { AnswerOption } from '../assessment/types';

interface Props {
  options: AnswerOption[];
  /** Fired with the placed ids joined by '-', matching the item's key. */
  onCommit: (order: string) => void;
  disabled: boolean;
  /** Re-shuffles when this changes, so a new item never reuses an old order. */
  seed: string;
}

/** A fixed shuffle per item: the same child revisiting sees the same tiles. */
function shuffled(options: AnswerOption[], seed: string): AnswerOption[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out = [...options];
  for (let i = out.length - 1; i > 0; i -= 1) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  // A shuffle that lands on the answer would hand the item to the child.
  const isIdentity = out.every((o, i) => o.id === options[i].id);
  return isIdentity && out.length > 1 ? [out[1], out[0], ...out.slice(2)] : out;
}

/**
 * Build the sentence by putting the words in order.
 *
 * Tapping a word adds it to the end of the line; tapping it in the line takes
 * it back out. That is the whole interaction — no dragging required, because
 * ordering five tiles by drag on a phone is fiddly in a way that measures
 * coordination rather than language. The words stay visible the whole time,
 * so nothing here is a memory test either.
 */
export function OrderAnswer({ options, onCommit, disabled, seed }: Props) {
  const tiles = useMemo(() => shuffled(options, seed), [options, seed]);
  const [placed, setPlaced] = useState<string[]>([]);

  useEffect(() => setPlaced([]), [seed]);

  const placedSet = new Set(placed);
  const complete = placed.length === options.length;
  const byId = (id: string) => options.find((o) => o.id === id);

  return (
    <div className="order">
      <div className={`order__line${placed.length ? ' order__line--filled' : ''}`} aria-live="polite">
        {placed.length === 0 ? (
          <span className="order__hint">Tap the words to build your sentence</span>
        ) : (
          placed.map((id, i) => (
            <button
              key={`${id}-${i}`}
              type="button"
              className="order__tile order__tile--placed"
              disabled={disabled}
              onClick={() => setPlaced((p) => p.filter((x) => x !== id))}
              aria-label={`${byId(id)?.text} — word ${i + 1}. Tap to take it back.`}
            >
              {byId(id)?.text}
            </button>
          ))
        )}
      </div>

      <div className="order__tiles" role="group" aria-label="Words to use">
        {tiles.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`order__tile${placedSet.has(option.id) ? ' order__tile--gone' : ''}`}
            disabled={disabled || placedSet.has(option.id)}
            onClick={() => setPlaced((p) => [...p, option.id])}
          >
            {option.text}
          </button>
        ))}
      </div>

      <div className="order__go">
        <button
          type="button"
          className="btn btn--primary btn--large"
          disabled={disabled || !complete}
          onClick={() => onCommit(placed.join('-'))}
        >
          {complete ? 'That’s my sentence' : 'Use every word'}
        </button>
        {placed.length > 0 && !disabled && (
          <button type="button" className="text-btn text-btn--sm" onClick={() => setPlaced([])}>
            Start the sentence over
          </button>
        )}
      </div>
    </div>
  );
}
