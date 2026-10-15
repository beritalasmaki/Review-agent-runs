/**
 * The onboarding tour's once-per-visit, two-leg sequencing (OnboardingTour.tsx,
 * docs/DECISIONS.md 0078). Mirrors `intro.ts`'s shape: a visit is a browser session, so the
 * tour plays again in a new tab or window, but not again on page loads inside one visit.
 *
 * There is no client router (`App.tsx`'s own comment: "There is no router yet") — opening a
 * run from My reviews is a real page load, so the tour's progress across that load has to live
 * in sessionStorage, not React state.
 *
 * `ledger:tour-seen` — once present, neither leg shows again this visit. Set the moment the
 * tour is dismissed (Skip or Escape, from either leg) or Leg 2's last step closes.
 * `ledger:tour-leg` — `'run'`, written the moment Leg 1 finishes its last step on its own
 * (not via Skip): "Leg 1 is done, show Leg 2 next time a run page loads."
 */
export const TOUR_SEEN_KEY = 'ledger:tour-seen'
const TOUR_LEG_KEY = 'ledger:tour-leg'

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(TOUR_SEEN_KEY) != null
  } catch {
    // Storage blocked (a sandboxed frame): treat as seen rather than show the tour on every
    // page load inside the visit.
    return true
  }
}

function readLeg(): 'run' | null {
  try {
    return window.sessionStorage.getItem(TOUR_LEG_KEY) === 'run' ? 'run' : null
  } catch {
    return null
  }
}

/** Leg 1, on My reviews: true on the first visit to the home page this session, before either
 * leg has shown. */
export function shouldShowListTour(): boolean {
  return !readSeen() && readLeg() === null
}

/** Leg 2, on a run page: true only when Leg 1 finished naturally and asked for it. */
export function shouldShowRunTour(): boolean {
  return !readSeen() && readLeg() === 'run'
}

/** Leg 1 reached its last step on its own (not Skip/Escape): record that Leg 2 should play
 * next time a run page loads, without marking the whole tour seen yet. */
export function markListLegFinished() {
  try {
    window.sessionStorage.setItem(TOUR_LEG_KEY, 'run')
  } catch {
    // Nothing to do: without storage the tour simply can't remember being mid-way.
  }
}

/** The whole tour is done: dismissed early from either leg, or Leg 2 finished. */
export function markTourSeen() {
  try {
    window.sessionStorage.setItem(TOUR_SEEN_KEY, new Date().toISOString())
    window.sessionStorage.removeItem(TOUR_LEG_KEY)
  } catch {
    // Nothing to do: without storage the tour simply can't remember having run.
  }
}
