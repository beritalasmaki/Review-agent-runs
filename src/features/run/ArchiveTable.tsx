import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Lock, RotateCcw, RotateCw } from 'lucide-react'
import type { ArchiveSortKey, ManualArchive, SortDirection } from '../../lib/reviews'
import { ARCHIVE_AFTER_MONTHS, RESTORE_DAYS, archiveState, reviewStatus } from '../../lib/reviews'
import { formatCalendarDate } from '../../lib/format'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { ReviewStatusPill, RunCell } from './ReviewParts'
import { CELL, ColumnHeader, DateCell, DetailsButton, SelectBox } from './ReviewsTable'

/**
 * Archived runs (docs/DECISIONS.md, 0060): approved and declined runs, moved here by the
 * reviewer or by the six-month rule. A run can be restored for seven days; after that it is
 * locked, and a new run is the way to fix a mistake. The record itself never changes.
 */
export interface ArchiveTableProps {
  runs: Run[]
  caption: string
  runHref: (id: string) => string
  sort: { key: ArchiveSortKey; dir: SortDirection }
  onSort: (key: ArchiveSortKey, dir: SortDirection) => void
  /** Tick boxes only where a report can be made — the archive page itself. */
  selectable: boolean
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  manual: ManualArchive
  now: Date
  requestedRuns: ReadonlySet<string>
  onDetails: (id: string) => void
  onNewRun: (id: string) => void
  onRestore: (id: string) => void
}

export function ArchiveTable({
  runs,
  caption,
  runHref,
  sort,
  onSort,
  selectable,
  selected,
  onToggle,
  manual,
  now,
  requestedRuns,
  onDetails,
  onNewRun,
  onRestore,
}: ArchiveTableProps) {
  const header = { current: sort, onSort }
  return (
    <Table containerClassName="scrollbar-none" className="min-w-[75rem]">
      <TableCaption className="sr-only">{caption}</TableCaption>
      <colgroup>
        <col className="w-12" />
        <col className="w-9" />
        <col />
        <col className="w-44" />
        <col className="w-48" />
        <col className="w-28" />
        <col className="w-48" />
        <col className="w-44" />
      </colgroup>
      <TableHeader className="border-b border-border-subtle bg-surface-raised">
        <TableRow>
          <ColumnHeader label="Details" />
          <ColumnHeader label="Select" hiddenLabel="Select" />
          <ColumnHeader
            label="Run"
            sort={{ key: 'run', first: 'asc', firstText: 'A to Z', otherText: 'Z to A' }}
            {...header}
          />
          <ColumnHeader
            label="Run type"
            info="Only approved and declined runs can be in the archive."
            sort={{
              key: 'type',
              first: 'asc',
              firstText: 'Declined first',
              otherText: 'Approved first',
            }}
            {...header}
          />
          <ColumnHeader
            label="Requested by"
            info="The person who asked the agent to make this change."
            sort={{ key: 'requester', first: 'asc', firstText: 'A to Z', otherText: 'Z to A' }}
            {...header}
          />
          <ColumnHeader
            label="Decided"
            info="The day the run was approved or declined."
            sort={{
              key: 'decided',
              first: 'desc',
              firstText: 'Newest first',
              otherText: 'Oldest first',
            }}
            {...header}
          />
          <ColumnHeader
            label="Archived"
            info="When the run moved to the archive, and whether you did it or it happened automatically."
            align="end"
            sort={{
              key: 'archived',
              first: 'desc',
              firstText: 'Newest first',
              otherText: 'Oldest first',
            }}
            {...header}
          />
          <ColumnHeader
            label="Action"
            info={`New run: ask for a new run to fix a mistake. The old run is not changed. Restore brings a run back to My reviews, but only in the first ${RESTORE_DAYS} days after it was archived.`}
            align="end"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => {
          const state = archiveState(run, manual, now)
          const sent = requestedRuns.has(run.id)
          return (
            <TableRow
              key={run.id}
              className="border-b border-border-subtle bg-surface hover:bg-border-subtle"
            >
              <TableCell className={CELL}>
                <DetailsButton run={run} onClick={() => onDetails(run.id)} />
              </TableCell>
              <TableCell className={CELL}>
                {selectable && (
                  <SelectBox
                    run={run}
                    checked={selected.has(run.id)}
                    onToggle={() => onToggle(run.id)}
                  />
                )}
              </TableCell>
              <TableCell className={cn(CELL, 'max-w-0')}>
                <RunCell run={run} href={runHref(run.id)} />
              </TableCell>
              <TableCell className={CELL}>
                <ReviewStatusPill status={reviewStatus(run)} />
              </TableCell>
              <TableCell className={CELL}>
                <ActorName
                  name={run.requestedBy}
                  className="text-meta font-medium whitespace-nowrap"
                />
              </TableCell>
              <TableCell
                className={cn(CELL, 'text-meta font-medium whitespace-nowrap text-text-primary')}
              >
                {run.decision ? formatCalendarDate(run.decision.at) : ''}
              </TableCell>
              <TableCell className={CELL}>
                <DateCell
                  date={state.archivedAt ? formatCalendarDate(state.archivedAt) : ''}
                  sub={
                    state.by === 'you'
                      ? 'By you'
                      : `Automatically, after ${ARCHIVE_AFTER_MONTHS} months`
                  }
                />
              </TableCell>
              <TableCell className={cn(CELL, 'text-right')}>
                <span className="inline-flex items-center gap-[var(--space-2)]">
                  {sent ? (
                    <Badge
                      variant="primary-tint"
                      size="sm"
                      title={`Waiting for ${run.requestedBy} to answer`}
                      className="px-[var(--space-3)] py-[var(--space-2)] leading-none"
                    >
                      Request sent
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNewRun(run.id)}
                      aria-label={`Request a new run: ${run.initiative}`}
                      className="h-8 hover:border-primary hover:bg-surface hover:text-primary"
                    >
                      <RotateCw aria-hidden className="h-3.5 w-3.5" />
                      New run
                    </Button>
                  )}
                  {state.canRestore ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRestore(run.id)}
                      aria-label={`Restore “${run.initiative}” to My reviews`}
                      title={`Restore to My reviews. Possible for ${state.restoreDaysLeft} more day${state.restoreDaysLeft === 1 ? '' : 's'}.`}
                    >
                      <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <span
                      role="img"
                      aria-label="Restore locked"
                      title={`Locked. A run can only be restored in the first ${RESTORE_DAYS} days after it is archived.`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface-raised text-text-secondary"
                    >
                      <Lock aria-hidden className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
