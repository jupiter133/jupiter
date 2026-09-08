import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Logical screen size the flow is designed against — a landscape 10" tablet.
 * Fixing it and scaling the whole thing keeps the mockup faithful: the layout
 * is always the one that was designed, never a reflowed browser approximation.
 */
const SCREEN_W = 1280;
const SCREEN_H = 800;
/** Bezel thickness as a fraction of screen height. */
const BEZEL_RATIO = 0.035;
/** Scaling past this makes the shell read as a TV rather than a tablet. */
const MAX_SCALE = 1.35;

/**
 * The bezel is part of the device's footprint, so it has to be inside the fit
 * calculation — sizing the shell to the screen and then padding it outwards is
 * what pushes the canvas past the frame and clips it.
 *
 * Bezel scales with the screen (b = BEZEL_RATIO * SCREEN_H * s), so the
 * footprint is s * (SCREEN_W + 2 * BEZEL_RATIO * SCREEN_H) wide and
 * s * SCREEN_H * (1 + 2 * BEZEL_RATIO) tall. Solving both against the
 * available box gives the largest scale that fits whole.
 */
const FOOTPRINT_W = SCREEN_W + 2 * BEZEL_RATIO * SCREEN_H;
const FOOTPRINT_H = SCREEN_H * (1 + 2 * BEZEL_RATIO);

interface Props {
  children: ReactNode;
}

export function TabletFrame({ children }: Props) {
  const wellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const well = wellRef.current;
    if (!well) return;

    const fit = () => {
      const { width, height } = well.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / FOOTPRINT_W, height / FOOTPRINT_H, MAX_SCALE));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(well);
    return () => observer.disconnect();
  }, []);

  const bezel = BEZEL_RATIO * SCREEN_H * scale;

  return (
    <div className="device-stage">
      <div className="device-well" ref={wellRef}>
        <div
          className="tablet"
          style={{
            // Content box is exactly the screen; padding adds the bezel around
            // it, which is what the fit calculation above already allowed for.
            width: SCREEN_W * scale,
            height: SCREEN_H * scale,
            padding: bezel,
            borderRadius: bezel * 1.7,
            // Hidden until measured, so the first paint is never a wrong size.
            visibility: scale > 0 ? 'visible' : 'hidden',
          }}
        >
          <span className="tablet__camera" style={{ top: bezel * 0.42 }} aria-hidden="true" />
          <div className="tablet__screen" style={{ borderRadius: bezel * 0.5 }}>
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
