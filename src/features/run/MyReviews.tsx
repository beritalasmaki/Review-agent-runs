import {
  Archive,
  Check,
  Clock,
  ArrowRight,
  ChevronLeft,
  FileBarChart,
  List,
  RefreshCw,
  X,
} from 'lucide-react'
import { ChevronDown, ChevronUp } from 'lucide'
import { Badge } from '../../components/ui/badge'
import { MorphIcon } from '../../components/MorphIcon'
import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { LoadingState } from '../../components/LoadingState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/Tabs'
import { Button } from '../../components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible'
import { ThemeToggle } from '../../components/ThemeToggle'
import { notify } from '../../components/notify'
import { Toaster } from '../../components/ui/sonner'
import { listRuns } from '../../lib/api'
import type { GetRunOptions } from '../../lib/api'
import { formatCalendarDate, formatRelativeTime } from '../../lib/format'
import type {
  ArchiveSortKey,
  ManualArchive,
  ReviewTab,
  SortDirection,
  SortKey,
  TimeRange,
} from '../../lib/reviews'
import {
  ARCHIVE_AFTER_MONTHS,
  archiveState,
  countByTab,
  inTimeRange,
  isFinished,
  isInProgress,
  matchesQuery,
  needsReview,
  progressOf,
  requesters,
  reviewStatus,
  sortArchivedRuns,
  sortRuns,
  updatedAt,
} from '../../lib/reviews'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { ArchiveTable } from './ArchiveTable'
import {
  ArchiveConfirmDialog,
  DecisionDetailsDialog,
  NewRunDialog,
  ReportDialog,
} from './ReviewDialogs'
import type { ReportFormat } from './ReviewDialogs'
import { StageSteps } from './ReviewParts'
import { ReviewsTable } from './ReviewsTable'
import { ReviewsToolbar } from './ReviewsToolbar'
import type { FilterState } from './ReviewsToolbar'
import { downloadCsvReport, openPdfReport } from './reportExport'

/**
 * "My reviews" — the runs assigned to the reviewer (docs/DECISIONS.md, 0060, built from the
 * Claude Design handoff "My Reviews"). Tabs by run type; search, filters and sorting; the
 * runs still in progress below the table; an archive, where finished runs go after six months
 * or by hand, read-only (0085); a report on selected runs; and a request for a new run to fix
 * a mistake.
 *
 * There is no backend: archiving and new-run requests change this page's own state only, and
 * are gone after a reload, like decisions (README, "Try it"). Reports are real files, made in
 * the browser from the runs' data.
 */
export interface MyReviewsProps {
  runHref: (id: string) => string
  options?: GetRunOptions
  /** Fixed "now", for tests and stories. */
  now?: Date
}

type LoadState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; runs: Run[] }

export function MyReviews({ runHref, options, now }: MyReviewsProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const delayMs = options?.delayMs
  const simulateNetworkError = options?.simulateNetworkError

  useEffect(() => {
    let active = true
    listRuns({ delayMs, simulateNetworkError })
      .then((runs) => active && setState({ status: 'success', runs }))
      .catch(
        (error: unknown) =>
          active &&
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Something went wrong.',
          }),
      )
    return () => {
      active = false
    }
  }, [delayMs, simulateNetworkError, attempt])

  if (state.status === 'success') {
    return <ReviewsBoard runs={state.runs} runHref={runHref} now={now} />
  }
  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-[var(--space-5)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-6)]">
      <PageTitle>My reviews</PageTitle>
      {state.status === 'loading' ? (
        <LoadingState label="Loading reviews…" className="min-h-[40vh]" />
      ) : (
        <p className="text-body text-text-secondary">
          Could not load your reviews. {state.message}{' '}
          <Button
            variant="link"
            size="inline"
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((n) => n + 1)
            }}
            className="text-body font-normal font-body underline"
          >
            Retry
          </Button>
        </p>
      )}
    </div>
  )
}

function PageTitle({
  children,
  headingRef,
}: {
  children: string
  headingRef?: React.Ref<HTMLHeadingElement>
}) {
  return (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-[2.5rem] leading-tight font-bold tracking-tight font-heading text-text-primary outline-none"
    >
      {children}
    </h1>
  )
}

