import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Archive,
  FileText,
  RotateCw,
} from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { InfoTip } from '../../components/InfoTip'
import { formatCalendarDate, formatRelativeTime } from '../../lib/format'
import type { ManualArchive, SortDirection, SortKey } from '../../lib/reviews'
import {
  archiveState,
  formatArchivesIn,
  isFinished,
  openItemCount,
  reviewStage,
  reviewStatus,
  updatedAt,
} from '../../lib/reviews'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { ReviewStatusPill, RunCell } from './ReviewParts'

/**
 * The My reviews table (docs/DECISIONS.md, 0060): one row per run, with its type, where it
 * is now, its open items, who asked, when it last changed, and what the reviewer can do.
 * A real `<Table>`: column headers are announced with every cell, and the sorted column says
 * so through `aria-sort`.
 */

export interface SortSpec<K extends string> {
  key: K
  /** The direction a first click sorts in, and what each direction is called. */
  first: SortDirection
  firstText: string
  otherText: string
}

export interface ColumnHeaderProps<K extends string> {
  label: string
  /** Shown only to screen readers when the column has no visible label. */
  hiddenLabel?: string
  info?: string
  sort?: SortSpec<K>
  current?: { key: K; dir: SortDirection }
  onSort?: (key: K, dir: SortDirection) => void
  align?: 'start' | 'end'
  /** Which way the info tip opens; defaults to `align`. A column near the right edge opens
   * it leftwards, or it runs past the table and makes it scrollable. */
  tipAlign?: 'start' | 'end'
  className?: string
}

export function ColumnHeader<K extends string>({
  label,
  hiddenLabel,
  info,
  sort,
  current,
  onSort,
  align = 'start',
  tipAlign = align,
  className,
}: ColumnHeaderProps<K>) {
  const active = sort && current?.key === sort.key
  const dir = active ? current.dir : undefined
  const next: SortDirection | undefined = sort
    ? active
      ? dir === 'asc'
        ? 'desc'
        : 'asc'
      : sort.first
    : undefined
  const nextText = sort ? (next === sort.first ? sort.firstText : sort.otherText) : ''
  const SortIcon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <TableHead
      scope="col"
      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
      className={cn(
        'px-[var(--space-2)] py-[var(--space-3)] text-left align-middle font-normal first:pl-[var(--space-5)] last:pr-[var(--space-5)]',
        className,
      )}
    >
      {hiddenLabel ? (
        <span className="sr-only">{hiddenLabel}</span>
      ) : (
        <span
          className={cn('flex items-center gap-[var(--space-2)]', align === 'end' && 'justify-end')}
        >
          <span className="text-caption leading-snug font-semibold font-heading whitespace-nowrap text-text-secondary">
            {label}
          </span>
          {info && (
            <InfoTip label={label} align={tipAlign}>
              {info}
            </InfoTip>
          )}
          {sort && next && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSort?.(sort.key, next)}
              aria-label={`Order by ${label.toLowerCase()}: ${nextText}`}
              title={`Order by ${label.toLowerCase()}: ${nextText}`}
              className={cn(
                'h-5 w-5 rounded-sm hover:bg-border-subtle hover:text-text-primary focus-visible:outline-offset-1',
                active ? 'bg-primary-tint text-primary' : 'text-text-secondary',
              )}
            >
              <SortIcon aria-hidden className="h-3 w-3" strokeWidth={2.5} />
            </Button>
          )}
        </span>
      )}
    </TableHead>
  )
}

export const CELL =
  'px-[var(--space-2)] py-[var(--space-3)] align-middle first:pl-[var(--space-5)] last:pr-[var(--space-5)]'

/** The row's "decision details" button: first in the row, before the tick box. */
export function DetailsButton({ run, onClick }: { run: Run; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`Decision details: ${run.initiative}`}
      title="Show decision details"
      className="h-7 w-7 border-border-subtle text-text-secondary hover:bg-primary-tint"
    >
      <FileText aria-hidden className="h-3.5 w-3.5" />
    </Button>
  )
}

export function SelectBox({
  run,
  checked,
  disabled,
  disabledReason,
  onToggle,
}: {
  run: Run
  checked: boolean
  disabled?: boolean
  disabledReason?: string
  onToggle: () => void
}) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={onToggle}
      aria-label={`Select “${run.initiative}”`}
      title={disabled ? disabledReason : 'Select for a report or to archive'}
    />
  )
}

/** "3", "2 accepted", "None", "Not known yet" — what the Open items column says. */
function OpenItemsCell({ run }: { run: Run }) {
  const count = openItemCount(run)
  const status = reviewStatus(run)
  const chip = 'px-[var(--space-3)] py-[var(--space-1)]'
  const muted = 'text-meta whitespace-nowrap text-text-secondary'
  if (count === null) return <span className={muted}>Not known yet</span>
  if (count === 0) return <span className={muted}>None</span>
  if (status === 'approved' || status === 'declined') {
    return (
      <Badge variant="muted" size="sm" className={chip}>
        {status === 'approved' ? `${count} accepted` : count}
      </Badge>
    )
  }
  return (
    <Badge variant="warning" size="sm" className={chip}>
      {count}
    </Badge>
  )
}

