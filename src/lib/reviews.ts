import { resolveConfidenceAreas } from './confidence'
import {
  formatCalendarDate,
  formatConfidenceAreaLabel,
  formatConfidencePercent,
  formatDecisionOutcomeLabel,
  formatGateResultLabel,
} from './format'
import { buildOpenItems } from './openItems'
import type { Run } from './types'

/**
 * "My reviews" — the list of runs assigned to the reviewer, its tabs, search, filters, sort,
 * archive and report (docs/DECISIONS.md, 0060). Not UI: every function takes the runs and,
 * where time matters, `now`, so the list reads the same in tests as in the browser.
 */

/** The four run types a reviewer sorts by, in the design's order. */
export type ReviewStatus = 'pending' | 'requested' | 'declined' | 'approved'

export const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'requested', 'declined', 'approved']

export function reviewStatus(run: Run): ReviewStatus {
  switch (run.status) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'declined'
    case 'changes_requested':
      return 'requested'
    default:
      return 'pending'
  }
}

/** Where a pending run is: the agent works, the checks run, then a person reviews. */
export type ReviewStage = 'agent' | 'checks' | 'review'

export const STAGE_STEP: Record<ReviewStage, number> = { agent: 1, checks: 2, review: 3 }

export function reviewStage(run: Run): ReviewStage | null {
  if (reviewStatus(run) !== 'pending') return null
  if (run.status === 'running') return 'agent'
  if (run.status === 'checks_running') return 'checks'
  return 'review'
}

/** Runs the agent or the checks are still working on, listed apart below the table
 * (docs/DECISIONS.md, 0061): pending runs not ready for a person yet, and runs sent back for
 * changes, which the agent is making. */
export function isInProgress(run: Run): boolean {
  const stage = reviewStage(run)
  return stage === 'agent' || stage === 'checks' || reviewStatus(run) === 'requested'
}

/** Where an in-progress run is, as the list says it, and its step of three. */
export function progressOf(run: Run): { stage: ReviewStage; label: string } | null {
  if (reviewStatus(run) === 'requested') return { stage: 'agent', label: 'Agent is making changes' }
  const stage = reviewStage(run)
  return stage ? { stage, label: formatReviewStage(stage) } : null
}

export function needsReview(run: Run): boolean {
  return reviewStage(run) === 'review'
}

/** Open items: what is still open, or for an approved run, how many the reviewer accepted.
 * Null while the agent or the checks are still working — not known yet, never guessed. */
export function openItemCount(run: Run): number | null {
  if (run.status === 'running' || run.status === 'checks_running') return null
  if (run.status === 'approved' && run.decision) return run.decision.acknowledgedItemIds.length
  return buildOpenItems(run).length
}

/** The last time something happened: the decision, else the end of the run, else its start. */
export function updatedAt(run: Run): string {
  return run.decision?.at ?? run.finishedAt ?? run.startedAt
}

/** Only approved and declined runs are finished: they can be archived, selected for a
 * report, and have a new run requested to fix a mistake. */
export function isFinished(run: Run): boolean {
  const status = reviewStatus(run)
  return status === 'approved' || status === 'declined'
}

// ---- Archive ---------------------------------------------------------------------------

/** Finished runs move to the archive this many months after the decision. */
export const ARCHIVE_AFTER_MONTHS = 6
/** A run can be restored this many days after it was archived; then it is locked. */
export const RESTORE_DAYS = 7
const DAY_MS = 86_400_000

function addMonths(iso: string, months: number): Date {
  const date = new Date(iso)
  date.setMonth(date.getMonth() + months)
  return date
}

/** Runs the reviewer archived by hand: id → when. Everything else is archived by the rule. */
export type ManualArchive = Record<string, string>

export interface ArchiveState {
  archived: boolean
  /** When it moved, and who moved it. Only set once archived. */
  archivedAt?: string
  by?: 'you' | 'auto'
  /** For a finished run still in My reviews: when the rule will archive it. */
  autoAt?: string
  canRestore: boolean
  /** Whole days of the restore window left, 0 once locked. */
  restoreDaysLeft: number
}

export function archiveState(
  run: Run,
  manual: ManualArchive,
  now: Date = new Date(),
): ArchiveState {
  if (!isFinished(run) || !run.decision) {
    return { archived: false, canRestore: false, restoreDaysLeft: 0 }
  }
  const autoAt = addMonths(run.decision.at, ARCHIVE_AFTER_MONTHS)
  const byHand = manual[run.id]
  const archivedAt = byHand ?? (autoAt <= now ? autoAt.toISOString() : undefined)
  if (!archivedAt) {
    return { archived: false, autoAt: autoAt.toISOString(), canRestore: false, restoreDaysLeft: 0 }
  }
  // Never negative: a run archived a moment after the page read "now" is 0 days in, not -0.001.
  const daysSince = Math.max(0, (now.getTime() - new Date(archivedAt).getTime()) / DAY_MS)
  const restoreDaysLeft = Math.max(0, Math.ceil(RESTORE_DAYS - daysSince))
  return {
    archived: true,
    archivedAt,
    by: byHand ? 'you' : 'auto',
    canRestore: restoreDaysLeft > 0,
    restoreDaysLeft,
  }
}

