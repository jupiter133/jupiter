type Mood = 'greeting' | 'cheering' | 'thinking';

interface Props {
  size?: number;
  mood?: Mood;
  float?: boolean;
}

/**
 * Ms Hannah — the OLC teacher who guides the discovery quest.
 *
 * Inline SVG so she picks up the locked color roles and stays crisp at any
 * tablet density. The likeness is a placeholder: `--teacher-*` in tokens.css
 * carries the four colors, so real character art drops in without touching any
 * screen.
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
        {/* shoulders */}
        <path d="M40 200v-14a34 34 0 0 1 26-33l34-8 34 8a34 34 0 0 1 26 33v14z" fill="var(--teacher-top)" />
        {/* collar + scout neckerchief, keeping the camp thread */}
        <path d="M84 146l16 16 16-16" fill="none" />
        <path d="M100 160l16 6-16 22-16-22z" fill="var(--accent-primary)" />
        {/* neck */}
        <path d="M86 126h28v18a14 14 0 0 1-28 0z" fill="var(--teacher-skin-shade)" />
        {/* hair behind the face */}
        <path d="M52 84a48 48 0 0 1 96 0v40l-12-6V88H64v30l-12 6z" fill="var(--teacher-hair)" />
        {/* face */}
        <ellipse cx="100" cy="88" rx="38" ry="42" fill="var(--teacher-skin)" />
        {/* fringe */}
        <path d="M62 78a38 38 0 0 1 76 0c-12-8-24 2-38 2s-26-10-38-2z" fill="var(--teacher-hair)" />
        {/* glasses */}
        <g fill="none">
          <rect x="70" y="80" width="26" height="20" rx="9" />
          <rect x="104" y="80" width="26" height="20" rx="9" />
          <path d="M96 90h8" />
        </g>
        {/* eyes */}
        {cheering ? (
          <g fill="none">
            <path d="M76 92q7 -8 14 0" />
            <path d="M110 92q7 -8 14 0" />
          </g>
        ) : (
          <>
            <circle className="guide__eye" cx="83" cy="90" r="4.5" fill="var(--teacher-ink)" stroke="none" />
            <circle className="guide__eye" cx="117" cy="90" r="4.5" fill="var(--teacher-ink)" stroke="none" />
          </>
        )}
        {/* smile */}
        <path
          d={cheering ? 'M86 110q14 16 28 0' : 'M88 111q12 9 24 0'}
          fill="none"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}
