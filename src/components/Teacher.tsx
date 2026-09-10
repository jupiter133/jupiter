import figure from '../assets/ms-hannah.png';

type Mood = 'greeting' | 'cheering' | 'thinking';

interface Props {
  size?: number;
  /** Kept on the API for when a second pose exists; one render covers all today. */
  mood?: Mood;
  /** Accepted but ignored: a real person stands still. The bob was for a mascot. */
  float?: boolean;
}

/**
 * Ms Hannah — the OLC teacher who guides the discovery quest.
 *
 * The rendered character, background knocked out and trimmed to the figure.
 * `size` is the height: she is a full-length standing figure, so width follows
 * from the render's own proportions rather than being forced square.
 */
export function Teacher({ size = 220 }: Props) {
  return (
    <img
      className="guide"
      src={figure}
      height={size}
      alt="Ms Hannah, your teacher"
      draggable={false}
    />
  );
}
