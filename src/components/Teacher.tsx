type Mood = 'greeting' | 'cheering' | 'thinking';

interface Props {
  size?: number;
  mood?: Mood;
  float?: boolean;
}

/**
 * Ms Hannah — the OLC teacher who guides the discovery quest.
 *
 * Drawn to the character reference: long auburn waves, round glasses,
 * freckles, a white blouse under a mustard cardigan. Inline SVG so she stays
 * crisp at any tablet density and picks up the `--teacher-*` colour roles in
 * tokens.css; the rendered character art can replace this without touching
 * any screen.
 */
export function Teacher({ size = 220, mood = 'greeting', float = true }: Props) {
  const cheering = mood === 'cheering';

  return (
    <svg
      className={`guide${float ? ' guide--float' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Ms Hannah, your teacher"
    >
      <g
        stroke="var(--teacher-ink)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* hair behind everything: long waves falling past the shoulders */}
        <path
          d="M48 80a52 52 0 0 1 104 0v58c0 14-8 26-18 34l-6-22-8 26c-8 6-14 8-20 8s-12-2-20-8l-8-26-6 22c-10-8-18-20-18-34z"
          fill="var(--teacher-hair)"
        />
        <path d="M60 110c-4 18-2 36 4 50M140 110c4 18 2 36-4 50" fill="none" stroke="var(--teacher-hair-shade)" />

        {/* cardigan over the shoulders */}
        <path d="M34 200v-16a36 36 0 0 1 28-35l14-4h48l14 4a36 36 0 0 1 28 35v16z" fill="var(--teacher-top)" />
        {/* blouse showing between the cardigan fronts */}
        <path d="M78 148h44v52H78z" fill="var(--teacher-blouse)" />
        <path d="M78 148l22 20 22-20" fill="none" />
        {/* cardigan fronts + a couple of buttons */}
        <path d="M78 148l-4 52M122 148l4 52" fill="none" stroke="var(--teacher-top-shade)" />
        <circle cx="100" cy="182" r="2.5" fill="var(--teacher-top-shade)" stroke="none" />
        <circle cx="100" cy="194" r="2.5" fill="var(--teacher-top-shade)" stroke="none" />

        {/* neck */}
        <path d="M86 128h28v18a14 14 0 0 1-28 0z" fill="var(--teacher-skin-shade)" />
        {/* face */}
        <ellipse cx="100" cy="90" rx="38" ry="42" fill="var(--teacher-skin)" />
        {/* side-swept fringe */}
        <path d="M62 86a38 38 0 0 1 76 0c-6-12-14-14-26-10-10 3-18 3-28 0-9-3-16-1-22 10z" fill="var(--teacher-hair)" />
        {/* freckles */}
        <g fill="var(--teacher-skin-shade)" stroke="none">
          <circle cx="76" cy="106" r="1.6" />
          <circle cx="82" cy="110" r="1.6" />
          <circle cx="88" cy="106" r="1.6" />
          <circle cx="112" cy="106" r="1.6" />
          <circle cx="118" cy="110" r="1.6" />
          <circle cx="124" cy="106" r="1.6" />
        </g>
        {/* round glasses */}
        <g fill="none">
          <circle cx="83" cy="92" r="13" />
          <circle cx="117" cy="92" r="13" />
          <path d="M96 92h8M70 90l-8-3M130 90l8-3" />
        </g>
        {/* eyes */}
        {cheering ? (
          <g fill="none">
            <path d="M76 93q7 -8 14 0" />
            <path d="M110 93q7 -8 14 0" />
          </g>
        ) : (
          <>
            <circle className="guide__eye" cx="83" cy="93" r="4.5" fill="var(--teacher-ink)" stroke="none" />
            <circle className="guide__eye" cx="117" cy="93" r="4.5" fill="var(--teacher-ink)" stroke="none" />
          </>
        )}
        {/* smile */}
        <path
          d={cheering ? 'M86 112q14 16 28 0' : 'M88 113q12 9 24 0'}
          fill="none"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}
