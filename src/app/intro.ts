/**
 * The welcome intro's once-per-visit logic and timing (WelcomeIntro.tsx, docs/DECISIONS.md
 * 0048, 0049 and 0142). A visit is a browser session: the intro plays again whenever someone opens
 * the site in a new tab or window, or comes back after closing it — but not on the page loads
 * inside one visit (the breadcrumb and "My reviews" links reload the page).
 * Kept apart from the component so `App.tsx` can decide whether to show it without importing
 * the whole overlay's markup, and so the component file exports components only.
 */
export const INTRO_SEEN_KEY = 'ledger:intro-seen'

export const INTRO_TIMING = {
  /** How long the animation plays before the welcome dialog opens, in ms. */
  total: 14000,
} as const

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) != null
  } catch {
    // Storage blocked (a sandboxed frame): treat as seen rather than replay the intro on every
    // page load inside the visit.
    return true
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, new Date().toISOString())
    // The first version kept the flag for good in localStorage; tidy that away.
    window.localStorage.removeItem(INTRO_SEEN_KEY)
  } catch {
    // Nothing to do: without storage the intro simply can't remember having run.
  }
}

/** Whether this page load should show the intro: not yet seen in this visit. (With reduced
 * motion it still shows, as its last frame, so the welcome dialog has its backdrop.) */
export function shouldShowIntro(): boolean {
  return !readSeen()
}