export function DateCell({ date, sub }: { date: string; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)] whitespace-nowrap">
      <span className="text-meta font-medium text-text-primary">{date}</span>
      <span className="text-caption text-text-secondary">{sub}</span>
    </div>
  )
}

export interface ReviewsTableProps {
  runs: Run[]
  caption: string
  runHref: (id: string) => string
  sort: { key: SortKey; dir: SortDirection }
  onSort: (key: SortKey, dir: SortDirection) => void
  /** Tick boxes only where they can do something — not on Pending, where nothing is ever
   * finished yet to select. */
  selectable: boolean
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  manual: ManualArchive
  now: Date
  onDetails: (id: string) => void
  onNewRun: (id: string) => void
  onArchive: (id: string) => void
  ref?: Ref<HTMLTableElement>
}

const INFO = {
  status: 'Where the run stands overall: Pending, Requested for change, Declined or Approved.',
  open: 'Things the run could not finish or check. You must look at each one before you approve.',
  requester: 'The person who asked the agent to make this change.',
  updated:
    'The last time something happened in this run. Finished runs also show when they will be archived.',
  action: 'What you can do now: review a pending run, or archive a finished one.',
}

export function ReviewsTable({
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
  onDetails,
  onNewRun,
  onArchive,
  ref,
}: ReviewsTableProps) {
  const header = { current: sort, onSort }
  return (
    <Table
      ref={ref}
      tabIndex={-1}
      containerClassName="scrollbar-none"
      className="min-w-[75rem] outline-none"
    >
      <TableCaption className="sr-only">{caption}</TableCaption>
      <colgroup>
        <col className="w-12" />
        <col className="w-9" />
        <col />
        <col className="w-44" />
        <col className="w-28" />
        <col className="w-48" />
        <col className="w-36" />
        <col className="w-28" />
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
            label="Status"
            info={INFO.status}
            sort={{
              key: 'type',
              first: 'asc',
              firstText: 'Pending first',
              otherText: 'Approved first',
            }}
            {...header}
          />
          <ColumnHeader
            label="Open items"
            info={INFO.open}
            sort={{
              key: 'open',
              first: 'desc',
              firstText: 'Most first',
              otherText: 'Fewest first',
            }}
            {...header}
          />
          <ColumnHeader
            label="Requested by"
            info={INFO.requester}
            sort={{ key: 'requester', first: 'asc', firstText: 'A to Z', otherText: 'Z to A' }}
            {...header}
          />
          <ColumnHeader
            label="Updated"
            info={INFO.updated}
            tipAlign="end"
            sort={{
              key: 'updated',
              first: 'desc',
              firstText: 'Newest first',
              otherText: 'Oldest first',
            }}
            {...header}
          />
          <ColumnHeader label="Action" info={INFO.action} align="end" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run, index) => {
          const finished = isFinished(run)
          const archive = archiveState(run, manual, now)
          const updated = updatedAt(run)
          return (
            <TableRow
              key={run.id}
              data-tour={index === 0 ? 'first-run-row' : undefined}
              className="border-b border-border-subtle bg-surface transition-colors duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:bg-border-subtle"
            >
              <TableCell className={CELL}>
                <DetailsButton run={run} onClick={() => onDetails(run.id)} />
              </TableCell>
              <TableCell className={CELL}>
                {selectable && (
                  <SelectBox
                    run={run}
                    checked={selected.has(run.id)}
                    disabled={!finished}
                    disabledReason="Only approved and declined runs can be selected"
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
                <OpenItemsCell run={run} />
              </TableCell>
              <TableCell className={CELL}>
                <ActorName
                  name={run.requestedBy}
                  className="text-meta font-medium whitespace-nowrap"
                />
              </TableCell>
              <TableCell className={CELL}>
                <DateCell
                  date={formatCalendarDate(updated)}
                  sub={
                    archive.autoAt
                      ? formatArchivesIn(archive.autoAt, now)
                      : formatRelativeTime(updated, now)
                  }
                />
              </TableCell>
              <TableCell className={cn(CELL, 'text-right')}>
                {reviewStage(run) === 'review' ? (
                  <Button asChild size="sm" className="no-underline">
                    <a href={runHref(run.id)} aria-label={`Review “${run.initiative}”`}>
                      Review
                      <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                ) : finished ? (
                  <span className="inline-flex gap-[var(--space-2)]">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onNewRun(run.id)}
                      aria-label={`Request a new run: ${run.initiative}`}
                      title="Request a new run to fix a mistake"
                    >
                      <RotateCw aria-hidden className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onArchive(run.id)}
                      aria-label={`Archive “${run.initiative}”`}
                      title="Archive"
                    >
                      <Archive aria-hidden className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : (
                  <span className="text-meta text-text-secondary">
                    <span aria-hidden>—</span>
                    <span className="sr-only">Nothing to do yet</span>
                  </span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
