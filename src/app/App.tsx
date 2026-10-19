import { useState } from 'react'
import { OnboardingTour } from '../components/OnboardingTour'
import { MyReviews } from '../features/run/MyReviews'
import { RunReviewPage } from '../features/run/RunReviewPage'
import { LIST_TOUR_STEPS, RUN_TOUR_STEPS } from '../features/run/tourSteps'
import { shouldShowIntro } from './intro'
import { markListLegFinished, markTourSeen, shouldShowListTour, shouldShowRunTour } from './tour'
import { WelcomeIntro } from './WelcomeIntro'
import { WelcomeModal } from './WelcomeModal'

/*
 * Application shell. The review page lives inside another service platform that owns the
 * global navigation, logo and main menu (docs/DECISIONS.md, 0042) — so this shell adds none of
 * its own. There is no router yet (AGENTS.md, Out of scope): the home page — no `?run=` given
 * — is "My reviews", the list a reviewer lands on first; `?run=<id>` opens that one run's
 * review, reached by clicking a row or a direct link. `?run=run-does-not-exist` reaches the
 * not-found state. `?delay=<ms>` slows whichever page's load on purpose (`lib/api.ts` supports
 * it on both `getRun` and `listRuns`), to see the loading state — and how the welcome intro
 * hands off to it — in a real browser.
 *
 * The welcome intro (docs/DECISIONS.md, 0048, 0049, 0071) is laid over the page, not in place
 * of it, and only over the home page: a reviewer who lands straight on a run — a shared link, a
 * notification — gets straight to work, with no decorative "Made by" credit in the way.
 *
 * The onboarding tour (docs/DECISIONS.md, 0078, 0079) follows it: once the intro is no longer
 * in the way, a welcome modal asks directly — take the guided tour, or skip it. Only "take the
 * tour" starts Leg 1, on My reviews; reaching its last step, or the visitor navigating away
 * mid-tour (its own spotlighted run row is a real link — clicking it, as the step invites, is
 * the common way Leg 1 ends, not just reaching "Done"), records that Leg 2 should continue the
 * next time a run page loads.
 */
function currentParams() {
  const params = new URLSearchParams(window.location.search)
  const delay = Number(params.get('delay'))
  return {
    runId: params.get('run'),
    delayMs: Number.isFinite(delay) && delay > 0 ? delay : undefined,
  }
}

const runHref = (id: string) => `?run=${encodeURIComponent(id)}`

export default function App() {
  const { runId, delayMs } = currentParams()
  const [showIntro, setShowIntro] = useState(shouldShowIntro)
  // On the home page the welcome modal waits for the intro to finish first, so the two never
  // overlap — it starts out false here whenever the intro is about to show, and `WelcomeIntro`'s
  // own `onDone` turns it on.
  const [showWelcomeModal, setShowWelcomeModal] = useState(
    () => !runId && !shouldShowIntro() && shouldShowListTour(),
  )
  // Leg 1 (My reviews) only ever starts from the welcome modal's "Take the tour", never on its
  // own. Leg 2 (a run page) has no modal of its own — it is already a continuation of a choice
  // the visitor made on My reviews — so it still starts automatically.
  const [showTour, setShowTour] = useState(() => (runId ? shouldShowRunTour() : false))

  function dismissTour(reason: 'skip' | 'escape' | 'finished' | 'navigated') {
    setShowTour(false)
    // Leg 1 reaching its own last step, or the visitor navigating away mid-tour (its own
    // spotlighted run row is a real link), is what continues the tour rather than ending it:
    // Leg 2 then plays the next time a run page loads, if the visitor opens one. An explicit
    // Skip or Escape always ends it outright, even on Leg 1.
    if ((reason === 'finished' || reason === 'navigated') && !runId) markListLegFinished()
    else markTourSeen()
  }

  return (
    <>
      {/* The frosted-glass page background (docs/DECISIONS.md, 0089, made app-wide by 0097)
          applies to every screen now, run page included. The slowly drifting ambient colour
          (0116, rebuilt in 0117) is part of `bg-page-glass` itself now — more `radial-gradient()`
          layers on the same utility, not a separate positioned element. */}
      <main className="min-h-screen bg-page-glass">
        {runId ? (
          <RunReviewPage runId={runId} getRunOptions={delayMs ? { delayMs } : undefined} />
        ) : (
          <MyReviews runHref={runHref} options={delayMs ? { delayMs } : undefined} />
        )}
      </main>
      {showIntro && !runId && (
        <WelcomeIntro
          onDone={() => {
            setShowIntro(false)
            setShowWelcomeModal(shouldShowListTour())
          }}
        />
      )}
      {showWelcomeModal && (
        <WelcomeModal
          onStartTour={() => {
            setShowWelcomeModal(false)
            setShowTour(true)
          }}
          onSkip={() => {
            setShowWelcomeModal(false)
            markTourSeen()
          }}
        />
      )}
      {showTour && (
        <OnboardingTour steps={runId ? RUN_TOUR_STEPS : LIST_TOUR_STEPS} onDismiss={dismissTour} />
      )}
    </>
  )
}
