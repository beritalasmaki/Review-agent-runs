/**
 * The accessible name for the app's wordmark (docs/DECISIONS.md, 0124, 0125, 0126). The wordmark
 * itself is not a rendered image with its own `alt` text — it's a hole cut through an existing bar
 * or panel's own glass fill (`topnav-logo-cutout`, `src/styles/index.css`), a background effect
 * with no element of its own to carry a name. This gives it one: visually hidden, so it announces
 * to assistive tech without needing to occupy, or visually line up with, the hole itself.
 */
export function LogoLabel() {
  return <span role="img" aria-label="Review agent runs" className="sr-only" />
}
