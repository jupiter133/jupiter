/**
 * The child profile the placement flow runs against.
 *
 * In the host app this comes from the signed-in family's profile — the name is
 * already known by the time a parent reaches this flow, so the flow never asks
 * for it. This module is the seam where the host injects it; the demo build
 * falls back to a placeholder and accepts `?name=` for trying other values.
 */
export interface ChildProfile {
  name: string;
}

const DEMO_PROFILE: ChildProfile = { name: 'Maya' };

export function loadChildProfile(): ChildProfile {
  if (typeof window === 'undefined') return DEMO_PROFILE;
  const fromQuery = new URLSearchParams(window.location.search).get('name');
  const name = fromQuery?.trim();
  return name ? { name } : DEMO_PROFILE;
}
