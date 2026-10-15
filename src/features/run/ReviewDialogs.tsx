import { Archive, ArrowRight, Download, FileBarChart, RotateCcw, RotateCw } from 'lucide-react'
import { RadioGroup, RadioGroupSegment } from '../../components/ui/radio-group'
import { Textarea } from '../../components/ui/textarea'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '../../components/Modal'
import { undoWindow } from '../../lib/decision'
import { formatCalendarDate, formatClock, formatDuration, formatUtcOffset } from '../../lib/format'
import { buildOpenItems } from '../../lib/openItems'
import type { ReportInclude, ReviewStatus } from '../../lib/reviews'
import {
  RESTORE_DAYS,
  formatReviewStage,
  formatReviewStatus,
  isFinished,
  reviewStage,
  reviewStatus,
} from '../../lib/reviews'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { ReviewStatusPill } from './ReviewParts'

/**
 * The three dialogs My reviews opens (docs/DECISIONS.md, 0060): a run's decision details,
 * a request for a new run to fix a mistake, and a report on the selected runs. Every fact in
 * them is read from the run itself.
 */

const SECTION_LABEL =
  'text-caption leading-none font-semibold font-heading tracking-wider text-text-secondary uppercase'

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-[var(--space-5)] -mb-[var(--space-5)] flex flex-wrap items-center gap-[var(--space-3)] rounded-b-md border-t border-border-subtle bg-bg px-[var(--space-5)] py-[var(--space-4)]">
      {children}
    </div>
  )
}

function whenDecided(iso: string): string {
  return `${formatCalendarDate(iso)} at ${formatClock(iso)} (${formatUtcOffset(new Date(iso))})`
}

const DECISION_TITLE: Record<ReviewStatus, string> = {
  approved: 'Approved',
  declined: 'Declined',
  requested: 'Changes requested',
  pending: 'No decision yet',
}

// ---- Decision details ------------------------------------------------------------------

export interface DecisionDetailsDialogProps {
  run: Run
  href: string
  now: Date
  onClose: () => void
  onNewRun: () => void
}

