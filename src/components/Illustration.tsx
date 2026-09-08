import { Glyph, GLYPHS } from './glyphs';
import type { GlyphName } from './glyphs';
import type { ArtSpec, SceneName } from '../assessment/types';

/** Scenes are compositions of existing glyphs rather than bespoke art, which
 *  keeps the illustration set consistent and cheap to extend. */
const SCENES: Record<SceneName, { glyph: GlyphName; s: number }[]> = {
  'lost-mitten': [{ glyph: 'tree', s: 1 }, { glyph: 'mitten', s: 1.05 }, { glyph: 'snowflake', s: 0.7 }],
  'camp-breakfast': [{ glyph: 'tent', s: 1 }, { glyph: 'campfire', s: 0.95 }, { glyph: 'bowl', s: 0.85 }],
  compass: [{ glyph: 'compass', s: 1.05 }, { glyph: 'river', s: 1 }, { glyph: 'tree', s: 0.85 }],
  aurora: [{ glyph: 'moon', s: 0.95 }, { glyph: 'star', s: 0.7 }, { glyph: 'tree', s: 1 }],
  'ice-road': [{ glyph: 'snowflake', s: 0.85 }, { glyph: 'river', s: 1.1 }, { glyph: 'tree', s: 0.9 }],
  'two-maps': [{ glyph: 'map', s: 1 }, { glyph: 'map', s: 1 }, { glyph: 'river', s: 0.9 }],
  'bear-cubs': [{ glyph: 'bearcub', s: 1.05 }, { glyph: 'bearcub', s: 0.8 }, { glyph: 'tree', s: 0.95 }],
  'narrow-trail': [{ glyph: 'tree', s: 1 }, { glyph: 'backpack', s: 0.9 }, { glyph: 'tree', s: 1 }],
  'trail-guide': [{ glyph: 'backpack', s: 1 }, { glyph: 'map', s: 0.95 }, { glyph: 'tree', s: 0.9 }],
  'pack-list': [{ glyph: 'rope', s: 0.9 }, { glyph: 'map', s: 0.95 }, { glyph: 'match', s: 0.9 }],
  'wind-out': [{ glyph: 'campfire', s: 1.05 }, { glyph: 'tent', s: 0.95 }],
  moose: [{ glyph: 'moose', s: 1.15 }, { glyph: 'tree', s: 0.9 }],
  canoe: [{ glyph: 'canoe', s: 1.2 }, { glyph: 'river', s: 0.95 }],
};

const SCENE_W = 300;
const SCENE_H = 130;
/** Glyphs stand on this line, so a scene never looks like floating stickers. */
const GROUND_Y = 112;

function Scene({ scene, height }: { scene: SceneName; height: number }) {
  const parts = SCENES[scene];
  const cell = SCENE_W / parts.length;

  return (
    <svg
      className="art__scene"
      width="100%"
      height={height}
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect x="10" y={GROUND_Y} width={SCENE_W - 20} height="10" rx="5" fill="var(--border-subtle)" />
      {parts.map((part, i) => {
        // Even columns, each glyph centred in its column and sat on the ground.
        const box = 100 * part.s;
        const x = cell * i + (cell - box) / 2;
        const y = GROUND_Y - box;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${part.s})`}>
            {GLYPHS[part.glyph]}
          </g>
        );
      })}
    </svg>
  );
}

/** A row of countable objects. Used for number sense instead of bare digits. */
function CountRow({ glyph, n, faded = 0, size }: { glyph: GlyphName; n: number; faded?: number; size: number }) {
  return (
    <div className="count-row">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          /* Faded rather than crossed out — the child flow never marks anything
             with an X, including inside an illustration. */
          className={i >= n - faded ? 'count-item count-item--gone' : 'count-item'}
        >
          <Glyph name={glyph} size={size} />
        </span>
      ))}
    </div>
  );
}

interface Props {
  art: ArtSpec;
  /** Panel art heads a question; option art sits inside an answer button. */
  variant?: 'panel' | 'option';
}

export function Illustration({ art, variant = 'panel' }: Props) {
  const unit = variant === 'option' ? 36 : 56;

  switch (art.kind) {
    case 'glyph':
      return (
        <div className={`art art--${variant}`}>
          <Glyph name={art.glyph} size={variant === 'option' ? 56 : 96} />
        </div>
      );

    case 'count':
      return (
        <div className={`art art--${variant}`}>
          <CountRow glyph={art.glyph} n={art.n} size={unit} />
        </div>
      );

    case 'countPlus':
      return (
        <div className={`art art--${variant} art--equation`}>
          <CountRow glyph={art.glyph} n={art.n} size={unit} />
          <span className="art__operator">+</span>
          <CountRow glyph={art.glyph} n={art.m} size={unit} />
        </div>
      );

    case 'countTakeAway':
      return (
        <div className={`art art--${variant}`}>
          <CountRow glyph={art.glyph} n={art.n} faded={art.takeAway} size={unit} />
        </div>
      );

    case 'shape': {
      const shapes = {
        triangle: <path d="M50 12L88 84H12z" />,
        square: <rect x="16" y="16" width="68" height="68" rx="6" />,
        circle: <circle cx="50" cy="50" r="36" />,
        rectangle: <rect x="8" y="26" width="84" height="48" rx="6" />,
      };
      return (
        <div className={`art art--${variant}`}>
          <svg width={variant === 'option' ? 64 : 110} height={variant === 'option' ? 64 : 110} viewBox="0 0 100 100" aria-hidden="true">
            <g fill="var(--accent-secondary)" stroke="var(--text-primary)" strokeWidth="4" strokeLinejoin="round">
              {shapes[art.shape]}
            </g>
          </svg>
        </div>
      );
    }

    case 'fraction': {
      const width = variant === 'option' ? 120 : 260;
      const cell = width / art.d;
      return (
        <div className={`art art--${variant}`}>
          <svg width={width} height={variant === 'option' ? 34 : 64} viewBox={`0 0 ${width} 64`} aria-hidden="true">
            {Array.from({ length: art.d }).map((_, i) => (
              <rect
                key={i}
                x={i * cell}
                y={4}
                width={cell}
                height={56}
                fill={i < art.n ? 'var(--accent-gold)' : 'var(--surface-inset)'}
                stroke="var(--text-primary)"
                strokeWidth="3"
              />
            ))}
          </svg>
        </div>
      );
    }

    case 'areaGrid': {
      const cell = variant === 'option' ? 12 : 24;
      return (
        <div className={`art art--${variant}`}>
          <svg
            width={art.w * cell + 6}
            height={art.h * cell + 6}
            viewBox={`0 0 ${art.w * cell + 6} ${art.h * cell + 6}`}
            aria-hidden="true"
          >
            {Array.from({ length: art.h }).map((_, row) =>
              Array.from({ length: art.w }).map((_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * cell + 3}
                  y={row * cell + 3}
                  width={cell}
                  height={cell}
                  fill="var(--accent-secondary-soft)"
                  stroke="var(--accent-secondary)"
                  strokeWidth="2"
                />
              )),
            )}
          </svg>
        </div>
      );
    }

    case 'pair':
      return (
        <div className={`art art--${variant} art--pair`}>
          <span className="art__pair-item">
            <Glyph name={art.left} size={variant === 'option' ? 40 : 84} />
          </span>
          <span className="art__pair-item">
            <Glyph name={art.right} size={variant === 'option' ? 40 : 84} />
          </span>
        </div>
      );

    case 'scene':
      return (
        <div className={`art art--${variant}`}>
          <Scene scene={art.scene} height={variant === 'option' ? 60 : 150} />
        </div>
      );
  }
}
