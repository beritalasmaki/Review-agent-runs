import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover'

/**
 * A spotlight onboarding tour: one step at a time, each highlighting a real element on the
 * page while the rest of it dims behind it (docs/DECISIONS.md, 0078). Knows nothing about
 * runs, gates or any other product concept — `steps` supplies the targets and the copy, so
 * this would work unchanged in a different product (components/README.md's test).
 *
 * The spotlight is one orange outline around the target whose huge box-shadow dims the rest
 * (docs/DECISIONS.md, 0144, replacing 0078's four rectangles): it is `pointer-events: none`, so the
 * highlighted element stays clickable, and it glides from one target to the next. Between two
 * targets a thin arc is drawn with a bright dot riding it, like a satellite pass. A step can be
 * an overview of the whole page, and the tour can end on a closing card.
 *
 * Escape, from anywhere, ends the tour. Tab cycles only the step bubble's own Back/Skip/Next
 * buttons (a small manual wrap, not a full `aria-modal` trap) — a keyboard user reaches the
 * live page underneath the same way a `Modal.tsx` dialog already works: by dismissing first
 * (Escape or Skip), not by tabbing through a dimmed page mid-tour.
 *
 * If a step's target isn't in the DOM (responsive layout, data not loaded yet), the tour skips
 * straight to the next step rather than showing a bubble with nothing to point at.
 */
export interface TourStep {
  id: string
  /** CSS selector for the element this step highlights, resolved fresh on every step — the
   * page may have re-rendered (sort, filter, a tab change) since the last one. */
  selector: string
  title: string
  body: string
  /** Which side of the target the bubble prefers. Radix still flips it near a screen edge. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** A "look at the whole page" step: the outline goes round what is on screen and the bubble sits
   * low and central. `selector` still has to match (it is how the tour knows the page has
   * loaded). */
  overview?: boolean
  /** The next button's label, when it is not "Next". */
  nextLabel?: string
  /** Runs when this step's next button is pressed, before the tour moves on or ends. */
  onNext?: () => void
}

/** The closing card, shown after the last step when the tour is given one. */
export interface TourFinish {
  label: string
  title: string
  body: string
  startLabel: string
  replayLabel: string
}

export interface OnboardingTourProps {
  steps: TourStep[]
  /** Called once, however the tour ends: the last step's "Done", "Skip tour", Escape, or the
   * visitor navigating away mid-tour — clicking a step's own spotlighted link before reaching
   * the last step is the common way that happens, not a special case to route around. */
  onDismiss: (reason: 'skip' | 'escape' | 'finished' | 'navigated') => void
  /** How long a step waits for its target to appear (My reviews' default fetch delay is
   * 400ms, `lib/api.ts`) before concluding it is genuinely missing and skipping ahead.
   * Overridable so a test can use a real, short wait instead of a fake-timer stand-in for
   * this one number. */
  missingTimeoutMs?: number
  /** Where this leg's first step sits in the whole tour (steps in earlier legs), and the whole
   * tour's length — so the count and the stops read "Step 7 of 10" in the second leg. */
  stepOffset?: number
  totalSteps?: number
  /** A closing card after the last step: "Replay" calls `onReplay`, "Start" ends the tour. */
  finish?: TourFinish
  onReplay?: () => void
}

const DEFAULT_MISSING_TIMEOUT_MS = 3000

/** Gap, in pixels, between the outline and the target's own edge. */
const PAD = 8
/** The bubble's width; the overview bubble sits low and in the middle. */
const CARD_WIDTH = 380

/** A thin arc from the top of one target to the top of the next, drawn as a polygon that widens
 * toward the end, and the same curve as a plain path for the dot to ride. */
function arc(from: DOMRect, to: DOMRect) {
  const ax = from.left + from.width / 2
  const ay = from.top - PAD
  const bx = to.left + to.width / 2
  const by = to.top - PAD
  const mx = (ax + bx) / 2
  const my = Math.max(Math.min(ay, by) - 110, -80)
  const left: string[] = []
  const right: string[] = []
  const N = 40
  for (let k = 0; k <= N; k++) {
    const t = k / N
    const u = 1 - t
    const px = u * u * ax + 2 * u * t * mx + t * t * bx
    const py = u * u * ay + 2 * u * t * my + t * t * by
    let dx = 2 * u * (mx - ax) + 2 * t * (bx - mx)
    let dy = 2 * u * (my - ay) + 2 * t * (by - my)
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    const w = 0.35 + 2.2 * t
    left.push(`${(px - dy * w).toFixed(1)} ${(py + dx * w).toFixed(1)}`)
    right.push(`${(px + dy * w).toFixed(1)} ${(py - dx * w).toFixed(1)}`)
  }
  return {
    d: `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`,
    poly: `M${left.join(' L')} L${right.reverse().join(' L')}Z`,
  }
}

