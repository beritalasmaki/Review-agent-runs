import { Button } from '../../components/ui/button'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { LoadingState } from '../../components/LoadingState'
import { Tabs, TabsContent } from '../../components/Tabs'
import type { GetRunOptions, SubmitDecisionOptions } from '../../lib/api'
import { isStillRunning } from '../../lib/decision'
import { buildOpenItems } from '../../lib/openItems'
import type { OpenItemTarget } from '../../lib/openItems'
import type { Run } from '../../lib/types'
import { DecisionPanel } from './DecisionPanel'
import { EvidenceTab } from './EvidenceTab'
import { InProgressBox } from './InProgressBox'
import { OpenItemsNotice } from './OpenItemsNotice'
import { checkCardId, scoreCardId } from './openItemTargets'
import { RunDetails } from './RunDetails'
import { RunOverview } from './RunOverview'
import { RunShape } from './RunShape'
import { RunTopBar } from './RunTopBar'
import { RunViewTabs } from './RunViewTabs'
import { StepsTab } from './StepsTab'
import { StoryTimeline } from './StoryTimeline'
import { UndoBox } from './UndoBox'
import { UnverifiedList } from './UnverifiedList'
import { useAttentionFavicon } from './useAttentionFavicon'
import { useRun } from './useRun'

/**
 * The review page — the "story layout" (docs/DECISIONS.md, 0038, and 0046 for the columns).
 * Under the page's own bar (the breadcrumb, and what is open before a decision — 0053), three columns: *Run details*
 * on the left; the overview card, then the view tabs and one view at a time — Story, Evidence or
 * All steps — in the middle (0052); on the right, the decision panel and what is not checked before a
 * decision, or the undo window, what is still unverified and the run's shape after one. The
 * side columns stay the same for all three views.
 *
 * Loading, not-found and error states are handled here, once. The run is held in local state
 * so a decision, a conflict or an undo updates the screen immediately, without a refetch.
 *
 * Switching views (docs/DECISIONS.md, 0044): the top bar and the view tabs are sticky; choosing a tab moves focus
 * to the chosen view's heading, scrolling it into view when it is not already near the top —
 * so the change is visible, and a screen reader hears where it landed. The tabs use manual activation: arrow keys move along the tab list,
 * Enter, Space or a click selects.
 */
export type RunView = 'story' | 'evidence' | 'steps'

export interface RunReviewPageProps {
  runId: string
  /** Where the breadcrumb's "My reviews" goes. */
  reviewsHref?: string
  /** Passed straight through to `useRun`. Mainly for stories and tests. */
  getRunOptions?: GetRunOptions
  /** Passed straight through to `DecisionPanel`. Mainly for stories and tests. */
  submitDecisionOptions?: SubmitDecisionOptions
  /** Mainly for stories and tests: the view to open on. */
  defaultView?: RunView
}