/** "Archives in 5 months", "Archives in 12 days", "Archives today". */
export function formatArchivesIn(autoAt: string, now: Date = new Date()): string {
  const days = Math.ceil((new Date(autoAt).getTime() - now.getTime()) / DAY_MS)
  if (days <= 0) return 'Archives today'
  if (days < 31) return `Archives in ${days} day${days === 1 ? '' : 's'}`
  const months = Math.round(days / 30.5)
  return `Archives in ${months} month${months === 1 ? '' : 's'}`
}

// ---- Search and filters ----------------------------------------------------------------

/** Search reads the run's name, reference, service and requester. */
export function matchesQuery(run: Run, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [run.initiative, run.id, run.target.system, run.requestedBy].some((value) =>
    value.toLowerCase().includes(q),
  )
}

export type TimeRange = 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'thisYear' | 'custom'

/** Local calendar days, the same days `formatCalendarDate` shows. Weeks start on Monday. */
export function inTimeRange(
  iso: string,
  range: TimeRange,
  now: Date = new Date(),
  custom: { from?: string; to?: string } = {},
): boolean {
  if (range === 'all') return true
  const day = formatCalendarDate(iso)
  if (range === 'custom') {
    return (!custom.from || day >= custom.from) && (!custom.to || day <= custom.to)
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const date = new Date(iso)
  switch (range) {
    case 'thisWeek':
      return date >= monday
    case 'lastWeek': {
      const previous = new Date(monday)
      previous.setDate(monday.getDate() - 7)
      return date >= previous && date < monday
    }
    case 'thisMonth':
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    case 'thisYear':
      return date.getFullYear() === now.getFullYear()
  }
}

/** Everyone who asked for one of these runs, A to Z — the Requester filter's options. */
export function requesters(runs: Run[]): string[] {
  return [...new Set(runs.map((run) => run.requestedBy))].sort((a, b) => a.localeCompare(b))
}

export type ReviewTab = ReviewStatus | 'all'

export function countByTab(runs: Run[]): Record<ReviewTab, number> {
  const counts: Record<ReviewTab, number> = {
    all: runs.length,
    pending: 0,
    requested: 0,
    declined: 0,
    approved: 0,
  }
  for (const run of runs) counts[reviewStatus(run)] += 1
  return counts
}

// ---- Sort ------------------------------------------------------------------------------

export type SortKey = 'run' | 'type' | 'open' | 'requester' | 'updated'
export type ArchiveSortKey = 'run' | 'type' | 'requester' | 'decided' | 'archived'
export type SortDirection = 'asc' | 'desc'

const STATUS_ORDER: Record<ReviewStatus, number> = {
  pending: 0,
  requested: 1,
  declined: 2,
  approved: 3,
}

const time = (iso: string) => new Date(iso).getTime()

const COMPARE: Record<SortKey, (a: Run, b: Run) => number> = {
  run: (a, b) => a.initiative.localeCompare(b.initiative),
  type: (a, b) => STATUS_ORDER[reviewStatus(a)] - STATUS_ORDER[reviewStatus(b)],
  open: (a, b) => (openItemCount(a) ?? -1) - (openItemCount(b) ?? -1),
  requester: (a, b) => a.requestedBy.localeCompare(b.requestedBy),
  updated: (a, b) => time(updatedAt(a)) - time(updatedAt(b)),
}

/** Sorted by `key`. Ordered by "updated", runs that need the reviewer come first either way
 * (the design's pinned "needs your review"): the list's job is to put the next task on top. */
export function sortRuns(runs: Run[], key: SortKey, direction: SortDirection): Run[] {
  const sign = direction === 'asc' ? 1 : -1
  return [...runs].sort((a, b) => {
    if (key === 'updated') {
      const pin = Number(!needsReview(a)) - Number(!needsReview(b))
      if (pin !== 0) return pin
    }
    return sign * COMPARE[key](a, b) || time(updatedAt(b)) - time(updatedAt(a))
  })
}

export function sortArchivedRuns(
  runs: Run[],
  key: ArchiveSortKey,
  direction: SortDirection,
  manual: ManualArchive,
  now: Date = new Date(),
): Run[] {
  const sign = direction === 'asc' ? 1 : -1
  const archivedAt = (run: Run) => time(archiveState(run, manual, now).archivedAt ?? run.startedAt)
  const compare: Record<ArchiveSortKey, (a: Run, b: Run) => number> = {
    run: COMPARE.run,
    type: COMPARE.type,
    requester: COMPARE.requester,
    decided: COMPARE.updated,
    archived: (a, b) => archivedAt(a) - archivedAt(b),
  }
  return [...runs].sort((a, b) => sign * compare[key](a, b) || archivedAt(b) - archivedAt(a))
}

// ---- Report ----------------------------------------------------------------------------

export interface ReportInclude {
  decision: boolean
  open: boolean
  checks: boolean
  steps: boolean
}

export interface ReportRecord {
  title: string
  reference: string
  service: string
  environment: string
  status: string
  requestedBy: string
  decision?: { outcome: string; by: string; at: string; reason: string }
  openItems?: { text: string; accepted: boolean }[]
  checks?: string[]
  confidence?: string[]
  steps?: { at: string; type: string; title: string }[]
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  requested: 'Requested for change',
  declined: 'Declined',
  approved: 'Approved',
}

export function formatReviewStatus(status: ReviewStatus): string {
  return STATUS_LABEL[status]
}

const STAGE_LABEL: Record<ReviewStage, string> = {
  agent: 'Agent is working',
  checks: 'Checks are running',
  review: 'Needs your review',
}

export function formatReviewStage(stage: ReviewStage): string {
  return STAGE_LABEL[stage]
}

/** One run as a report shows it — only what the run's own data says. */
export function reportRecord(run: Run, include: ReportInclude): ReportRecord {
  const record: ReportRecord = {
    title: run.initiative,
    reference: run.id,
    service: run.target.system,
    environment: run.target.environment,
    status: formatReviewStatus(reviewStatus(run)),
    requestedBy: run.requestedBy,
  }
  if (include.decision && run.decision) {
    record.decision = {
      outcome: formatDecisionOutcomeLabel(run.decision.outcome),
      by: run.decision.by,
      at: run.decision.at,
      reason: run.decision.reason ?? '',
    }
  }
  if (include.open) {
    const accepted = new Set(run.decision?.acknowledgedItemIds ?? [])
    record.openItems = buildOpenItems(run).map((item) => ({
      text: item.text,
      accepted: accepted.has(item.id),
    }))
  }
  if (include.checks) {
    record.checks = run.gates.map((gate) => `${gate.name}: ${formatGateResultLabel(gate)}`)
    record.confidence = resolveConfidenceAreas(run.confidence).map((area) =>
      area.missing
        ? `${formatConfidenceAreaLabel(area.area)}: no score`
        : `${formatConfidenceAreaLabel(area.area)}: ${formatConfidencePercent(area.value)}`,
    )
  }
  if (include.steps) {
    record.steps = run.timeline.map((event) => ({
      at: event.at,
      type: event.type,
      title: event.title,
    }))
  }
  return record
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** The CSV form of a report: one row per run, then — if steps are included — one row per step,
 * tagged in the first column so a spreadsheet can filter either. */
export function buildReportCsv(runs: Run[], include: ReportInclude): string {
  const header = ['Row', 'Run', 'Reference', 'Service', 'Environment', 'Status', 'Requested by']
  if (include.decision) header.push('Decision', 'Decided by', 'Decided at', 'Reason')
  if (include.open) header.push('Open items')
  if (include.checks) header.push('Checks', 'Confidence')
  if (include.steps) header.push('Step time', 'Step type', 'Step')

  const lines = [header]
  for (const run of runs) {
    const r = reportRecord(run, include)
    const base = [r.title, r.reference, r.service, r.environment, r.status, r.requestedBy]
    const row = ['run', ...base]
    if (include.decision) {
      row.push(r.decision?.outcome ?? '', r.decision?.by ?? '', r.decision?.at ?? '')
      row.push(r.decision?.reason ?? '')
    }
    if (include.open) {
      row.push(
        (r.openItems ?? [])
          .map((item) => `${item.text}${item.accepted ? ' (accepted)' : ''}`)
          .join('; '),
      )
    }
    if (include.checks) row.push((r.checks ?? []).join('; '), (r.confidence ?? []).join('; '))
    if (include.steps) row.push('', '', '')
    lines.push(row)

    for (const step of r.steps ?? []) {
      const blanks = header.length - base.length - 4
      lines.push([
        'step',
        ...base,
        ...Array<string>(blanks).fill(''),
        step.at,
        step.type,
        step.title,
      ])
    }
  }
  return lines.map((line) => line.map(csvCell).join(',')).join('\n') + '\n'
}
