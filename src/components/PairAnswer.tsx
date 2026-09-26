import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerOption } from '../assessment/types';
import { Illustration } from './Illustration';

interface Props {
  /** The pictures the child moves, in their shown order. */
  options: AnswerOption[];
  /** Option ids in slot order — each slot shows that option's picture, faded. */
  slots: string[];
  /** Fired with the option id placed in each slot, joined by '-'. */
  onCommit: (placement: string) => void;
  disabled: boolean;
  seed: string;
}

/**
 * Put each picture with its twin.
 *
 * TWO WAYS IN, ALWAYS. Drag a picture onto a slot, or tap the picture and then
 * tap the slot. Dragging is the fun one and the one the design asks for;
 * tapping is the one a three-year-old with a wobbly finger can actually
 * complete, and an assessment that measures fine motor control instead of
 * matching is measuring the wrong thing.
 *
 * Nothing is ever marked wrong. A picture lands where the child puts it, comes
 * back out when they tap it, and nothing is judged until they say they are
 * done.
 */
export function PairAnswer({ options, slots, onCommit, disabled, seed }: Props) {
  /** slot index -> option id */
  const [placed, setPlaced] = useState<(string | null)[]>(() => slots.map(() => null));
  const [held, setHeld] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [overSlot, setOverSlot] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const grabbed = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    setPlaced(slots.map(() => null));
    setHeld(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const slotAt = useCallback((x: number, y: number) => {
    const i = slotRefs.current.findIndex((el) => {
      if (!el) return false;
      const b = el.getBoundingClientRect();
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    });
    return i === -1 ? null : i;
  }, []);

  const put = useCallback((slot: number, id: string) => {
    setPlaced((p) => {
      // One picture, one slot: placing it somewhere new takes it out of
      // wherever it was, and displaces whatever was already here.
      const next = p.map((v) => (v === id ? null : v));
      next[slot] = id;
      return next;
    });
    setHeld(null);
  }, []);

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => {
      const off = grabbed.current ?? { dx: 0, dy: 0 };
      setPointer({ x: e.clientX - off.dx, y: e.clientY - off.dy });
      setOverSlot(slotAt(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const slot = slotAt(e.clientX, e.clientY);
      if (slot !== null) put(slot, dragId);
      setDragId(null);
      setPointer(null);
      setOverSlot(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragId, slotAt, put]);

  const byId = (id: string) => options.find((o) => o.id === id);
  const usedIds = new Set(placed.filter(Boolean) as string[]);
  const complete = placed.every(Boolean);

  return (
    <div className="pair">
      <div className="pair__board">
        <div className="pair__column" role="group" aria-label="Pictures to move">
          {options.map((option) => {
            const gone = usedIds.has(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className={`pair__piece${gone ? ' pair__piece--gone' : ''}${
                  held === option.id ? ' pair__piece--held' : ''
                }${dragId === option.id ? ' pair__piece--lifting' : ''}`}
                disabled={disabled || gone}
                aria-label={held === option.id ? 'Held. Now tap a box.' : 'A picture. Tap to pick it up.'}
                onPointerDown={(e) => {
                  if (disabled || gone) return;
                  const b = e.currentTarget.getBoundingClientRect();
                  grabbed.current = { dx: e.clientX - b.left, dy: e.clientY - b.top };
                  setPointer({ x: b.left, y: b.top });
                  setDragId(option.id);
                }}
                onClick={() => !disabled && !gone && setHeld((h) => (h === option.id ? null : option.id))}
              >
                {option.art && <Illustration art={option.art} variant="option" />}
              </button>
            );
          })}
        </div>

        <div className="pair__column" role="group" aria-label="Boxes to fill">
          {slots.map((wantedId, i) => {
            const filled = placed[i];
            return (
              <div
                key={`${wantedId}-${i}`}
                ref={(el) => (slotRefs.current[i] = el)}
                className={`pair__slot${filled ? ' pair__slot--filled' : ''}${
                  overSlot === i ? ' pair__slot--over' : ''
                }`}
              >
                {/* The faded picture is what this box is waiting for. */}
                {!filled && byId(wantedId)?.art && (
                  <span className="pair__ghost-art" aria-hidden="true">
                    <Illustration art={byId(wantedId)!.art!} variant="option" />
                  </span>
                )}
                <button
                  type="button"
                  className="pair__drop"
                  disabled={disabled}
                  aria-label={filled ? 'Filled. Tap to take the picture back.' : 'An empty box'}
                  onClick={() => {
                    if (disabled) return;
                    if (filled) setPlaced((p) => p.map((v, j) => (j === i ? null : v)));
                    else if (held) put(i, held);
                  }}
                >
                  {filled && byId(filled)?.art && (
                    <Illustration art={byId(filled)!.art!} variant="option" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {dragId && pointer && (
        <div className="drag__ghost pair__ghost" style={{ left: pointer.x, top: pointer.y }} aria-hidden="true">
          {byId(dragId)?.art && <Illustration art={byId(dragId)!.art!} variant="option" />}
        </div>
      )}

      <div className="pair__go">
        <button
          type="button"
          className="btn btn--primary btn--large"
          disabled={disabled || !complete}
          onClick={() => onCommit(placed.map((v) => v ?? '').join('-'))}
        >
          {complete ? 'All done!' : held ? 'Now tap a box' : 'Fill every box'}
        </button>
      </div>
    </div>
  );
}
