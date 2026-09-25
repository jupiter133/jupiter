import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerOption } from '../assessment/types';

interface Props {
  options: AnswerOption[];
  /** Fired once the child commits the tile sitting in the gap. */
  onCommit: (optionId: string) => void;
  /** Locks everything once an answer is on its way out. */
  disabled: boolean;
}

/**
 * Drag a spelling into the gap.
 *
 * DRAGGING IS NOT THE ONLY WAY IN. Tapping a tile places it, tapping it again
 * takes it back, and the tiles are real buttons so a keyboard reaches them.
 * HTML5 drag-and-drop does not fire on touch at all, and this is a tablet
 * product, so the drag is built on pointer events instead — one code path for
 * mouse, pen and finger.
 *
 * Nothing here says right or wrong. The gap fills, the child commits, and the
 * screen moves on exactly as it does for a tapped answer.
 */
export function DragAnswer({ options, onCommit, disabled }: Props) {
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [over, setOver] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  const grabbed = useRef<{ dx: number; dy: number } | null>(null);

  const insideSlot = useCallback((x: number, y: number) => {
    const box = slot.current?.getBoundingClientRect();
    if (!box) return false;
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }, []);

  useEffect(() => {
    if (dragId === null) return;
    const move = (e: PointerEvent) => {
      const offset = grabbed.current ?? { dx: 0, dy: 0 };
      setPointer({ x: e.clientX - offset.dx, y: e.clientY - offset.dy });
      setOver(insideSlot(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      // Dropped on the gap: it lands. Dropped anywhere else: it goes home,
      // rather than being lost or counted as an answer.
      if (insideSlot(e.clientX, e.clientY)) setPlacedId(dragId);
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
  }, [dragId, insideSlot]);

  const placed = options.find((o) => o.id === placedId) ?? null;

  return (
    <div className="drag">
      <div
        ref={slot}
        className={`drag__slot${placed ? ' drag__slot--filled' : ''}${over ? ' drag__slot--over' : ''}`}
        aria-live="polite"
      >
        {placed ? (
          <button
            type="button"
            className="drag__tile drag__tile--placed"
            disabled={disabled}
            onClick={() => setPlacedId(null)}
            aria-label={`${placed.text} is in the gap. Tap to take it back out.`}
          >
            {placed.text}
          </button>
        ) : (
          <span className="drag__hint">Drop a spelling here</span>
        )}
      </div>

      <div className="drag__tiles" role="group" aria-label="Spellings to choose from">
        {options.map((option) => {
          const isPlaced = option.id === placedId;
          const isDragging = option.id === dragId;
          return (
            <button
              key={option.id}
              type="button"
              className={`drag__tile${isPlaced ? ' drag__tile--gone' : ''}${
                isDragging ? ' drag__tile--lifting' : ''
              }`}
              disabled={disabled || isPlaced}
              onPointerDown={(e) => {
                if (disabled || isPlaced) return;
                const box = e.currentTarget.getBoundingClientRect();
                grabbed.current = { dx: e.clientX - box.left, dy: e.clientY - box.top };
                setPointer({ x: box.left, y: box.top });
                setDragId(option.id);
              }}
              /* A plain tap places it too — a child who cannot drag is not
                 locked out of the item. */
              onClick={() => !disabled && !isPlaced && setPlacedId(option.id)}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* The tile under the finger. Fixed so it is not clipped by the card. */}
      {dragId && pointer && (
        <div
          className="drag__ghost"
          style={{ left: pointer.x, top: pointer.y }}
          aria-hidden="true"
        >
          {options.find((o) => o.id === dragId)?.text}
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--large drag__go"
        disabled={disabled || !placed}
        onClick={() => placed && onCommit(placed.id)}
      >
        {placed ? 'That’s my answer' : 'Put a spelling in the gap'}
      </button>
    </div>
  );
}