const TABS: {
  value: ReviewTab
  label: string
  mark?: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { value: 'pending', label: 'Pending', mark: 'group-aria-selected:bg-mark-pending', icon: Clock },
  {
    value: 'requested',
    label: 'Requested for change',
    mark: 'group-aria-selected:bg-mark-requested',
    icon: ArrowRight,
  },
  { value: 'declined', label: 'Declined', mark: 'group-aria-selected:bg-mark-declined', icon: X },
  {
    value: 'approved',
    label: 'Approved',
    mark: 'group-aria-selected:bg-mark-approved',
    icon: Check,
  },
  { value: 'all', label: 'All runs', icon: List },
]

const MAIN_TIMES: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'Any time' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom…' },
]
const ARCHIVE_TIMES = MAIN_TIMES.filter((t) =>
  ['all', 'thisMonth', 'thisYear', 'custom'].includes(t.value),
)

type Dialog =
  | { type: 'details' | 'newrun'; id: string }
  | { type: 'archive'; ids: string[] }
  | { type: 'report' }
  | null

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function ReviewsBoard({
  runs,
  runHref,
  now: fixedNow,
}: {
  runs: Run[]
  runHref: (id: string) => string
  now?: Date
}) {
  const [now] = useState(() => fixedNow ?? new Date())
  const today = formatCalendarDate(now.toISOString())
  const [view, setView] = useState<'main' | 'archive'>('main')
  const [tab, setTab] = useState<ReviewTab>('pending')
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    time: 'all',
    from: `${today.slice(0, 8)}01`,
    to: today,
    requester: 'all',
  })
  const [archiveType, setArchiveType] = useState<'all' | 'approved' | 'declined'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({
    key: 'updated',
    dir: 'desc',
  })
  const [aSort, setASort] = useState<{ key: ArchiveSortKey; dir: SortDirection }>({
    key: 'archived',
    dir: 'desc',
  })
  const [manual, setManual] = useState<ManualArchive>({})
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(null)
  const [progOpen, setProgOpen] = useState(true)
  const tableRef = useRef<HTMLTableElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusHeading = useRef(false)

  // A view change moves focus to the new view's heading, so a keyboard or screen reader user
  // lands on what just changed.
  useEffect(() => {
    if (!focusHeading.current) return
    focusHeading.current = false
    headingRef.current?.focus()
  }, [view])

  // Where focus goes once a confirmation dialog has closed. It cannot move while the dialog is
  // open (a modal makes the page behind it inert), and the button that opened it has gone with
  // its row, so the dialog has nothing to hand focus back to.
  const focusAfterDialog = useRef<'table' | 'heading' | null>(null)
  useEffect(() => {
    if (dialog || !focusAfterDialog.current) return
    const target = focusAfterDialog.current === 'table' ? tableRef.current : headingRef.current
    focusAfterDialog.current = null
    target?.focus()
  }, [dialog])

  const isArchived = (run: Run) => archiveState(run, manual, now).archived
  const matches = (run: Run) =>
    matchesQuery(run, filters.query) &&
    inTimeRange(updatedAt(run), filters.time, now, { from: filters.from, to: filters.to }) &&
    (filters.requester === 'all' || run.requestedBy === filters.requester)

  const active = runs.filter((run) => !isArchived(run))
  const archived = runs.filter(isArchived)
  const base = active.filter(matches)
  const counts = countByTab(base)
  const sorted = sortRuns(
    base.filter((run) => tab === 'all' || reviewStatus(run) === tab),
    sort.key,
    sort.dir,
  )
  const inProgress = sorted.filter(isInProgress)
  const tableRuns = sorted.filter((run) => !isInProgress(run))
  const onArchivePage = view === 'archive'
  const archivedRuns = sortArchivedRuns(
    archived
      .filter(matches)
      .filter(
        (run) => !onArchivePage || archiveType === 'all' || reviewStatus(run) === archiveType,
      ),
    aSort.key,
    aSort.dir,
    manual,
    now,
  )
  const needsYou = active.filter(needsReview).length
  const hasFilters = !!filters.query.trim() || filters.time !== 'all' || filters.requester !== 'all'
  const inlineArchive = !onArchivePage && !!filters.query.trim() && archivedRuns.length > 0
  const selectedIds = [...selected]
  const archivable = selectedIds.filter((id) => {
    const run = runs.find((r) => r.id === id)
    return run && isFinished(run) && !isArchived(run)
  })
  const people = requesters(runs)
  const byId = (id: string) => runs.find((run) => run.id === id)

  function patchFilters(next: Partial<FilterState>) {
    setFilters((current) => ({ ...current, ...next }))
  }
  function clearFilters() {
    patchFilters({ query: '', time: 'all', requester: 'all' })
  }
  function chooseTab(next: ReviewTab) {
    setTab(next)
    setSelected(new Set())
  }
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function openView(next: 'main' | 'archive') {
    focusHeading.current = true
    setView(next)
    setSelected(new Set())
  }
  function archive(ids: string[]) {
    const at = new Date().toISOString()
    setManual((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [id, at])) }))
    setSelected(new Set())
    const only = ids.length === 1 ? byId(ids[0]) : undefined
    notify(only ? `Archived “${only.initiative}”.` : `${plural(ids.length, 'run')} archived.`)
    // The row is gone: focus goes to the table it left, not to <body>.
    focusAfterDialog.current = 'table'
  }
  function createReport(report: {
    name: string
    format: ReportFormat
    include: Parameters<typeof downloadCsvReport>[2]
  }) {
    const chosen = selectedIds.map(byId).filter((run): run is Run => !!run)
    setDialog(null)
    setSelected(new Set())
    if (report.format === 'csv') {
      downloadCsvReport(report.name, chosen, report.include)
      notify(`“${report.name}” created as CSV, ${plural(chosen.length, 'run')}.`)
    } else if (openPdfReport(report.name, chosen, report.include)) {
      notify(
        `“${report.name}” is open in a new tab. Choose Save as PDF in the print dialog to keep it.`,
      )
    } else {
      notify('Your browser blocked the report tab. Allow pop-ups for this page, then try again.')
    }
  }

  const detailsRun = dialog && dialog.type === 'details' ? byId(dialog.id) : undefined
  const newRunRun = dialog && dialog.type === 'newrun' ? byId(dialog.id) : undefined
  const fromArchive = selectedIds.filter((id) => {
    const run = byId(id)
    return run && isArchived(run)
  }).length

  const selectionBar = (hint: string, withArchive: boolean) =>
    selected.size > 0 && (
      <div className="flex flex-wrap items-center gap-[var(--space-4)] border-b border-primary-tint-border bg-primary-tint px-[var(--space-5)] py-[var(--space-3)]">
        <span className="text-body leading-none font-semibold whitespace-nowrap text-text-primary">
          {plural(selected.size, 'run')} selected
        </span>
        <Button size="sm" onClick={() => setDialog({ type: 'report' })}>
          <FileBarChart aria-hidden className="h-3.5 w-3.5" />
          Create report
        </Button>
        {withArchive && (
          <Button
            size="sm"
            variant="outline"
            className="btn-glass glass-sheen"
            onClick={() => setDialog({ type: 'archive', ids: archivable })}
            disabled={archivable.length === 0}
          >
            <Archive aria-hidden className="h-3.5 w-3.5" />
            Archive
          </Button>
        )}
        <Button variant="link" size="inline" onClick={() => setSelected(new Set())}>
          Clear selection
        </Button>
        <span className="ml-auto text-caption text-text-secondary">{hint}</span>
      </div>
    )

  const archiveTable = () => (
    <ArchiveTable
      runs={archivedRuns}
      caption="Archived runs"
      runHref={runHref}
      sort={aSort}
      onSort={(key, dir) => setASort({ key, dir })}
      manual={manual}
      now={now}
      requestedRuns={requested}
      onDetails={(id) => setDialog({ type: 'details', id })}
      onNewRun={(id) => setDialog({ type: 'newrun', id })}
    />
  )

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-[var(--space-3)] px-[var(--space-4)] pt-[var(--space-6)] pb-[var(--space-7)] md:px-[var(--space-6)]">
      {!onArchivePage ? (
        <div className="overflow-hidden rounded-lg border border-glass-border bg-glass p-[var(--space-4)] shadow-glass-lg backdrop-blur-[var(--blur-glass)]">
          <div className="flex flex-wrap items-end justify-between gap-[var(--space-5)]">
            <div className="flex flex-col gap-[var(--space-2)]">
              <PageTitle headingRef={headingRef}>My reviews</PageTitle>
              <p className="text-lead leading-relaxed text-text-secondary">
                Agent runs assigned to you. Decide on pending runs, and find your past decisions.
              </p>
            </div>
            <div className="flex items-center gap-[var(--space-3)]">
              <Badge
                variant="warning"
                data-tour="needs-review-badge"
                className="border-glass-chip-border bg-glass-warning px-[var(--space-4)] py-[var(--space-2)] text-meta leading-none font-body"
              >
                <span aria-hidden className="h-2 w-2 rounded-full bg-status-waived-tint-fg" />
                {needsYou} need{needsYou === 1 ? 's' : ''} your review
              </Badge>
              <Button
                variant="outline"
                onClick={() => openView('archive')}
                aria-label={`Archive, ${plural(archived.length, 'archived run')}`}
                data-tour="archive-button"
                className="gap-[var(--space-2)]"
              >
                <Archive aria-hidden className="h-4 w-4" />
                Archive
                <Badge variant="muted" size="sm">
                  {archived.length}
                </Badge>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--space-5)]">
          <div className="flex items-center justify-between gap-[var(--space-4)]">
            <Button
              variant="link"
              size="inline"
              onClick={() => openView('main')}
              className="self-start font-medium font-body"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
              My reviews
            </Button>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-[var(--space-5)]">
            <PageTitle headingRef={headingRef}>Archive</PageTitle>
            <p className="max-w-[55rem] text-lead leading-relaxed text-text-secondary">
              Approved and declined runs move here automatically {ARCHIVE_AFTER_MONTHS} months after
              the decision. You can also archive them yourself from My reviews. The record here
              never changes; request a new run to fix a mistake.
            </p>
          </div>
        </div>
      )}

      {!onArchivePage && (
        <section
          aria-label="Runs"
          className="overflow-hidden rounded-lg border border-glass-border bg-glass shadow-glass-lg backdrop-blur-[var(--blur-glass)]"
        >
          <Tabs value={tab} onValueChange={(value) => chooseTab(value as ReviewTab)}>
            <div data-tour="run-tabs">
              <TabsList
                variant="pill"
                label="Run types"
                className="scrollbar-none w-full max-w-full justify-start overflow-x-auto rounded-lg border border-border-subtle bg-surface-raised p-[var(--space-2)]"
              >
                {TABS.map(({ value, label, mark, icon: Icon }) => (
                  <TabsTrigger key={value} variant="pill" value={value} className="group">
                    {mark ? (
                      <span
                        aria-hidden
                        className={cn(
                          'inline-flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-surface-raised text-text-secondary transition-colors duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] group-aria-selected:text-mark-glyph',
                          mark,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                    ) : (
                      <Icon aria-hidden className="h-4 w-4 text-text-secondary" />
                    )}
                    {label}
                    <Badge variant={tab === value ? 'primary-tint' : 'muted'} size="sm">
                      {counts[value]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value={tab}>
              <div data-tour="search-filters" className="border-b border-border-subtle">
                <ReviewsToolbar
                  searchLabel="Search runs"
                  searchPlaceholder="Search runs, also in the archive"
                  filters={filters}
                  onFilters={patchFilters}
                  open={filtersOpen}
                  onToggleOpen={() => setFiltersOpen((open) => !open)}
                  timeLabel="Time"
                  timeOptions={MAIN_TIMES}
                  type={{
                    value: tab,
                    counts: false,
                    onChange: (value) => chooseTab(value as ReviewTab),
                    options: [...TABS.filter((t) => t.value !== 'all'), TABS[4]].map((t) => ({
                      value: t.value,
                      label: t.value === 'all' ? 'All run types' : t.label,
                    })),
                  }}
                  people={people}
                  resultLabel={`Showing ${tableRuns.length} of ${plural(active.length, 'active run')}`}
                  onClear={hasFilters ? clearFilters : undefined}
                />
              </div>
              {selectionBar(
                'You can select approved and declined runs, to make a report or to archive them.',
                true,
              )}
              <ReviewsTable
                ref={tableRef}
                runs={tableRuns}
                caption={`${TABS.find((t) => t.value === tab)?.label ?? ''} runs`}
                runHref={runHref}
                sort={sort}
                onSort={(key, dir) => setSort({ key, dir })}
                selectable={tab !== 'pending'}
                selected={selected}
                onToggle={toggle}
                manual={manual}
                now={now}
                onDetails={(id) => setDialog({ type: 'details', id })}
                onNewRun={(id) => setDialog({ type: 'newrun', id })}
                onArchive={(id) => setDialog({ type: 'archive', ids: [id] })}
              />
              {tableRuns.length === 0 && (
                <div className="flex flex-col items-center gap-[var(--space-2)] px-[var(--space-5)] py-[var(--space-7)] text-center">
                  {/* Nothing to decide here, but work is under way below: say that, not "no
                      match", which would read as if the tab were empty. */}
                  <p className="text-item-title font-semibold font-heading text-text-primary">
                    {inProgress.length > 0 && !hasFilters
                      ? 'Nothing here needs you yet'
                      : 'No active runs match these filters'}
                  </p>
                  <p className="text-body text-text-secondary">
                    {inProgress.length > 0 && !hasFilters
                      ? 'The runs below are still in progress. They move up when they are ready for you.'
                      : 'Try another tab, time range or requester.'}
                  </p>
                  {hasFilters && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearFilters}
                      className="btn-glass glass-sheen mt-[var(--space-1)] px-[var(--space-4)]"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
              {inProgress.length > 0 && (
                <InProgress
                  runs={inProgress}
                  open={progOpen}
                  onToggle={() => setProgOpen((o) => !o)}
                  now={now}
                />
              )}
            </TabsContent>
          </Tabs>
        </section>
      )}

      {inlineArchive && (
        <div className="flex flex-wrap items-end justify-between gap-[var(--space-5)] pt-[var(--space-2)]">
          <div className="flex flex-col gap-[var(--space-5)]">
            <h2 className="flex items-center gap-[var(--space-3)] text-section-heading font-bold font-heading text-text-primary">
              <Archive aria-hidden className="h-5 w-5 text-text-primary" />
              Also found in the archive
              <Badge variant="muted" size="sm">
                {archivedRuns.length}
              </Badge>
            </h2>
            <p className="text-body text-text-secondary">
              Archived runs that match “{filters.query.trim()}”. They are shown here only while you
              search.
            </p>
          </div>
          <Button
            variant="link"
            size="inline"
            onClick={() => openView('archive')}
            className="gap-[var(--space-2)]"
          >
            Open the archive
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {inlineArchive && (
        <section
          aria-label="Also found in the archive"
          className="overflow-hidden rounded-lg border border-glass-border bg-glass shadow-glass-lg backdrop-blur-[var(--blur-glass)]"
        >
          {archiveTable()}
        </section>
      )}

      {onArchivePage && (
        <section
          aria-label="Archived runs"
          className="overflow-hidden rounded-lg border border-glass-border bg-glass shadow-glass-lg backdrop-blur-[var(--blur-glass)]"
        >
          <div className="border-b border-border-subtle">
            <ReviewsToolbar
              searchLabel="Search the archive"
              searchPlaceholder="Search the archive"
              filters={filters}
              onFilters={patchFilters}
              open={filtersOpen}
              onToggleOpen={() => setFiltersOpen((open) => !open)}
              timeLabel="Decided"
              timeOptions={ARCHIVE_TIMES}
              type={{
                value: archiveType,
                counts: true,
                onChange: (value) => setArchiveType(value as typeof archiveType),
                options: [
                  { value: 'all', label: 'All run types' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'declined', label: 'Declined' },
                ],
              }}
              people={people}
              resultLabel={`Showing ${archivedRuns.length} of ${plural(archived.length, 'archived run')}`}
            />
          </div>
          {archiveTable()}
        </section>
      )}

      {detailsRun && (
        <DecisionDetailsDialog
          run={detailsRun}
          href={runHref(detailsRun.id)}
          now={now}
          onClose={() => setDialog(null)}
          onNewRun={() => setDialog({ type: 'newrun', id: detailsRun.id })}
        />
      )}
      {newRunRun && (
        <NewRunDialog
          run={newRunRun}
          onClose={() => setDialog(null)}
          onSend={() => {
            setRequested((current) => new Set(current).add(newRunRun.id))
            setDialog(null)
            notify(
              `Request sent to ${newRunRun.requestedBy}. You will get a message when they answer.`,
            )
          }}
        />
      )}
      {dialog?.type === 'archive' && (
        <ArchiveConfirmDialog
          runs={dialog.ids.map(byId).filter((run): run is Run => !!run)}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null)
            archive(dialog.ids)
          }}
        />
      )}
      {dialog?.type === 'report' && (
        <ReportDialog
          count={selected.size}
          fromArchive={fromArchive}
          defaultName={`Review report ${today}`}
          onClose={() => setDialog(null)}
          onCreate={createReport}
        />
      )}
      <Toaster />
    </div>
  )
}

/** Pending runs that are not ready for a person yet, folded away below the table. */
function InProgress({
  runs,
  open,
  onToggle,
  now,
}: {
  runs: Run[]
  open: boolean
  onToggle: () => void
  now: Date
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onToggle}
      className="flex flex-col border-t-4 border-surface-raised"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-[var(--space-4)] rounded-b-lg data-[state=open]:rounded-b-none px-[var(--space-5)] py-[var(--space-4)] text-left hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring">
        <span
          aria-hidden
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </span>
        <span className="flex flex-col gap-[var(--space-1)]">
          <span className="text-body font-semibold text-text-primary">
            {plural(runs.length, 'run')} still in progress
          </span>
          <span className="text-meta text-text-secondary">
            The agent or the checks are not finished. You do not need to do anything yet. They move
            up when they are ready for you.
          </span>
        </span>
        <span className="ml-auto inline-flex items-center gap-[var(--space-2)] text-meta font-semibold font-heading whitespace-nowrap text-primary">
          {open ? 'Hide' : 'Show'}
          <MorphIcon icon={open ? ChevronUp : ChevronDown} className="h-3 w-3" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
        <ul className="flex flex-col rounded-b-lg border-t border-border-subtle bg-bg">
          {runs.map((run) => {
            const progress = progressOf(run)
            const sentBack = reviewStatus(run) === 'requested' && run.decision
            return (
              <li
                key={run.id}
                className="grid grid-cols-[minmax(0,1fr)_15rem_12.5rem_8rem] items-center gap-[var(--space-4)] border-b border-border-subtle py-[var(--space-3)] pr-[var(--space-5)] pl-[calc(var(--space-7)+var(--space-2))]"
              >
                <span className="flex min-w-0 flex-col gap-[var(--space-1)]">
                  <span
                    title={run.initiative}
                    className="truncate text-body font-medium text-text-primary"
                  >
                    {run.initiative}
                  </span>
                  <span className="truncate text-caption text-text-secondary">
                    <span className="font-mono">{run.id}</span> · {run.target.system} ·{' '}
                    {run.target.environment}
                  </span>
                </span>
                {progress && (
                  <span className="flex items-center gap-[var(--space-3)]">
                    <StageSteps stage={progress.stage} className="w-[4.5rem] shrink-0" />
                    <span className="text-meta font-medium whitespace-nowrap text-text-primary">
                      {progress.label}
                    </span>
                  </span>
                )}
                <ActorName
                  name={run.requestedBy}
                  className="text-meta font-medium whitespace-nowrap"
                />
                <span className="flex flex-col gap-[var(--space-1)] whitespace-nowrap">
                  <span className="text-meta font-medium text-text-primary">
                    {formatCalendarDate(sentBack ? sentBack.at : run.startedAt)}
                  </span>
                  <span className="text-caption text-text-secondary">
                    {sentBack ? 'Sent back' : 'Started'}{' '}
                    {formatRelativeTime(sentBack ? sentBack.at : run.startedAt, now)}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
