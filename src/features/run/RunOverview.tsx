import { Activity, Info } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
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

/** Colour of the small dot in a neutral status pill. `approved` and `changes_requested` use
 * `StatusBadge` instead (docs/DECISIONS.md, 0029). */
const STATUS_DOT: Partial<Record<RunStatus, string>> = {
  running: 'bg-status-not-applicable',
  checks_running: 'bg-status-not-applicable',
  blocked: 'bg-status-fail',
  awaiting_review: 'bg-status-waived',
  rejected: 'bg-status-fail',
}

const EYEBROW =
  'flex items-center gap-[var(--space-2)] text-meta font-semibold font-heading leading-none tracking-wide uppercase text-text-primary'

function StatusPill({ status }: { status: RunStatus }) {
  if (status === 'approved')
    return <StatusBadge tone="success" label={formatRunStatusLabel(status)} />
  if (status === 'changes_requested')
    return <StatusBadge tone="warning" label={formatRunStatusLabel(status)} />
  return (
    <Badge>
      <span aria-hidden className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} />
      {formatRunStatusLabel(status)}
    </Badge>
  )
}

export function RunOverview({ run }: RunOverviewProps) {
  return (
    <header className="dither-edge dither-edge--run-overview -m-[16px] flex flex-col gap-[var(--space-5)] p-[16px]">
      <div className="self-start">
        <StatusPill status={run.status} />
      </div>
      <h1
        id="run-heading"
        className="text-page-title leading-tight font-bold font-heading text-pretty text-text-primary"
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
            {run.assignment.context} <ActorName name={run.assignment.by} className="align-middle" />{' '}
            gave the change to the agent because {run.assignment.reason}
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
    </header>
  )
}
