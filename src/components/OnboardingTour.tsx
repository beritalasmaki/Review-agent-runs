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
 * The cutout is four fixed rectangles around the target, not a single masked overlay: nothing
 * ever covers the spotlighted element, so it stays genuinely clickable and focusable by mouse
 * while its step is open — the point of a step like "click this row to open it."
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
}

/** Gap, in pixels, between the highlight ring and the target's own edge — a real-time layout
 * measurement, not a design-token spacing value, so it is a literal number like the welcome
 * intro's own runtime-measured `style` props. */
const RING_PAD = 6

const DEFAULT_MISSING_TIMEOUT_MS = 3000

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
}: OnboardingTourProps) {
  const [index, setIndex] = useState(0)
  const [exhausted, setExhausted] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  // Which step `rect` was measured for — a stale rect from the step just left must never
  // render under the new step's title while the new one is still being found, or the cutout
  // would visibly lag a step behind the text for a moment.
  const [rectStepId, setRectStepId] = useState<string | null>(null)
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
      element.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
      setRect(element.getBoundingClientRect())
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

  // A fresh step: announce it by moving focus to its heading, the same way MyReviews moves
  // focus to a view's heading when it changes.
  useEffect(() => {
    if (activeRect) headingRef.current?.focus()
  }, [index, activeRect])

  if (!step || !activeRect) return null

  const first = index === 0
  const last = index === steps.length - 1
  const vw = window.innerWidth
  const vh = window.innerHeight
  const top = Math.max(activeRect.top - RING_PAD, 0)
  const left = Math.max(activeRect.left - RING_PAD, 0)
  const right = Math.min(activeRect.right + RING_PAD, vw)
  const bottom = Math.min(activeRect.bottom + RING_PAD, vh)
  const fade = 'transition-all duration-300 motion-reduce:transition-none'

  function next() {
    if (last) onDismiss('finished')
    else setIndex((i) => i + 1)
  }

  return (
    <>
      <div
        aria-hidden
        className={cn('fixed inset-0 z-50 bg-modal-scrim', fade)}
        style={{ top: 0, left: 0, right: 0, height: top }}
      />
      <div
        aria-hidden
        className={cn('fixed z-50 bg-modal-scrim', fade)}
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
      />
      <div
        aria-hidden
        className={cn('fixed z-50 bg-modal-scrim', fade)}
        style={{ top, left: 0, width: left, height: bottom - top }}
      />
      <div
        aria-hidden
        className={cn('fixed z-50 bg-modal-scrim', fade)}
        style={{ top, left: right, right: 0, height: bottom - top }}
      />
      <div
        aria-hidden
        className={cn('pointer-events-none fixed z-50 rounded-lg border-2 border-primary', fade)}
        style={{ top, left, width: right - left, height: bottom - top }}
      />
      <Popover open onOpenChange={() => {}}>
        <PopoverAnchor asChild>
          <div
            aria-hidden
            className="pointer-events-none fixed"
            style={{ top, left, width: right - left, height: bottom - top }}
          />
        </PopoverAnchor>
        <PopoverContent
          key={step.id}
          side={step.side ?? 'bottom'}
          role="dialog"
          aria-labelledby={`tour-step-title-${step.id}`}
          aria-describedby={`tour-step-body-${step.id}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="flex flex-col gap-[var(--space-3)]"
        >
          <span className="text-caption font-semibold font-heading text-text-secondary">
            Step {index + 1} of {steps.length}
          </span>
          <h2
            ref={headingRef}
            id={`tour-step-title-${step.id}`}
            tabIndex={-1}
            className="text-item-title leading-tight font-semibold font-heading text-text-primary outline-none"
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
            <div className="flex items-center gap-[var(--space-2)]">
              {!first && (
                <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                  Back
                </Button>
              )}
              <Button variant="link" size="inline" onClick={() => onDismiss('skip')}>
                Skip tour
              </Button>
            </div>
            <Button size="sm" onClick={next}>
              {last ? 'Done' : 'Next'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
