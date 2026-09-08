import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Logical screen size the flow is designed against — a landscape 10" tablet.
 * Fixing it and scaling the whole thing keeps the mockup faithful: the layout
 * is always the one that was designed, never a reflowed browser approximation.
 */
const SCREEN_W = 1280;
const SCREEN_H = 800;
/** Scaling past this makes the bezel look like a TV rather than a tablet. */
const MAX_SCALE = 1.35;

interface Props {
  children: ReactNode;
}

export function TabletFrame({ children }: Props) {
  const wellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const well = wellRef.current;
    if (!well) return;

    const fit = () => {
      const { width, height } = well.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / SCREEN_W, height / SCREEN_H, MAX_SCALE));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(well);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="device-stage">
      <div className="device-well" ref={wellRef}>
        <div
          className="tablet"
          style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}
        >
          <span className="tablet__camera" aria-hidden="true" />
          <div className="tablet__screen">
            <div
              className="tablet__canvas"
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                transform: `scale(${scale})`,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