export function RunReviewPage({
  runId,
  reviewsHref = '/',
  getRunOptions,
  submitDecisionOptions,
  defaultView = 'story',
}: RunReviewPageProps) {
  const { state, refetch } = useRun(runId, getRunOptions)
  // `null` means nothing on this page has changed the loaded run yet.
  const [changedRun, setChangedRun] = useState<Run | null>(null)
  const [view, setView] = useState<RunView>(defaultView)
  const [focusEventId, setFocusEventId] = useState<string | undefined>(undefined)
  // A card an open item's link asked for (0055). An object, so a second click on the same
  // link runs the effect again.
  const [itemCard, setItemCard] = useState<{ id: string } | null>(null)
  // True once a decision has been made on this page — the undo box then plays the success
  // check and takes focus. Not true for a run that loaded already decided.
  const [decidedHere, setDecidedHere] = useState(false)
  // Set when the reviewer picks a tab, read once after the new view has rendered.
  const focusViewHeading = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [barHeight, setBarHeight] = useState<number | undefined>(undefined)
  const [tabsHeight, setTabsHeight] = useState<number | undefined>(undefined)
  const detailsRef = useRef<HTMLElement>(null)
  const [detailsScroll, setDetailsScroll] = useState(false)

  // The sticky bar's and view tabs' heights, so the tabs stick under the bar, and scrolled-to
  // headings and the sticky "Run details" column sit below them rather than under them.
  const loaded = state.status === 'success'
  useEffect(() => {
    const bar = barRef.current
    const tabs = tabsRef.current
    if (!bar || !tabs || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setBarHeight(bar.offsetHeight)
      setTabsHeight(tabs.offsetHeight)
    })
    observer.observe(bar)
    observer.observe(tabs)
    return () => observer.disconnect()
  }, [loaded])

  // From xl up, "Run details" is sticky and scrolls on its own when it is taller than the
  // window (docs/DECISIONS.md, 0054). Only then is it a tab stop, so a keyboard can scroll it
  // too. Watched on the card, for the window's height, and on its contents, for what changes
  // after a decision.
  useEffect(() => {
    const details = detailsRef.current
    if (!details || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() =>
      setDetailsScroll(details.scrollHeight > details.clientHeight + 1),
    )
    observer.observe(details)
    for (const child of details.children) observer.observe(child)
    return () => observer.disconnect()
  }, [loaded])

  useEffect(() => {
    if (!focusViewHeading.current) return
    focusViewHeading.current = false
    // One frame later: Radix selects a tab on mousedown, and the browser's own default then
    // focuses that tab — focusing the heading any sooner would be undone. The new panel has
    // also mounted by then.
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(`${view}-heading`)
      if (!heading) return
      heading.focus({ preventScroll: true })
      const top = heading.getBoundingClientRect().top
      const tabsBottom = tabsRef.current?.getBoundingClientRect().bottom ?? 0
      if (top < tabsBottom || top > window.innerHeight / 2)
        heading.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [view])

  // An open item's card, once the story is showing: scrolled to the middle of the window, so
  // it is clear of the sticky bar and tabs, and focused. If the story does not show that card,
  // the story's heading takes focus instead.
  useEffect(() => {
    if (!itemCard || view !== 'story') return
    const frame = requestAnimationFrame(() => {
      const card = document.getElementById(itemCard.id)
      if (card) {
        card.scrollIntoView({ block: 'center' })
        card.focus({ preventScroll: true })
      } else {
        document.getElementById('story-heading')?.focus()
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [itemCard, view])

  // An amber dot on the tab's icon while the run has things to solve (0054).
  const shownRun = changedRun ?? (state.status === 'success' ? state.run : null)
  // Things to solve: an undecided run with open items, once it has stopped running. The
  // favicon's dot and the top bar's notice both follow it.
  const toSolve =
    shownRun != null &&
    shownRun.decision == null &&
    !isStillRunning(shownRun) &&
    buildOpenItems(shownRun).length > 0
  useAttentionFavicon(toSolve)

  if (state.status === 'loading') {
    return <LoadingState label="Loading run…" />
  }

  if (state.status === 'not-found') {
    return (
      <p className="mx-auto max-w-6xl p-[var(--space-6)] text-body text-text-secondary">
        Could not find a run with id "{runId}".{' '}
        <Button
          asChild
          variant="link"
          size="inline"
          className="text-body font-normal font-body underline"
        >
          <a href={reviewsHref}>Back to my reviews</a>
        </Button>
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="mx-auto max-w-6xl p-[var(--space-6)] text-body text-text-secondary">
        Could not load this run. {state.error.message}{' '}
        <Button
          variant="link"
          size="inline"
          onClick={refetch}
          className="text-body font-normal font-body underline"
        >
          Retry
        </Button>
      </p>
    )
  }

  const run = changedRun ?? state.run
  const decided = run.decision != null

  function applyRun(updated: Run) {
    setChangedRun(updated)
    setDecidedHere(updated.decision != null)
  }

  function chooseView(next: RunView) {
    focusViewHeading.current = true
    setView(next)
  }

  // A link into one step: `StepsTab` focuses that row itself, not the heading.
  function showStep(eventId: string) {
    setFocusEventId(eventId)
    setView('steps')
  }

  // "Show the …" under an open item (0055): a note's own row in the step list, or a check's
  // or score's card in the story.
  function showItem(target: OpenItemTarget) {
    if (target.kind === 'step') {
      showStep(target.eventId)
      return
    }
    setView('story')
    setItemCard({
      id: target.kind === 'check' ? checkCardId(target.gateId) : scoreCardId(target.area),
    })
  }

  const barStyle = {
    ...(barHeight != null && { '--run-bar-height': `${barHeight}px` }),
    ...(tabsHeight != null && { '--run-tabs-height': `${tabsHeight}px` }),
  } as CSSProperties

  return (
    <Tabs
      value={view}
      onValueChange={(value) => chooseView(value as RunView)}
      activationMode="manual"
    >
      <div style={barStyle}>
        <RunTopBar
          ref={barRef}
          run={run}
          reviewsHref={reviewsHref}
          end={toSolve ? <OpenItemsNotice run={run} /> : undefined}
        />

        {/*
         * Three columns from xl up (docs/DECISIONS.md, 0046): run details | overview + view |
         * decision. Two from md: the details sit under the overview. One column below md, in
         * the order overview, decision, details, view — so the decision is never at the bottom
         * of a long page. The last row takes any spare height, so a short view never pushes a
         * gap in under the overview.
         */}
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 items-start gap-[var(--space-5)] px-[var(--space-4)] pt-[var(--space-5)] pb-[var(--space-7)] md:grid-cols-[minmax(0,1fr)_21.25rem] md:grid-rows-[auto_auto_1fr] md:px-[var(--space-6)] xl:grid-cols-[17.5rem_minmax(0,1fr)_21.25rem] xl:grid-rows-[auto_1fr]">
          <div className="min-w-0 md:col-start-1 md:row-start-1 xl:col-start-2">
            <RunOverview run={run} />
          </div>

          <aside
            aria-label={
              isStillRunning(run)
                ? 'Your decision, not ready yet'
                : decided
                  ? 'The decision record'
                  : 'Your decision'
            }
            className="flex min-w-0 flex-col gap-[var(--space-4)] md:col-start-2 md:row-span-3 md:row-start-1 xl:col-start-3 xl:row-span-2"
          >
            {isStillRunning(run) ? (
              <InProgressBox run={run} reviewsHref={reviewsHref} />
            ) : decided ? (
              <>
                <UndoBox
                  run={run}
                  onRunUpdated={applyRun}
                  celebrate={decidedHere}
                  undoOptions={submitDecisionOptions}
                />
                <UnverifiedList run={run} />
                <RunShape run={run} />
              </>
            ) : (
              <>
                <DecisionPanel
                  // A fresh panel after an undo: the earlier ticks and reason belonged to a
                  // decision that no longer stands.
                  key={run.status}
                  run={run}
                  onRunUpdated={applyRun}
                  submitDecisionOptions={submitDecisionOptions}
                  onShowItem={showItem}
                />
                <UnverifiedList run={run} />
              </>
            )}
          </aside>

          <div className="min-w-0 md:col-start-1 md:row-start-2 xl:sticky xl:top-[calc(var(--run-bar-height,4rem)+var(--space-4))] xl:row-span-2 xl:row-start-1">
            <RunDetails
              ref={detailsRef}
              run={run}
              tabIndex={detailsScroll ? 0 : undefined}
              className="xl:max-h-[calc(100dvh-var(--run-bar-height,4rem)-2*var(--space-4))] xl:scrollbar-none xl:overflow-y-auto xl:overscroll-contain"
            />
          </div>

          <div className="min-w-0 rounded-lg border border-border-subtle bg-surface shadow-card md:col-start-1 md:row-start-3 xl:col-start-2 xl:row-start-2">
            <RunViewTabs ref={tabsRef} run={run} />
            <div className="px-[var(--space-5)] pb-[var(--space-5)]">
              <TabsContent value="story">
                <StoryTimeline run={run} onShowSteps={showStep} />
              </TabsContent>
              <TabsContent value="evidence">
                <EvidenceTab run={run} onOpenStep={showStep} />
              </TabsContent>
              <TabsContent value="steps">
                <StepsTab run={run} focusEventId={focusEventId} />
              </TabsContent>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  )
}
