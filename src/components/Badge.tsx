interface Props {
  size?: number;
}

/** "Trail Blazer" badge awarded for finishing the discovery quest.
 *  Awarded for completion, never for accuracy. */
export function Badge({ size = 180 }: Props) {
  return (
    <svg
      className="badge-pop"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="Trail Blazer badge"
    >
      <circle cx="80" cy="80" r="66" fill="var(--accent-primary)" />
      <circle cx="80" cy="80" r="56" fill="var(--accent-secondary)" />
      <circle
        cx="80"
        cy="80"
        r="56"
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth="3"
        strokeDasharray="6 8"
      />
      {/* mountain + trail */}
      <path d="M46 100 L68 62 L84 88 L96 72 L116 100 Z" fill="var(--surface-card)" />
      <path
        d="M52 104 q22 -10 30 4 q10 12 30 2"
        stroke="var(--accent-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="68" cy="46" r="6" fill="var(--accent-primary)" />
    </svg>
  );
}
