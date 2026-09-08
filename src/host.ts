/**
 * The host app's navigation seam.
 *
 * "Exit" leaves the placement flow. In the host app that returns the parent to
 * wherever they came from (a dashboard, say). The demo build has nowhere to go,
 * so it falls back to whatever the caller passes — the flow's restart.
 */
export function exitToHost(fallback: () => void): void {
  fallback();
}
