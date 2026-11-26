import { Clock } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatRunStatusLabel } from '../../lib/format'
import { testsPassing } from '../../lib/timeline'
import { describeDecision, describePendingRun } from '../../lib/story'
import type { Run, RunStatus } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'

/**
 * The card at the top of the middle column (docs/DECISIONS.md, 0046): status, the initiative,
 * why the agent was asked, and where the run is now. The labelled facts — target, revision,
 * run reference, requester, agent, time, checks, lowest score — live in `RunDetails`, the
 * left-hand column; what is open, or the undo window, heads the right-hand column.
 */
export interface RunOverviewProps {
  run: Run
}

/** Colour of the clock in a plain status line. `approved` and `changes_requested` use
 * `StatusBadge` instead (docs/DECISIONS.md, 0029). */
const STATUS_ICON: Partial<Record<RunStatus, string>> = {
  running: 'text-status-not-applicable',
  checks_running: 'text-status-not-applicable',
  blocked: 'text-status-fail',
  awaiting_review: 'text-status-waived',
  rejected: 'text-status-fail',
}

function StatusPill({ status }: { status: RunStatus }) {
  if (status === 'approved')
    return <StatusBadge tone="success" label={formatRunStatusLabel(status)} />
  if (status === 'changes_requested')
    return <StatusBadge tone="warning" label={formatRunStatusLabel(status)} />
  return (
    <span className="inline-flex items-center gap-[var(--space-2)] text-body font-medium text-text-primary">
      <Clock aria-hidden className={cn('h-4 w-4', STATUS_ICON[status])} />
      {formatRunStatusLabel(status)}
    </span>
  )
}

/** One of the numbers under "What the agent did": a big figure and what it counts. */
function Figure({ n, label, tone }: { n: number | string; label: string; tone?: string }) {
  return (
    <li className="flex items-baseline gap-[var(--space-2)] text-meta text-text-secondary">
      <span
        className={cn('text-section-heading leading-none font-heading text-text-primary', tone)}
      >
        {n}
      </span>
      {label}
    </li>
  )
}

export function RunOverview({ run }: RunOverviewProps) {
  const files = run.timeline.filter((event) => event.type === 'file_change').length
  const tests = testsPassing(run.timeline)
  const passed = run.gates.filter((gate) => gate.result === 'pass').length
  const failed = run.gates.filter((gate) => gate.result === 'fail').length
  const lookAt = run.gates.filter((gate) => gate.result === 'unknown').length
  return (
    <header className="panel overflow-hidden">
      <div aria-hidden className="foil" />
      <div className="flex flex-col gap-[var(--space-4)] p-[var(--space-5)]">
        <div className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
          <StatusPill status={run.status} />
          <span className="lbl text-primary">{run.target.environment}</span>
        </div>
        <h1
          id="run-heading"
          className="text-run-title leading-tight font-semibold font-heading text-pretty text-text-primary"
        >
          {run.initiative}
        </h1>

        {run.assignment && (
          <p className="text-body leading-relaxed font-normal font-body text-text-primary">
            <span className="sr-only">Why the agent was asked: </span>
            {run.assignment.context} <ActorName name={run.assignment.by} className="align-middle" />{' '}
            gave the change to the agent because {run.assignment.reason}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-[var(--space-3)] border-t border-border-subtle p-[var(--space-5)]">
        <h2 className="lbl">What the agent did</h2>
        <p className="text-body leading-relaxed font-normal font-body text-text-primary">
          {run.decision ? (
            <>
              <ActorName name={run.decision.by} className="align-middle text-text-primary" />{' '}
              {describeDecision(run)}
            </>
          ) : (
            describePendingRun(run)
          )}
        </p>
        <ul className="flex flex-wrap gap-x-[var(--space-6)] gap-y-[var(--space-2)] pt-[var(--space-2)]">
          <Figure n={files} label="files changed" />
          {tests != null && <Figure n={tests} label="tests passing" />}
          <Figure n={passed} label="checks passed" tone="text-status-pass" />
          {failed > 0 && <Figure n={failed} label="failed" tone="text-status-fail" />}
          {lookAt > 0 && <Figure n={lookAt} label="need a look" tone="text-status-waived" />}
        </ul>
      </div>
    </header>
  )
}
