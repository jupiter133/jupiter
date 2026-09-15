interface Props {
  /** Pre-formatted, e.g. "+4,000" or "+4,000 coins". */
  amount: string;
}

/** The design system's coin pill: a gold coin on a soft gold pill. */
export function CoinPill({ amount }: Props) {
  return (
    <span className="coin-pill">
      <svg className="coin-pill__coin" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="var(--olc-gold)" />
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="#D19E12" strokeWidth="1.6" />
      </svg>
      {amount}
    </span>
  );
}
