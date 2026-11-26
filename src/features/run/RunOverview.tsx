import { Activity, Clock, Info } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatRunStatusLabel } from '../../lib/format'
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

const EYEBROW =
  'flex items-center gap-[var(--space-2)] text-meta font-semibold font-heading leading-none tracking-wide uppercase text-text-primary'

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

export function RunOverview({ run }: RunOverviewProps) {
  return (
    <header className="panel overflow-hidden">
      <div aria-hidden className="foil" />
      <div className="flex flex-col gap-[var(--space-5)] p-[var(--space-5)]">
        <div className="self-start">
          <StatusPill status={run.status} />
        </div>
        <h1
          id="run-heading"
          className="text-run-title leading-tight font-semibold font-heading text-pretty text-text-primary"
        >
          {run.initiative}
        </h1>

        {run.assignment && (
          <div className="flex flex-col gap-[var(--space-2)]">
            <span className={EYEBROW}>
              <Info aria-hidden className="h-4 w-4" />
              Why the agent was asked
            </span>
            <p className="text-body font-normal font-body leading-relaxed text-text-primary md:text-item-title">
              {run.assignment.context}{' '}
              <ActorName name={run.assignment.by} className="align-middle" /> gave the change to the
              agent because {run.assignment.reason}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-[var(--space-2)] pt-[var(--space-5)]">
          <span className={EYEBROW}>
            <Activity aria-hidden className="h-4 w-4" />
            Where the run is now
          </span>
          <p className="text-body font-normal font-body leading-relaxed text-text-secondary md:text-item-title">
            {run.decision ? (
              <>
                <ActorName name={run.decision.by} className="align-middle text-text-primary" />{' '}
                {describeDecision(run)}
              </>
            ) : (
              describePendingRun(run)
            )}
          </p>
        </div>
      </div>
    </header>
  )
}
