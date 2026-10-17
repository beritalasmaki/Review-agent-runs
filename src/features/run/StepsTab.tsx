import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { List } from 'lucide-react'
import { ChevronDown, ChevronUp } from 'lucide'
import { Fragment, useEffect, useRef, useState } from 'react'
import { MorphIcon } from '../../components/MorphIcon'
import { isSystemActor } from '../../lib/actors'
import { formatCalendarDate, formatClock, formatCount, formatUtcOffset } from '../../lib/format'
import { foldSteps, formatStepNumber, stepActor, stepResult } from '../../lib/steps'
import type { StepResultTone } from '../../lib/steps'
import { timelineShape } from '../../lib/timeline'
import type { Run, TimelineEvent } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { SectionHeading } from './SectionHeading'

/**
 * The "All N steps" tab: the audit log, one row per step (docs/spec-review-screen.md, Region 4:
 * "nothing is ever hidden, only collapsed"). A long run of the same repeated step folds into
 * one row that says how many steps it holds and opens in place. Errors and warnings never fold.
 */
export interface StepsTabProps {
  run: Run
  /** A step to bring into view — set when the reviewer followed a link from the story or the
   * evidence list. Its group opens, and the row is scrolled to and focused. */
  focusEventId?: string
}

/** How many rows of an opened group show before "Show N more". */
const PREVIEW_ROWS = 6

const RESULT_TONE: Record<StepResultTone, string> = {
  done: 'text-status-pass-tint-fg',
  attention: 'font-semibold text-status-waived-tint-fg',
  failed: 'font-semibold text-status-fail-tint-fg',
}

const CELL =
  'px-[var(--space-3)] py-[var(--space-3)] align-middle first:pl-[var(--space-4)] last:pr-[var(--space-4)]'

type GroupState = 'closed' | 'preview' | 'all'

