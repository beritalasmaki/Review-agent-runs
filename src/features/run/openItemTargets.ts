/**
 * The element ids an open item's "Show the …" link goes to (docs/DECISIONS.md, 0055). The
 * cards set them; the page looks them up.
 */
export function checkCardId(gateId: string): string {
  return `check-${gateId}`
}

export function scoreCardId(area: string): string {
  return `score-${area}`
}

/** A card an open item's link lands on: focusable by script only, clear of the sticky bar and
 * view tabs, and outlined while it has focus, so the reviewer sees where they landed. */
export const LINK_TARGET =
  'scroll-mt-[calc(var(--run-bar-height,3rem)+var(--run-tabs-height,3.5rem)+var(--space-4))] focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring'
