import { Button } from '../../components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { explanationFor } from '../../lib/gates'
import type { PolicyGate, TimelineEvent } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { checkCardId, LINK_TARGET } from './openItemTargets'

/**
 * A policy check that needs the reviewer's attention, shown in the story where it happened: a
 * check that failed or did not run, or one with an exception. It says what happened, the rule
 * in plain words, and — before a decision — gives a way forward ("Run check again") instead of
 * a dead end (docs/DECISIONS.md, 0038).
 *
 * "Run check again" is local only, like Undo (docs/DECISIONS.md, 0017): there is no backend to
 * start a scanner on, so the card records that it was asked for and nothing else happens. It
 * does not change the gate's result — only a real new evaluation could.
 */
export interface CheckCardProps {
  gate: PolicyGate
  timeline: TimelineEvent[]
  /** Before a decision: show "Run check again" and how to approve without the check. */
  actionable?: boolean
}

const TONE = {
  unknown: 'border-l-status-waived bg-status-waived-tint-bg',
  fail: 'border-l-status-fail bg-status-fail-tint-bg',
  waived: 'border-l-status-waived bg-surface-raised',
} as const

const HEADLINE = {
  unknown: 'did not run',
  fail: 'failed',
  waived: 'has an exception',
} as const

export function CheckCard({ gate, timeline, actionable = false }: CheckCardProps) {
  const [queued, setQueued] = useState(false)
  if (gate.result !== 'unknown' && gate.result !== 'fail' && gate.result !== 'waived') return null

  const result = gate.result
  const explanation = explanationFor(gate, timeline)

  return (
    <div
      id={checkCardId(gate.id)}
      tabIndex={-1}
      className={cn(
        'max-w-[45rem] rounded-md border-l-[3px] px-[var(--space-4)] py-[var(--space-3)]',
        LINK_TARGET,
        TONE[result],
      )}
    >
      <p className="text-body font-normal font-body leading-relaxed text-text-primary">
        <span className="font-semibold">
          {gate.name} — {HEADLINE[result]}.
        </span>{' '}
        {explanation && `${explanation} `}
        <span className="text-text-secondary">The rule: {gate.plainLanguage}</span>
      </p>

      {result === 'waived' && gate.waiver && (
        <p className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)] text-body font-normal font-body text-text-primary">
          Exception by <ActorName name={gate.waiver.by} className="bg-surface" />
          <span className="text-text-secondary">“{gate.waiver.reason}”</span>
        </p>
      )}

      {actionable && result !== 'waived' && (
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-4)] border-t border-status-waived/40 pt-[var(--space-3)]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQueued(true)}
            disabled={queued}
            className={cn(
              'border-status-waived px-[var(--space-4)] hover:border-status-waived hover:bg-status-waived-tint-bg active:bg-status-waived-tint-bg',
              'disabled:cursor-default disabled:border-status-waived disabled:bg-surface disabled:text-text-primary disabled:opacity-70',
            )}
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            {queued ? 'Check asked for' : 'Run check again'}
          </Button>
          <span
            className="text-caption font-normal font-body text-text-secondary"
            aria-live="polite"
          >
            {queued
              ? 'The result appears here when the check has run. Until then it stays “Not run”.'
              : 'Or tick it in “Confirm each open item” to approve without it.'}
          </span>
        </div>
      )}
    </div>
  )
}
