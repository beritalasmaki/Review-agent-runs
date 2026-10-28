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
import { RotateCw } from 'lucide-react'
import type { ArchiveSortKey, ManualArchive, SortDirection } from '../../lib/reviews'
import { ARCHIVE_AFTER_MONTHS, archiveState, reviewStatus } from '../../lib/reviews'
import { formatCalendarDate } from '../../lib/format'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { ReviewStatusPill, RunCell } from './ReviewParts'
import { CELL, ColumnHeader, DateCell, DetailsButton } from './ReviewsTable'

/**
 * Archived runs (docs/DECISIONS.md, 0060, 0085): approved and declined runs, moved here by the
 * reviewer or by the six-month rule. The record itself never changes; a new run is the way to
 * fix a mistake. No restore and no selection here (0085) — the archive is read-only, except for
 * asking for a new run.
 */
export interface ArchiveTableProps {
  runs: Run[]
  caption: string
  runHref: (id: string) => string
  sort: { key: ArchiveSortKey; dir: SortDirection }
  onSort: (key: ArchiveSortKey, dir: SortDirection) => void
  manual: ManualArchive
  now: Date
  requestedRuns: ReadonlySet<string>
  onDetails: (id: string) => void
  onNewRun: (id: string) => void
}

export function ArchiveTable({
  runs,
  caption,
  runHref,
  sort,
  onSort,
  manual,
  now,
  requestedRuns,
  onDetails,
  onNewRun,
}: ArchiveTableProps) {
  const header = { current: sort, onSort }
  return (
    <Table containerClassName="scrollbar-none" className="min-w-[75rem]">
      <TableCaption className="sr-only">{caption}</TableCaption>
      <colgroup>
        <col className="w-12" />
        <col />
        <col className="w-44" />
        <col className="w-48" />
        <col className="w-28" />
        <col className="w-48" />
        <col className="w-28" />
      </colgroup>
      <TableHeader className="bg-surface-raised">
        <TableRow>
          <ColumnHeader label="Details" />
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
            info="Ask for a new run to fix a mistake. The old run is not changed."
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
              className="bg-surface transition-colors duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-border-subtle"
            >
              <TableCell className={CELL}>
                <DetailsButton run={run} onClick={() => onDetails(run.id)} />
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
                    className="btn-glass glass-sheen h-8 hover:border-primary hover:bg-surface hover:text-primary"
                  >
                    <RotateCw aria-hidden className="h-3.5 w-3.5" />
                    New run
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
