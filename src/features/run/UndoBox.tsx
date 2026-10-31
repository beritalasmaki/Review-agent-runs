import { Button } from '../../components/ui/button'
import { Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { undoDecision, type SubmitDecisionOptions } from '../../lib/api'
import { undoWindow } from '../../lib/decision'
import { formatDecisionOutcomeLabel, formatDuration } from '../../lib/format'
import type { Run } from '../../lib/types'

/**
 * The undo window after a decision, in the header where it can't be missed: a large countdown
 * and one filled button, kept apart from every other action (docs/DECISIONS.md, 0033 and 0039).
 * Undo goes through the api (`undoDecision`), like the decision did, so the run is awaiting
 * review there too and a new decision on it is recorded, not refused as a conflict with the
 * undone one (0064).
 *
 * The box opens with the decision itself: "Approved" beside a check. When the decision has
 * just been made on this page (`celebrate`), the check plays transitions.dev's "Success check"
 * (fade, rotate, blur and bob, with the tick drawing itself — src/styles/transitions.css,
 * docs/DECISIONS.md 0047), and focus moves to this heading. The Approve button the reviewer
 * pressed no longer exists, so focus would otherwise fall back to the top of the page.
 */
export interface UndoBoxProps {
  run: Run
  onRunUpdated: (updatedRun: Run) => void
  /** Mainly for stories and tests: the clock the countdown reads. */
  now?: Date
  /** The decision was just made on this page: play the check's appear and take focus. */
  celebrate?: boolean
  /** Mainly for stories and tests: passed to `undoDecision`. */
  undoOptions?: SubmitDecisionOptions
}

function SuccessCheck({ animate }: { animate: boolean }) {
  return (
    <span className="t-success-check" data-state={animate ? 'in' : 'static'} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-status-pass-tint-fg">
        <circle cx="12" cy="12" r="11" className="fill-status-pass-tint-bg" />
        <path
          d="M7 12.5l3.2 3.2L17 9"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function UndoBox({
  run,
  onRunUpdated,
  now: fixedNow,
  celebrate = false,
  undoOptions,
}: UndoBoxProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [undoing, setUndoing] = useState(false)
  const [undoError, setUndoError] = useState<string | null>(null)
  const [tickNow, setTickNow] = useState(() => new Date())
  const now = fixedNow ?? tickNow
  const decision = run.decision
  const undo = decision ? undoWindow(decision, now) : { active: false, remainingMs: 0 }

  useEffect(() => {
    if (fixedNow || !undo.active) return
    const interval = setInterval(() => setTickNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [fixedNow, undo.active])

  useEffect(() => {
    if (!celebrate) return
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'nearest' })
  }, [celebrate])

  if (!decision) return null
  const approved = decision.outcome === 'approved'

  async function takeBack() {
    setUndoing(true)
    setUndoError(null)
    try {
      onRunUpdated(await undoDecision(run.id, undoOptions))
    } catch (error) {
      setUndoing(false)
      setUndoError(error instanceof Error ? error.message : 'Could not undo the decision.')
    }
  }

  return (
    <div className="dither-edge dither-edge--undo-box -m-[16px] flex w-full flex-col gap-[var(--space-3)] p-[16px]">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="flex scroll-mt-[calc(var(--run-bar-height,4rem)+var(--space-4))] items-center gap-[var(--space-2)] text-section-heading leading-none font-semibold font-heading text-text-primary"
      >
        {approved && <SuccessCheck animate={celebrate} />}
        <span
          className="t-success-check-label"
          data-state={celebrate ? 'in' : 'static'}
          style={celebrate ? { animationDelay: 'var(--check-path-delay)' } : undefined}
        >
          {formatDecisionOutcomeLabel(decision.outcome)}
        </span>
      </h2>
      {undo.active ? (
        <>
          <span className="text-meta font-semibold font-heading text-text-primary">
            Undo window open
          </span>
          <span
            className="text-score font-semibold font-heading leading-none text-text-primary tabular-nums"
            role="timer"
            aria-label={`${formatDuration(undo.remainingMs)} left to undo`}
          >
            {formatDuration(undo.remainingMs)}
          </span>
          <Button
            onClick={() => void takeBack()}
            disabled={undoing}
            // Busy, not unavailable: it keeps its colour, dimmed, while the undo runs.
            className="disabled:cursor-wait disabled:border-text-primary disabled:bg-text-primary disabled:text-surface disabled:opacity-70"
          >
            <Undo2 aria-hidden className="h-4 w-4" />
            {undoing ? 'Undoing…' : 'Undo this decision'}
          </Button>
          {undoError && (
            <span
              role="alert"
              className="text-caption font-normal font-body leading-relaxed text-status-fail-tint-fg"
            >
              Could not undo. {undoError}
            </span>
          )}
          <span className="text-caption font-normal font-body leading-relaxed text-text-secondary">
            {decision.outcome === 'approved'
              ? 'After that, the release can only be reversed by a new run.'
              : 'After that, the decision is final.'}
          </span>
        </>
      ) : (
        <>
          <span className="text-meta font-semibold font-heading text-text-primary">
            Undo window closed
          </span>
          <span className="text-caption font-normal font-body leading-relaxed text-text-secondary">
            {decision.outcome === 'approved'
              ? 'The release can only be reversed by a new run.'
              : 'This decision is final.'}
          </span>
        </>
      )}
    </div>
  )
}