function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab') return
  const focusable = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  )
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export function OnboardingTour({
  steps,
  onDismiss,
  missingTimeoutMs = DEFAULT_MISSING_TIMEOUT_MS,
  stepOffset = 0,
  totalSteps,
  finish,
  onReplay,
}: OnboardingTourProps) {
  const [index, setIndex] = useState(0)
  const [exhausted, setExhausted] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  // Which step `rect` was measured for — a stale rect from the step just left must never
  // render under the new step's title while the new one is still being found.
  const [rectStepId, setRectStepId] = useState<string | null>(null)
  // The arc between the last target and this one, and the bright dot that rides it.
  const [trail, setTrail] = useState<{ key: string; d: string; poly: string } | null>(null)
  const lastTarget = useRef<{ rect: DOMRect; overview: boolean } | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  const step = steps[index]

  useEffect(() => {
    if (exhausted) onDismissRef.current('finished')
  }, [exhausted])

  // Finds this step's target (not during render: the DOM may not be committed yet on the
  // very first render, before React has mounted this step's siblings), scrolls it into view,
  // and keeps the cutout's rect following it — a resize, or the visitor scrolling themselves.
  // A step whose target isn't in the DOM (responsive layout, data not loaded yet) is skipped
  // outright — but not before giving it a real chance to appear: My reviews fetches its runs
  // asynchronously, so a target that is not in the DOM yet on this step's first check is very
  // often "still loading," not "genuinely absent." A `MutationObserver` waits for it, up to
  // `MISSING_TIMEOUT_MS`, before concluding it is really missing. Every `setState` call below
  // happens inside a callback (a microtask, the observer, the timeout) — never synchronously
  // in the effect body — the same shape RunReviewPage's own ResizeObserver effects use.
  useEffect(() => {
    if (!step) return
    let cancelled = false
    let settled = false
    let observer: MutationObserver | undefined
    let timeout: number | undefined

    const found = (element: HTMLElement) => {
      if (cancelled || settled) return
      settled = true
      observer?.disconnect()
      if (timeout != null) window.clearTimeout(timeout)
      const reduced = prefersReducedMotion()
      // An overview step looks at the whole page where it is; centring a page-tall element
      // would scroll the page away.
      if (!step.overview)
        element.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
      const box = element.getBoundingClientRect()
      const before = lastTarget.current
      if (before && !before.overview && !step.overview && !reduced) {
        setTrail({ key: step.id, ...arc(before.rect, box) })
        window.setTimeout(() => setTrail((t) => (t?.key === step.id ? null : t)), 2000)
      }
      lastTarget.current = { rect: box, overview: step.overview === true }
      setRect(box)
      setRectStepId(step.id)
    }

    const giveUp = () => {
      if (cancelled || settled) return
      settled = true
      observer?.disconnect()
      if (index < steps.length - 1) setIndex(index + 1)
      else setExhausted(true)
    }

    const existing = document.querySelector<HTMLElement>(step.selector)
    if (existing) {
      queueMicrotask(() => found(existing))
    } else {
      observer = new MutationObserver(() => {
        const element = document.querySelector<HTMLElement>(step.selector)
        if (element) found(element)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      timeout = window.setTimeout(giveUp, missingTimeoutMs)
    }

    const measure = () => {
      if (cancelled) return
      const element = document.querySelector<HTMLElement>(step.selector)
      if (element) {
        setRect(element.getBoundingClientRect())
        setRectStepId(step.id)
      }
    }
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      cancelled = true
      observer?.disconnect()
      if (timeout != null) window.clearTimeout(timeout)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [index, step, steps.length, missingTimeoutMs])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismissRef.current('escape')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A step's own spotlighted element is often a real link (the run row) — clicking it, as the
  // step itself invites, navigates away before the tour ever reaches its own last step. That
  // is the common way the tour ends, not an edge case to special-case around: `pagehide` fires
  // reliably just before any same-document unload, whichever step was open at the time.
  useEffect(() => {
    function onPageHide() {
      onDismissRef.current('navigated')
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  const activeRect = step && rectStepId === step.id ? rect : null

  // A fresh step: announce it by moving focus to its heading. Keyed to whether a rect exists, not
  // to the rect itself: every scroll tick produces a new DOMRect, and re-focusing the heading on
  // each would pull focus back from the buttons.
  const hasRect = activeRect != null
  useEffect(() => {
    if (hasRect || finishing) headingRef.current?.focus()
  }, [index, hasRect, finishing])

  if (!step || (!activeRect && !finishing)) return null

  const first = index === 0
  const last = index === steps.length - 1
  const total = totalSteps ?? steps.length
  const number = stepOffset + index + 1
  const vw = window.innerWidth
  const vh = window.innerHeight
  const overview = step.overview === true
  // The outline: round the target, or, on an overview, round what is on screen of the page.
  const box = activeRect ?? new DOMRect(0, 0, 0, 0)
  const spotTop = overview ? Math.max(box.top, 64) + PAD : box.top - PAD
  const spotBottom = overview ? Math.min(box.bottom, vh) - PAD : Math.min(box.bottom + PAD, vh - 4)
  const spot = {
    left: Math.max(box.left - PAD, 4),
    top: Math.max(spotTop, 4),
    width: Math.min(box.width + PAD * 2, vw - 8),
    height: Math.max(spotBottom - Math.max(spotTop, 4), 0),
  }
  // Where the bubble hangs from: the outline, or on an overview a point low in the middle.
  const anchor = overview
    ? { left: vw / 2, top: vh * 0.66, width: 0, height: 0 }
    : { left: spot.left, top: spot.top, width: spot.width, height: spot.height }
  const doneStops = finishing ? total : number - 1
  const fill = total > 1 ? (doneStops / (total - 1)) * 100 : 100

  function next() {
    step.onNext?.()
    if (last) {
      if (finish) setFinishing(true)
      else onDismiss('finished')
    } else setIndex((i) => i + 1)
  }

  const stops = (
    <div className="tour-stops" aria-hidden>
      <span className="tour-stops-fill" style={{ width: `${fill}%` }} />
      {Array.from({ length: total }, (_, j) => (
        <i
          key={j}
          className={cn(
            (finishing || j < number - 1) && 'is-done',
            !finishing && j === number - 1 && 'is-now',
          )}
        />
      ))}
    </div>
  )

  if (finishing && finish) {
    return (
      <div className="tour-finish-scrim">
        <div role="dialog" aria-labelledby="tour-finish-title" className="panel tour-finish">
          <div aria-hidden className="foil" />
          <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-6)] pt-[var(--space-5)] pb-[var(--space-6)]">
            <span className="lbl text-primary">{finish.label}</span>
            {stops}
            <h2
              ref={headingRef}
              id="tour-finish-title"
              tabIndex={-1}
              className="text-[28px] leading-tight font-bold font-heading outline-none"
            >
              {finish.title}
            </h2>
            <p className="text-lead text-text-secondary">{finish.body}</p>
            <div className="flex flex-wrap justify-end gap-[var(--space-3)] pt-[var(--space-3)]">
              <Button variant="outline" onClick={onReplay}>
                {finish.replayLabel}
              </Button>
              <Button onClick={() => onDismiss('finished')}>
                {finish.startLabel}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div aria-hidden className="tour-spot" style={spot} />
      {trail && (
        <>
          <svg aria-hidden className="tour-trail" width={vw} height={vh} key={trail.key}>
            <defs>
              <linearGradient id="tour-trail-fade" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" className="tour-trail-from" />
                <stop offset="1" className="tour-trail-to" />
              </linearGradient>
            </defs>
            <path d={trail.poly} fill="url(#tour-trail-fade)" />
          </svg>
          <div
            aria-hidden
            className="tour-fly"
            key={`fly-${trail.key}`}
            style={{ offsetPath: `path('${trail.d}')` }}
          />
        </>
      )}
      <Popover open onOpenChange={() => {}}>
        <PopoverAnchor asChild>
          <div aria-hidden className="pointer-events-none fixed" style={anchor} />
        </PopoverAnchor>
        <PopoverContent
          key={step.id}
          side={overview ? 'bottom' : (step.side ?? 'bottom')}
          align={overview ? 'center' : 'start'}
          sideOffset={overview ? 0 : PAD + 10}
          role="dialog"
          aria-labelledby={`tour-step-title-${step.id}`}
          aria-describedby={`tour-step-body-${step.id}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
          style={{ width: CARD_WIDTH }}
          className="max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        >
          <div aria-hidden className="foil" />
          <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--space-5)]">
            <span className="lbl text-primary" aria-live="polite">
              Step {number} of {total}
            </span>
            {stops}
            <h2
              ref={headingRef}
              id={`tour-step-title-${step.id}`}
              tabIndex={-1}
              className="text-section-heading leading-tight font-bold font-heading text-text-primary outline-none"
            >
              {step.title}
            </h2>
            <p id={`tour-step-body-${step.id}`} className="text-body text-text-secondary">
              {step.body}
            </p>
            <div
              className="flex items-center justify-between gap-[var(--space-2)] pt-[var(--space-2)]"
              onKeyDown={trapTab}
            >
              <Button variant="outline" size="sm" onClick={() => onDismiss('skip')}>
                Skip tour
              </Button>
              <div className="flex items-center gap-[var(--space-2)]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={first}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  Back
                </Button>
                <Button size="sm" onClick={next}>
                  {step.nextLabel ?? (last && !finish ? 'Done' : last ? 'Finish' : 'Next')}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