export function DecisionDetailsDialog({
  run,
  href,
  now,
  onClose,
  onNewRun,
}: DecisionDetailsDialogProps) {
  const status = reviewStatus(run)
  const stage = reviewStage(run)
  const decision = run.decision

  let heading = 'Reason given'
  let reason = decision?.reason ?? ''
  let next = ''
  if (status === 'approved' && decision) {
    const undo = undoWindow(decision, now)
    next = `Released to ${run.target.system} (${run.target.environment}). ${
      undo.active
        ? `You can still undo it for ${formatDuration(undo.remainingMs)}.`
        : 'The undo time has ended.'
    }`
  } else if (status === 'declined') {
    next = 'Nothing was released. The run is closed.'
  } else if (status === 'requested') {
    next = 'The agent is making the changes. The new run comes back to you for review.'
  } else {
    heading = 'What happens now'
    reason =
      stage === 'review'
        ? 'The agent has finished and the checks have run. The run is waiting for your decision.'
        : stage === 'checks'
          ? 'The agent has finished. The automatic checks are still running.'
          : 'The agent is still working on the change.'
    next =
      stage === 'review'
        ? 'Open the review to decide.'
        : 'You will get a message when the run is ready for you.'
  }

  const accepted = new Set(decision?.acknowledgedItemIds ?? [])
  const items =
    run.status === 'running' || run.status === 'checks_running'
      ? null
      : buildOpenItems(run).filter((item) => status !== 'approved' || accepted.has(item.id))

  return (
    <Modal
      title={run.initiative}
      eyebrow="Decision details"
      onClose={onClose}
      className="max-w-[37.5rem]"
    >
      <p className="flex items-center gap-[var(--space-2)] text-caption text-text-secondary">
        <span className="font-mono">{run.id}</span>
        <span aria-hidden className="text-text-secondary">
          ·
        </span>
        {run.target.system}
      </p>

      <section className="flex flex-col gap-[var(--space-3)] rounded-lg bg-surface-raised p-[var(--space-4)]">
        <h3 className={SECTION_LABEL}>Decision</h3>
        <div className="flex flex-wrap items-center gap-[var(--space-3)]">
          <ReviewStatusPill status={status} label={DECISION_TITLE[status]} />
          {decision && <ActorName name={decision.by} className="text-meta font-medium" />}
        </div>
        <p className="text-meta text-text-secondary">
          {decision ? whenDecided(decision.at) : stage ? formatReviewStage(stage) : ''}
        </p>
      </section>

      <section className="flex flex-col gap-[var(--space-2)]">
        <h3 className={SECTION_LABEL}>{heading}</h3>
        {reason ? (
          <p className="rounded-r-md border-l-4 border-border bg-bg px-[var(--space-4)] py-[var(--space-3)] text-body leading-relaxed text-text-primary">
            {reason}
          </p>
        ) : (
          <p className="text-body text-text-secondary">No reason was given.</p>
        )}
        <p className="text-meta text-text-secondary">{next}</p>
      </section>

      <section className="flex flex-col gap-[var(--space-2)]">
        <h3 className={SECTION_LABEL}>
          {status === 'approved' ? 'Open items accepted' : 'Open items'}
        </h3>
        {items === null ? (
          <p className="text-body text-text-secondary">
            Not known yet. The run is still in progress.
          </p>
        ) : items.length === 0 ? (
          <p className="text-body text-text-secondary">None. Everything was checked.</p>
        ) : (
          <ul className="flex flex-col gap-[var(--space-1)]">
            {items.map((item) => (
              <li key={item.id} className="flex gap-[var(--space-2)] text-body text-text-primary">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-status-waived"
                />
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-[var(--space-2)]">
        <h3 className={SECTION_LABEL}>Requested by</h3>
        <ActorName name={run.requestedBy} className="self-start text-meta font-medium" />
      </section>

      <Footer>
        {isFinished(run) && (
          <Button variant="outline" onClick={onNewRun}>
            <RotateCw aria-hidden className="h-3.5 w-3.5" />
            Request a new run
          </Button>
        )}
        <span className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button asChild className="no-underline">
          <a href={href}>
            Open the full review
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        </Button>
      </Footer>
    </Modal>
  )
}

// ---- Request a new run -----------------------------------------------------------------

export interface NewRunDialogProps {
  run: Run
  onClose: () => void
  onSend: (request: { whatWentWrong: string; whatToDo: string }) => void
}

const NEW_RUN_STEPS = [
  'You send the request',
  'The requester agrees or says no',
  'The agent makes a new run',
  'You review the new run',
]

export function NewRunDialog({ run, onClose, onSend }: NewRunDialogProps) {
  const [whatWentWrong, setWhatWentWrong] = useState('')
  const [whatToDo, setWhatToDo] = useState('')
  const wrongId = useId()
  const doId = useId()
  const ready = whatWentWrong.trim().length > 0

  return (
    <Modal title="Request a new run" onClose={onClose} className="max-w-[37.5rem]">
      <div className="flex flex-col gap-[var(--space-1)] rounded-md bg-surface-raised px-[var(--space-4)] py-[var(--space-3)]">
        <span className="text-caption text-text-secondary">The run with the mistake</span>
        <span className="text-body font-semibold text-text-primary">{run.initiative}</span>
        <span className="flex items-center gap-[var(--space-2)] text-caption text-text-secondary">
          <span className="font-mono">{run.id}</span>
          <span aria-hidden className="text-text-secondary">
            ·
          </span>
          {formatReviewStatus(reviewStatus(run))}
          {run.decision && ` on ${formatCalendarDate(run.decision.at)}`}
        </span>
      </div>
      <p className="text-body leading-relaxed text-text-primary">
        Past runs cannot be changed. They stay in the record exactly as they were decided. A new run
        fixes the mistake, and it links back to this run so the history stays clear.
      </p>
      <div className="flex flex-col gap-[var(--space-2)]">
        <label htmlFor={wrongId} className="text-meta font-semibold text-text-primary">
          What went wrong? <span className="font-normal text-text-secondary">(required)</span>
        </label>
        <Textarea
          id={wrongId}
          rows={3}
          required
          value={whatWentWrong}
          onChange={(event) => setWhatWentWrong(event.target.value)}
          placeholder="For example: the refund amount is rounded the wrong way for Swedish orders."
        />
      </div>
      <div className="flex flex-col gap-[var(--space-2)]">
        <label htmlFor={doId} className="text-meta font-semibold text-text-primary">
          What should the new run do?
        </label>
        <Textarea
          id={doId}
          rows={2}
          value={whatToDo}
          onChange={(event) => setWhatToDo(event.target.value)}
          placeholder="For example: round to the nearest öre and add a test for it."
        />
      </div>
      <div className="flex flex-col gap-[var(--space-3)] border-t border-border-subtle pt-[var(--space-4)]">
        <p className="text-body leading-loose text-text-primary">
          Your request goes first to{' '}
          <ActorName name={run.requestedBy} className="align-middle text-meta font-medium" />, who
          asked for the original change.
        </p>
        <ol className="grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-4">
          {NEW_RUN_STEPS.map((step, index) => (
            <li key={step} className="flex flex-col items-start gap-[var(--space-2)]">
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold',
                  index === 0
                    ? 'bg-text-primary text-surface'
                    : 'bg-surface-raised text-text-secondary',
                )}
              >
                {index + 1}
              </span>
              <span className="text-caption font-medium text-text-primary">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <Footer>
        <span className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!ready}
          onClick={() => onSend({ whatWentWrong: whatWentWrong.trim(), whatToDo: whatToDo.trim() })}
        >
          Send request
        </Button>
      </Footer>
    </Modal>
  )
}

// ---- Create a report -------------------------------------------------------------------

export type ReportFormat = 'pdf' | 'csv'

export interface ReportDialogProps {
  count: number
  fromArchive: number
  defaultName: string
  onClose: () => void
  onCreate: (report: { name: string; format: ReportFormat; include: ReportInclude }) => void
}

const INCLUDE: { key: keyof ReportInclude; label: string; hint?: string }[] = [
  { key: 'decision', label: 'Decision, name, time and reason' },
  { key: 'open', label: 'Open items and how they were handled' },
  { key: 'checks', label: 'Checks and confidence scores' },
  {
    key: 'steps',
    label: 'Every agent step',
    hint: 'Makes the report much longer. Useful for audits.',
  },
]

export function ReportDialog({
  count,
  fromArchive,
  defaultName,
  onClose,
  onCreate,
}: ReportDialogProps) {
  const [name, setName] = useState(defaultName)
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [include, setInclude] = useState<ReportInclude>({
    decision: true,
    open: true,
    checks: true,
    steps: false,
  })
  const nameId = useId()
  const formatId = useId()

  return (
    <Modal title="Create a report" onClose={onClose} className="max-w-[37.5rem]">
      <p className="flex items-center gap-[var(--space-2)] text-body text-text-secondary">
        <FileBarChart aria-hidden className="h-4 w-4 text-text-secondary" />
        {count} run{count === 1 ? '' : 's'} selected
        {fromArchive > 0 && `, ${fromArchive} from the archive`}
      </p>
      <div className="flex flex-col gap-[var(--space-2)]">
        <label htmlFor={nameId} className="text-meta font-semibold text-text-primary">
          Report name
        </label>
        <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="flex flex-col gap-[var(--space-2)]">
        <p id={formatId} className="mb-[var(--space-2)] text-meta font-semibold text-text-primary">
          Format
        </p>
        <RadioGroup
          aria-labelledby={formatId}
          value={format}
          onValueChange={(value) => setFormat(value as typeof format)}
          className="flex gap-[var(--space-1)] self-start rounded-lg bg-surface-raised p-[var(--space-1)]"
        >
          {(
            [
              ['pdf', 'PDF, for reading and sharing'],
              ['csv', 'CSV, for spreadsheets'],
            ] as const
          ).map(([value, label]) => (
            <RadioGroupSegment key={value} value={value}>
              {label}
            </RadioGroupSegment>
          ))}
        </RadioGroup>
      </div>
      <fieldset className="flex flex-col gap-[var(--space-1)]">
        <legend className="mb-[var(--space-2)] text-meta font-semibold text-text-primary">
          What to include
        </legend>
        {INCLUDE.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-[var(--space-3)] py-[var(--space-2)]"
          >
            <Checkbox
              checked={include[option.key]}
              onCheckedChange={() =>
                setInclude((current) => ({ ...current, [option.key]: !current[option.key] }))
              }
              className="mt-0.5"
            />
            <span className="flex flex-col gap-[var(--space-1)]">
              <span className="text-body font-medium text-text-primary">{option.label}</span>
              {option.hint && (
                <span className="text-caption text-text-secondary">{option.hint}</span>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      <Footer>
        <span className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onCreate({ name: name.trim() || defaultName, format, include })}>
          <Download aria-hidden className="h-4 w-4" />
          Create report
        </Button>
      </Footer>
    </Modal>
  )
}

// ---- Archive and restore ---------------------------------------------------------------

export interface ArchiveConfirmDialogProps {
  runs: Run[]
  onClose: () => void
  onConfirm: () => void
}

/** Asks before runs leave My reviews: the reviewer should know they lock after seven days. */
export function ArchiveConfirmDialog({ runs, onClose, onConfirm }: ArchiveConfirmDialogProps) {
  const one = runs.length === 1 ? runs[0] : undefined
  return (
    <Modal
      title={one ? 'Move to the archive?' : `Move ${runs.length} runs to the archive?`}
      onClose={onClose}
      className="max-w-[32rem]"
    >
      <p className="text-body leading-relaxed text-text-primary">
        {one ? <>“{one.initiative}” leaves My reviews.</> : 'They leave My reviews.'} You can
        restore {one ? 'it' : 'them'} from the archive for {RESTORE_DAYS} days. After that{' '}
        {one ? 'it is' : 'they are'} locked, and a mistake can only be fixed with a new run.
      </p>
      {!one && (
        <ul className="flex flex-col gap-[var(--space-1)] text-body text-text-primary">
          {runs.map((run) => (
            <li key={run.id} className="truncate">
              {run.initiative}
            </li>
          ))}
        </ul>
      )}
      <Footer>
        <span className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          <Archive aria-hidden className="h-4 w-4" />
          Move to the archive
        </Button>
      </Footer>
    </Modal>
  )
}

export interface RestoreConfirmDialogProps {
  run: Run
  daysLeft: number
  onClose: () => void
  onConfirm: () => void
}

/** Asks before a run comes back from the archive. */
export function RestoreConfirmDialog({
  run,
  daysLeft,
  onClose,
  onConfirm,
}: RestoreConfirmDialogProps) {
  return (
    <Modal title="Restore to My reviews?" onClose={onClose} className="max-w-[32rem]">
      <p className="text-body leading-relaxed text-text-primary">
        “{run.initiative}” moves back to My reviews. Its decision and record stay exactly as they
        are. You have {daysLeft} day{daysLeft === 1 ? '' : 's'} left to restore it.
      </p>
      <Footer>
        <span className="flex-1" />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          <RotateCcw aria-hidden className="h-4 w-4" />
          Restore
        </Button>
      </Footer>
    </Modal>
  )
}