export function StepsTab({ run, focusEventId }: StepsTabProps) {
  const rows = foldSteps(run.timeline)
  const total = run.timeline.length
  const shape = timelineShape(run.timeline)
  const [groups, setGroups] = useState<Record<number, GroupState>>({})
  const focusRef = useRef<HTMLTableRowElement>(null)

  // Following a link into a folded group opens the whole group, so the row exists to focus.
  // Done while rendering (React's "adjust state when a prop changes"), not in an effect, so
  // the group is already open when the focus effect below runs for the same link.
  const [prevFocus, setPrevFocus] = useState<string | undefined>(undefined)
  if (focusEventId !== prevFocus) {
    setPrevFocus(focusEventId)
    const group = rows.find(
      (row) => row.kind === 'group' && row.events.some((event) => event.id === focusEventId),
    )
    if (group && group.kind === 'group') {
      setGroups((current) => ({ ...current, [group.firstNumber]: 'all' }))
    }
  }

  useEffect(() => {
    if (!focusEventId) return
    focusRef.current?.scrollIntoView({ block: 'center' })
    focusRef.current?.focus({ preventScroll: true })
  }, [focusEventId, groups])

  function renderStep(event: TimelineEvent, number: number, nested = false) {
    const result = stepResult(event, run)
    const actor = stepActor(event, run)
    const focused = event.id === focusEventId
    const attention = result.tone !== 'done'
    return (
      <TableRow
        key={event.id}
        id={`step-${event.id}`}
        ref={focused ? focusRef : undefined}
        tabIndex={focused ? -1 : undefined}
        className={cn(
          'border-b border-border-subtle text-meta font-normal font-body text-text-primary',
          attention ? 'bg-status-waived-tint-bg/60' : nested ? 'bg-bg' : 'hover:bg-bg',
          focused && 'outline-2 -outline-offset-2 outline-focus-ring',
          nested && 'text-text-secondary',
        )}
      >
        <TableCell className={cn(CELL, 'font-mono text-text-secondary tabular-nums')}>
          {formatStepNumber(number, total)}
        </TableCell>
        <TableCell className={cn(CELL, 'text-text-secondary tabular-nums')}>
          {formatClock(event.at)}
        </TableCell>
        <TableCell className={cn(CELL, 'text-text-secondary')}>
          {isSystemActor(actor) ? actor : <ActorName name={actor} className="text-text-primary" />}
        </TableCell>
        <TableCell className={cn(CELL, '[overflow-wrap:anywhere]')}>
          {event.title}
          {event.detail && !nested && (
            <span className="block pt-[var(--space-1)] text-caption text-text-secondary">
              {event.detail}
            </span>
          )}
        </TableCell>
        <TableCell className={cn(CELL, RESULT_TONE[result.tone])}>{result.label}</TableCell>
      </TableRow>
    )
  }

  return (
    <section aria-labelledby="steps-heading" className="flex min-w-0 flex-col gap-[var(--space-4)]">
      <div className="flex flex-wrap items-end justify-between gap-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <SectionHeading id="steps-heading" focusTarget icon={List}>
            All {formatCount(total, 'step')}
          </SectionHeading>
          <p className="text-body font-normal font-body text-text-secondary">
            The full record, one row per step. {formatCount(shape.errors, 'error')},{' '}
            {formatCount(shape.retries, 'retry', 'retries')}.
          </p>
        </div>
        <span className="text-caption font-normal font-body text-text-secondary">
          {formatCalendarDate(run.startedAt)} · all times {formatUtcOffset(new Date(run.startedAt))}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-body font-normal font-body text-text-secondary">
          No steps yet. This run started at {formatClock(run.startedAt)}.
        </p>
      ) : (
        <Table
          containerClassName="rounded-lg border border-border-subtle bg-surface shadow-card"
          className="min-w-[40rem] table-fixed"
        >
          <colgroup>
            <col className="w-[5.5rem]" />
            <col className="w-[4.5rem]" />
            <col className="w-[10rem]" />
            <col />
            <col className="w-[7rem]" />
          </colgroup>
          <TableHeader className="border-b border-border-subtle bg-surface-raised text-caption font-semibold font-heading text-text-secondary">
            <TableRow>
              <TableHead scope="col" className={CELL}>
                #
              </TableHead>
              <TableHead scope="col" className={CELL}>
                Time
              </TableHead>
              <TableHead scope="col" className={CELL}>
                Who
              </TableHead>
              <TableHead scope="col" className={CELL}>
                What
              </TableHead>
              <TableHead scope="col" className={CELL}>
                Result
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              if (row.kind === 'step') return renderStep(row.event, row.number)

              const state = groups[row.firstNumber] ?? 'closed'
              const last = row.firstNumber + row.events.length - 1
              const visible =
                state === 'closed'
                  ? []
                  : state === 'all'
                    ? row.events
                    : row.events.slice(0, PREVIEW_ROWS)
              const actor = stepActor(row.events[0], run)
              const toggle = () =>
                setGroups((current) => ({
                  ...current,
                  [row.firstNumber]: state === 'closed' ? 'preview' : 'closed',
                }))

              return (
                <Fragment key={`group-${row.firstNumber}`}>
                  <TableRow className="border-b border-border-subtle bg-surface-raised text-meta font-normal font-body text-text-primary">
                    <TableCell className={cn(CELL, 'font-mono text-text-secondary tabular-nums')}>
                      {formatStepNumber(row.firstNumber, total, last)}
                    </TableCell>
                    <TableCell className={cn(CELL, 'text-text-secondary tabular-nums')}>
                      {formatClock(row.events[0].at)}
                    </TableCell>
                    <TableCell className={cn(CELL, 'text-text-secondary')}>{actor}</TableCell>
                    <TableCell className={CELL}>
                      <button
                        type="button"
                        aria-expanded={state !== 'closed'}
                        onClick={toggle}
                        className="flex w-full cursor-pointer items-center gap-[var(--space-2)] text-left hover:underline"
                      >
                        <MorphIcon
                          icon={state !== 'closed' ? ChevronUp : ChevronDown}
                          className="h-4 w-4 shrink-0 text-primary"
                        />
                        <span>
                          <b className="font-semibold">
                            {formatCount(row.events.length, 'similar step')}
                          </b>{' '}
                          · the same action repeated, from “{row.events[0].title}” to “
                          {row.events[row.events.length - 1].title}”
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className={cn(CELL, 'text-status-pass-tint-fg')}>
                      {row.events.length} done
                    </TableCell>
                  </TableRow>
                  {visible.map((event, index) => renderStep(event, row.firstNumber + index, true))}
                  {state === 'preview' && row.events.length > PREVIEW_ROWS && (
                    <TableRow className="border-b border-border-subtle bg-bg">
                      <TableCell colSpan={3} />
                      <TableCell
                        className={cn(CELL, 'text-meta font-medium font-body')}
                        colSpan={2}
                      >
                        <Button
                          variant="link"
                          size="inline"
                          onClick={() =>
                            setGroups((current) => ({ ...current, [row.firstNumber]: 'all' }))
                          }
                          className="text-[length:inherit] leading-[inherit] font-normal font-body"
                        >
                          Show {row.events.length - PREVIEW_ROWS} more
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
