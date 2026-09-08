type Mood = 'greeting' | 'cheering' | 'thinking';

interface Props {
  size?: number;
  mood?: Mood;
  float?: boolean;
}

/**
 * Nanuk, the OLC guide. Inline SVG so the mascot picks up the locked color
 * roles and stays crisp at any tablet density.
 */
export function PolarBear({ size = 220, mood = 'greeting', float = true }: Props) {
  const armLift = mood === 'cheering' ? -18 : 0;
  return (
    <svg
      className={`mascot${float ? ' mascot--float' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      stroke="var(--mascot-outline)"
      strokeWidth="3"
      role="img"
      aria-label="Nanuk the polar bear, your guide"
    >
      {/* scarf tail */}
      <path d="M62 132 q-16 12 -10 30 l18 -6 q-6 -12 4 -20z" fill="var(--accent-primary)" />
      {/* body */}
      <ellipse cx="100" cy="146" rx="52" ry="42" fill="var(--mascot-fur)" />
      {/* arms */}
      <ellipse
        cx="54"
        cy={140 + armLift}
        rx="16"
        ry="22"
        fill="var(--mascot-fur-shade)"
        transform={mood === 'cheering' ? 'rotate(-24 54 140)' : undefined}
      />
      <ellipse
        cx="146"
        cy={140 + armLift}
        rx="16"
        ry="22"
        fill="var(--mascot-fur-shade)"
        transform={mood === 'cheering' ? 'rotate(24 146 140)' : undefined}
      />
      {/* scarf */}
      <rect x="66" y="118" width="68" height="18" rx="9" fill="var(--accent-primary)" />
      {/* ears */}
      <circle cx="66" cy="46" r="16" fill="var(--mascot-fur)" />
      <circle cx="134" cy="46" r="16" fill="var(--mascot-fur)" />
      <circle cx="66" cy="46" r="7" fill="var(--mascot-fur-shade)" />
      <circle cx="134" cy="46" r="7" fill="var(--mascot-fur-shade)" />
      {/* head */}
      <ellipse cx="100" cy="82" rx="44" ry="40" fill="var(--mascot-fur)" />
      {/* muzzle */}
      <ellipse cx="100" cy="98" rx="24" ry="18" fill="var(--mascot-fur-shade)" />
      <ellipse cx="100" cy="90" rx="9" ry="6.5" fill="var(--mascot-nose)" />
      <path
        d={mood === 'cheering' ? 'M88 104 q12 14 24 0' : 'M90 104 q10 8 20 0'}
        stroke="var(--mascot-nose)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes */}
      {mood === 'cheering' ? (
        <>
          <path d="M78 74 q7 -8 14 0" stroke="var(--mascot-nose)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M108 74 q7 -8 14 0" stroke="var(--mascot-nose)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle className="mascot__eye" cx="85" cy="76" r="5.5" fill="var(--mascot-nose)" />
          <circle className="mascot__eye" cx="115" cy="76" r="5.5" fill="var(--mascot-nose)" />
          <circle cx="87" cy="74" r="2" fill="var(--mascot-fur)" />
          <circle cx="117" cy="74" r="2" fill="var(--mascot-fur)" />
        </>
      )}
      {/* explorer cap */}
      <path d="M70 54 q30 -28 60 0 z" fill="var(--accent-secondary)" />
      <rect x="64" y="50" width="72" height="10" rx="5" fill="var(--accent-secondary)" />
    </svg>
  );
}
