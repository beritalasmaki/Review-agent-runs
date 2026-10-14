import { useState } from 'react'
import { MyReviews } from '../features/run/MyReviews'
import { RunReviewPage } from '../features/run/RunReviewPage'
import { shouldShowIntro } from './intro'
import { WelcomeIntro } from './WelcomeIntro'

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
  return (
    <>
      <main className="min-h-screen bg-bg">
        {runId ? (
          <RunReviewPage runId={runId} getRunOptions={delayMs ? { delayMs } : undefined} />
        ) : (
          <MyReviews runHref={runHref} options={delayMs ? { delayMs } : undefined} />
        )}
      </main>
      {showIntro && !runId && <WelcomeIntro onDone={() => setShowIntro(false)} />}
    </>
  )
}
