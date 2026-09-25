import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerOption } from '../assessment/types';

interface Props {
  options: AnswerOption[];
  /** Fired with the placed ids joined by '-', matching the item's key. */
  onCommit: (order: string) => void;
  disabled: boolean;
  /** Re-shuffles when this changes, so a new item never reuses an old order. */
  seed: string;
  /** Adds pointer dragging on top of tapping. Tapping always works. */
  draggable?: boolean;
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
 * it back out. On a `draggable` item the words can be dragged into the line
 * instead — but tapping still does everything, because ordering tiles by drag
 * on a phone is fiddly in a way that measures coordination rather than
 * language, and no child should lose an item to their fine motor control.
 *
 * The words stay visible the whole time, so nothing here is a memory test of
 * the tiles themselves — on a heard item the sentence is the thing being
 * remembered, and that is the point.
 */
export function OrderAnswer({ options, onCommit, disabled, seed, draggable = false }: Props) {
  const tiles = useMemo(() => shuffled(options, seed), [options, seed]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [over, setOver] = useState(false);
  const line = useRef<HTMLDivElement>(null);
  const grabbed = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => setPlaced([]), [seed]);

  const insideLine = useCallback((x: number, y: number) => {
    const box = line.current?.getBoundingClientRect();
    if (!box) return false;
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }, []);

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => {
      const offset = grabbed.current ?? { dx: 0, dy: 0 };
      setPointer({ x: e.clientX - offset.dx, y: e.clientY - offset.dy });
      setOver(insideLine(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      // Words land in the order they are dropped. A word dropped anywhere
      // else goes home rather than being lost or silently added.
      if (insideLine(e.clientX, e.clientY)) setPlaced((p) => (p.includes(dragId) ? p : [...p, dragId]));
      setDragId(null);
      setPointer(null);
      setOver(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragId, insideLine]);

  const placedSet = new Set(placed);
  const complete = placed.length === options.length;
  const byId = (id: string) => options.find((o) => o.id === id);

  return (
    <div className="order">
      <div
        ref={line}
        className={`order__line${placed.length ? ' order__line--filled' : ''}${
          over ? ' order__line--over' : ''
        }`}
        aria-live="polite"
      >
        {placed.length === 0 ? (
          <span className="order__hint">
            {draggable ? 'Drag the words here in order' : 'Tap the words to build your sentence'}
          </span>
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
            className={`order__tile${placedSet.has(option.id) ? ' order__tile--gone' : ''}${
              option.id === dragId ? ' order__tile--lifting' : ''
            }${draggable ? ' order__tile--draggable' : ''}`}
            disabled={disabled || placedSet.has(option.id)}
            onPointerDown={(e) => {
              if (!draggable || disabled || placedSet.has(option.id)) return;
              const box = e.currentTarget.getBoundingClientRect();
              grabbed.current = { dx: e.clientX - box.left, dy: e.clientY - box.top };
              setPointer({ x: box.left, y: box.top });
              setDragId(option.id);
            }}
            onClick={() => setPlaced((p) => (p.includes(option.id) ? p : [...p, option.id]))}
          >
            {option.text}
          </button>
        ))}
      </div>

      {/* The tile under the finger. Fixed, so the card cannot clip it. */}
      {dragId && pointer && (
        <div className="drag__ghost" style={{ left: pointer.x, top: pointer.y }} aria-hidden="true">
          {byId(dragId)?.text}
        </div>
      )}

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
