import type { ReactElement } from 'react';

/**
 * Glyph library for question illustrations. Every glyph draws inside a 100x100
 * box and paints with the locked color roles, so art inherits the theme.
 *
 * Kept deliberately simple and chunky — these are read at a glance by a
 * six-year-old on a tablet, not studied.
 */
export type GlyphName =
  | 'sun'
  | 'moon'
  | 'pinecone'
  | 'fish'
  | 'berry'
  | 'mitten'
  | 'tent'
  | 'bearcub'
  | 'moose'
  | 'canoe'
  | 'campfire'
  | 'compass'
  | 'star'
  | 'leaf'
  | 'tree'
  | 'bowl'
  | 'backpack'
  | 'map'
  | 'snowflake'
  | 'bottle'
  | 'fox'
  | 'river'
  | 'rope'
  | 'match'
  | 'teacher';

const FUR = 'var(--mascot-fur)';
const AMBER = 'var(--accent-gold)';
const MOSS = 'var(--accent-primary)';
const INK = 'var(--text-primary)';
const SAND = 'var(--surface-canvas)';

/** Shared outline weight — the art reads as one set because of this. */
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const GLYPHS: Record<GlyphName, ReactElement> = {
  /** Ms Hannah's head, for avatar chips. The full figure lives in Teacher.tsx. */
  teacher: (
    <g {...S}>
      <path d="M18 46a32 32 0 0 1 64 0v30c0 8-4 14-10 18l-4-12-4 14c-6 3-10 4-14 4s-8-1-14-4l-4-14-4 12c-6-4-10-10-10-18z" fill="var(--teacher-hair)" />
      <ellipse cx="50" cy="50" rx="26" ry="29" fill="var(--teacher-skin)" />
      <path d="M24 44a26 26 0 0 1 52 0c-4-7-11-5-18-3-8 3-15 5-22 4-5-1-9 0-12-1z" fill="var(--teacher-hair)" />
      <g fill="var(--teacher-skin-shade)" stroke="none">
        <circle cx="36" cy="61" r="1.2" /><circle cx="40" cy="64" r="1.2" /><circle cx="60" cy="61" r="1.2" /><circle cx="64" cy="64" r="1.2" />
      </g>
      <g fill="none" strokeWidth="3">
        <circle cx="39" cy="52" r="9" />
        <circle cx="61" cy="52" r="9" />
        <path d="M48 52h4" />
      </g>
      <path d="M42 66q8 6 16 0" fill="none" strokeWidth="3" />
      <path d="M30 96a20 20 0 0 1 40 0z" fill="var(--teacher-top)" />
      <path d="M42 84h16v12H42z" fill="var(--teacher-blouse)" />
    </g>
  ),
  sun: (
    <g {...S}>
      <circle cx="50" cy="50" r="22" fill={AMBER} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line key={deg} x1="50" y1="18" x2="50" y2="8" transform={`rotate(${deg} 50 50)`} />
      ))}
    </g>
  ),
  moon: (
    <g {...S}>
      <path d="M62 14a38 38 0 1 0 24 62A40 40 0 0 1 62 14z" fill={AMBER} />
    </g>
  ),
  pinecone: (
    <g {...S}>
      <ellipse cx="50" cy="54" rx="24" ry="32" fill="#a9723f" />
      <path d="M32 40h36M30 56h40M34 72h32" />
      <path d="M50 22v-8" />
    </g>
  ),
  fish: (
    <g {...S}>
      <path d="M18 50c14-20 40-20 54 0-14 20-40 20-54 0z" fill={MOSS} />
      <path d="M72 50l14-12v24z" fill={MOSS} />
      <circle cx="36" cy="46" r="3.5" fill={INK} stroke="none" />
    </g>
  ),
  berry: (
    <g {...S}>
      <circle cx="38" cy="62" r="16" fill="#b0455f" />
      <circle cx="62" cy="62" r="16" fill="#b0455f" />
      <circle cx="50" cy="42" r="15" fill="#b0455f" />
      <path d="M50 27v-10" />
    </g>
  ),
  mitten: (
    <g {...S}>
      <path d="M34 30h26a10 10 0 0 1 10 10v34H34z" fill="#b0455f" />
      <path d="M34 44h-6a9 9 0 0 0 0 18h6" fill="#b0455f" />
      <rect x="30" y="74" width="44" height="12" rx="5" fill={FUR} />
    </g>
  ),
  tent: (
    <g {...S}>
      <path d="M50 20L86 78H14z" fill={MOSS} />
      <path d="M50 34l14 44H36z" fill={SAND} />
    </g>
  ),
  bearcub: (
    <g {...S}>
      <circle cx="30" cy="34" r="11" fill={FUR} />
      <circle cx="70" cy="34" r="11" fill={FUR} />
      <circle cx="50" cy="54" r="30" fill={FUR} />
      <ellipse cx="50" cy="64" rx="16" ry="12" fill={SAND} />
      <ellipse cx="50" cy="58" rx="6" ry="4.5" fill={INK} stroke="none" />
      <circle cx="38" cy="46" r="3.5" fill={INK} stroke="none" />
      <circle cx="62" cy="46" r="3.5" fill={INK} stroke="none" />
    </g>
  ),
  moose: (
    <g {...S}>
      <path d="M28 30L14 14M28 30L10 30M72 30l14-16M72 30l18 0" />
      <path d="M36 34h28v26a14 14 0 0 1-28 0z" fill="#6b4a2f" />
      <ellipse cx="50" cy="70" rx="12" ry="9" fill="#4a3220" />
      <circle cx="43" cy="46" r="3.5" fill={INK} stroke="none" />
      <circle cx="57" cy="46" r="3.5" fill={INK} stroke="none" />
    </g>
  ),
  canoe: (
    <g {...S}>
      <path d="M10 52c16 22 64 22 80 0-16-8-64-8-80 0z" fill={AMBER} />
      <path d="M62 20L38 60" />
      <path d="M34 58l10-6 4 8z" fill={INK} />
    </g>
  ),
  campfire: (
    <g {...S}>
      <path d="M50 20c12 14 6 20 0 26-8-8-4-16 0-26z" fill={AMBER} />
      <path d="M50 46c16 10 12 30-2 30s-18-18-2-30" fill={AMBER} />
      <path d="M22 80l56-10M78 80L22 70" />
    </g>
  ),
  compass: (
    <g {...S}>
      <circle cx="50" cy="50" r="34" fill={SAND} />
      <path d="M50 22l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill={MOSS} />
    </g>
  ),
  star: (
    <g {...S}>
      <path d="M50 14l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z" fill={AMBER} />
    </g>
  ),
  leaf: (
    <g {...S}>
      <path d="M78 20C40 20 20 42 20 66c0 8 4 14 4 14s34 2 44-16c8-14 10-32 10-44z" fill={MOSS} />
      <path d="M24 80C40 62 58 46 74 34" />
    </g>
  ),
  tree: (
    <g {...S}>
      <path d="M50 12l20 30H30zM50 32l24 34H26zM50 52l28 32H22z" fill={MOSS} />
      <path d="M50 84v10" />
    </g>
  ),
  bowl: (
    <g {...S}>
      <path d="M16 50h68a34 34 0 0 1-68 0z" fill={SAND} />
      <path d="M36 34c0-8 8-8 8-16M56 34c0-8 8-8 8-16" />
    </g>
  ),
  backpack: (
    <g {...S}>
      <rect x="24" y="30" width="52" height="54" rx="14" fill={MOSS} />
      <path d="M36 30a14 14 0 0 1 28 0" />
      <rect x="36" y="54" width="28" height="18" rx="6" fill={SAND} />
    </g>
  ),
  map: (
    <g {...S}>
      <path d="M14 26l24-8 24 8 24-8v56l-24 8-24-8-24 8z" fill={SAND} />
      <path d="M38 18v56M62 26v56" />
    </g>
  ),
  snowflake: (
    <g {...S}>
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <line x1="50" y1="14" x2="50" y2="86" />
          <path d="M50 24l-10 10M50 24l10 10M50 76l-10-10M50 76l10-10" />
        </g>
      ))}
    </g>
  ),
  bottle: (
    <g {...S}>
      <rect x="36" y="12" width="28" height="14" rx="5" fill={SAND} />
      <path d="M38 26h24v52a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z" fill={MOSS} />
    </g>
  ),
  fox: (
    <g {...S}>
      <path d="M22 26l12 24-16-4zM78 26L66 50l16-4z" fill="#c4703a" />
      <path d="M28 40h44v22a22 22 0 0 1-44 0z" fill="#c4703a" />
      <path d="M40 66h20l-10 14z" fill={FUR} />
      <circle cx="40" cy="52" r="3.5" fill={INK} stroke="none" />
      <circle cx="60" cy="52" r="3.5" fill={INK} stroke="none" />
    </g>
  ),
  river: (
    <g {...S}>
      <path d="M10 34c16-10 26 10 40 0s24-10 40 0" fill="none" />
      <path d="M10 54c16-10 26 10 40 0s24-10 40 0" fill="none" />
      <path d="M10 74c16-10 26 10 40 0s24-10 40 0" fill="none" />
    </g>
  ),
  rope: (
    <g {...S}>
      <circle cx="50" cy="50" r="30" fill="none" />
      <circle cx="50" cy="50" r="18" fill="none" />
      <path d="M50 20l8-10M80 50l10 6" />
    </g>
  ),
  match: (
    <g {...S}>
      <rect x="30" y="28" width="8" height="54" rx="4" fill={SAND} />
      <circle cx="34" cy="24" r="9" fill={AMBER} />
      <rect x="60" y="28" width="8" height="54" rx="4" fill={SAND} />
      <circle cx="64" cy="24" r="9" fill={AMBER} />
    </g>
  ),
};

interface GlyphProps {
  name: GlyphName;
  size?: number;
  title?: string;
}

export function Glyph({ name, size = 64, title }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {GLYPHS[name]}
    </svg>
  );
}
