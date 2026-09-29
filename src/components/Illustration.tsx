import { Glyph, GLYPHS } from './glyphs';
import type { GlyphName } from './glyphs';
import type { ArtSpec, SceneName, ShapeName } from '../assessment/types';

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

/**
 * What a picture card is, in words, for a button that has no text on it.
 *
 * Every Little Readers answer is a picture with nothing written under it, so
 * without this the answer buttons reach a screen reader as "button, button,
 * button". It describes exactly what a sighted child sees — no more.
 */
/** English is irregular; a bare +s gives "2 fishs" and "3 leafs". */
const PLURAL: Partial<Record<GlyphName, string>> = {
  fish: 'fish',
  leaf: 'leaves',
  berry: 'berries',
  fox: 'foxes',
  bearcub: 'bear cubs',
  moose: 'moose',
};

const countOf = (glyph: GlyphName, n: number) =>
  `${n} ${n === 1 ? glyph.replace(/([a-z])([A-Z])/g, '$1 $2') : (PLURAL[glyph] ?? `${glyph}s`)}`;

export function describeArt(art: ArtSpec): string {
  switch (art.kind) {
    case 'glyph':
      return art.glyph;
    case 'count':
      return countOf(art.glyph, art.n);
    case 'countPlus':
      return `${countOf(art.glyph, art.n)} and ${art.m} more`;
    case 'countTakeAway':
      return `${countOf(art.glyph, art.n)}, ${art.takeAway} faded`;
    case 'shape':
      return art.color ? `${art.color} ${art.shape}` : art.shape;
    case 'swatch':
      return art.color;
    case 'numeral':
      return `the number ${art.n}`;
    case 'letter':
      return `the letter ${art.letter.toUpperCase()}`;
    case 'fraction':
      return `${art.n} of ${art.d} parts shaded`;
    case 'areaGrid':
      return `a grid ${art.w} across and ${art.h} down`;
    case 'pair':
      return `${art.left} and ${art.right}`;
    case 'scene':
      return art.scene.replace(/-/g, ' ');
  }
}

export function Illustration({ art, variant = 'panel' }: Props) {
  const unit = variant === 'option' ? 36 : 56;

  switch (art.kind) {
    case 'glyph':
      return (
        <div className={`art art--${variant} art--glyph`}>
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
      // Drawn in one 100x100 box so every shape lands at the same visual
      // weight — a star must not read as smaller than a square.
      const shapes: Record<ShapeName, JSX.Element> = {
        circle: <circle cx="50" cy="50" r="38" />,
        square: <rect x="14" y="14" width="72" height="72" rx="6" />,
        triangle: <path d="M50 10L90 86H10z" />,
        rectangle: <rect x="6" y="24" width="88" height="52" rx="6" />,
        oval: <ellipse cx="50" cy="50" rx="27" ry="40" />,
        diamond: <path d="M50 8L88 50 50 92 12 50z" />,
        star: <path d="M50 8l12.4 25.9 28.1 3.9-20.4 19.8 5 28.2L50 72.4 24.9 85.8l5-28.2L9.5 37.8l28.1-3.9z" />,
        heart: <path d="M50 88S12 62 12 38a20 20 0 0 1 38-9 20 20 0 0 1 38 9c0 24-38 50-38 50z" />,
        hexagon: <path d="M28 14h44l22 36-22 36H28L6 50z" />,
      };
      const size = variant === 'option' ? 64 : 110;
      // An unpainted shape: white, so the colour the child picks is the only
      // colour on screen and there is nothing to copy.
      const fill = art.outline
        ? 'var(--surface-card)'
        : art.color
          ? `var(--shape-${art.color})`
          : 'var(--accent-secondary)';
      return (
        <div className={`art art--${variant} art--shape`}>
          <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
            <g
              fill={fill}
              stroke="var(--text-primary)"
              strokeWidth={art.outline ? 6 : 4}
              strokeLinejoin="round"
            >
              {shapes[art.shape]}
            </g>
          </svg>
        </div>
      );
    }

    case 'numeral': {
      // Drawn as text rather than nine hand-built paths: a digit is a
      // glyph, and the brand face already has one that a child will meet
      // again everywhere else in the product.
      const d = variant === 'option' ? 64 : 110;
      return (
        <div className={`art art--${variant} art--numeral`}>
          <svg width={d} height={d} viewBox="0 0 100 100" aria-hidden="true">
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="88"
              fontWeight="900"
              fill={art.outline ? 'var(--surface-card)' : 'var(--accent-secondary)'}
              stroke="var(--text-primary)"
              strokeWidth={art.outline ? 3 : 0}
              paintOrder="stroke"
            >
              {art.n}
            </text>
          </svg>
        </div>
      );
    }

    case 'letter': {
      // Lower case with the capital beside it: a child meets both in the
      // wild, and a bank that only ever shows capitals teaches half a letter.
      const d = variant === 'option' ? 64 : 110;
      return (
        <div className={`art art--${variant} art--letter`}>
          <svg width={d * 1.4} height={d} viewBox="0 0 140 100" aria-hidden="true">
            <text x="70" y="52" textAnchor="middle" dominantBaseline="central" fontSize="76" fontWeight="900" fill="var(--accent-secondary)">
              {art.letter.toUpperCase()}
              <tspan fill="var(--text-primary)">{art.letter.toLowerCase()}</tspan>
            </text>
          </svg>
        </div>
      );
    }

    case 'swatch': {
      // A paint chip. Round, because a coloured square next to the square
      // shape card would read as an answer about shapes.
      const d = variant === 'option' ? 64 : 96;
      return (
        <div className={`art art--${variant}`}>
          <svg width={d} height={d} viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill={`var(--shape-${art.color})`} />
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
