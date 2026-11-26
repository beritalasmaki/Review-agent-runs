import { ChevronRight } from 'lucide-react'
import { InfoTip } from '../../components/InfoTip'
import type { Ref } from 'react'
import { confidenceLevel, resolveConfidenceAreas } from '../../lib/confidence'
import {
  formatCalendarDate,
  formatClock,
  formatClockRange,
  formatConfidenceAreaLabel,
  formatConfidencePercent,
  formatCount,
  formatElapsed,
  formatUtcOffset,
} from '../../lib/format'
import { noResultLabel } from '../../lib/gates'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'

/**
 * "Run details" — the left-hand column (docs/DECISIONS.md, 0046). Every labelled fact about
 * the run, in two groups: *The change* (where it would go, what would be released, the run
 * reference) and *The run* (who asked, which agent, when, checks, lowest score). Each id has a
 * plain line under it, so a reviewer never has to guess what it is for. The environment is
 * always written out in text, never colour alone (Scenario S6).
 *
 * `className`, `tabIndex` and `ref` let the page make the card scroll on its own in the
 * sticky left column (docs/DECISIONS.md, 0054).
 */
export interface RunDetailsProps {
  run: Run
  className?: string
  tabIndex?: number
  ref?: Ref<HTMLElement>
}

const ENVIRONMENT = {
  production: { dot: 'bg-status-fail', help: 'The live system. Real customers use it.' },
  staging: {
    dot: 'bg-status-waived',
    help: 'A test copy of the system. No real customers use it.',
  },
  dev: { dot: 'bg-status-not-applicable', help: 'A developer copy. No real customers use it.' },
} as const

const LABEL = 'lbl leading-none'
const VALUE = 'text-body font-medium font-body leading-snug text-text-primary'
const HELP = 'text-meta font-normal font-body leading-relaxed text-text-secondary'

function Field({
  label,
  tip,
  children,
}: {
  label: string
  /** The plain line that explains this field, behind a small "i" beside its label. */
  tip?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-[var(--space-2)] py-[var(--space-3)]">
      <dt className="flex items-center gap-[var(--space-1)]">
        <span className={LABEL}>{label}</span>
        {tip && <InfoTip label={label.toLowerCase()}>{tip}</InfoTip>}
      </dt>
      <dd className="flex flex-col items-start gap-[var(--space-1)]">{children}</dd>
    </div>
  )
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export function RunDetails({ run, className, tabIndex, ref }: RunDetailsProps) {
  const released = run.decision?.outcome === 'approved'
  const decided = run.decision != null
  const env = ENVIRONMENT[run.target.environment]
  const passed = run.gates.filter((gate) => gate.result === 'pass').length
  const failed = run.gates.filter((gate) => gate.result === 'fail').length
  const notRun = run.gates.filter((gate) => gate.result === 'unknown').length
  const waived = run.gates.filter((gate) => gate.result === 'waived').length
  const notApplicable = run.gates.filter((gate) => gate.result === 'not_applicable').length
  // The `missing` check in the comparator never fires (the filter already dropped those); it
  // is there because the filter does not narrow the type, and only a present area has `value`.
  const lowest = resolveConfidenceAreas(run.confidence)
    .filter((area) => !area.missing)
    .sort((a, b) => (a.missing || b.missing ? 0 : a.value - b.value))[0]

  const duration = run.finishedAt
    ? formatElapsed(new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime())
    : 'Still running'

  return (
    <section
      ref={ref}
      tabIndex={tabIndex}
      aria-labelledby="run-details-heading"
      className={cn('flex flex-col gap-[var(--space-2)] panel p-[var(--space-5)]', className)}
    >
      <h2 id="run-details-heading" className="lbl pb-[var(--space-2)]">
        Run details
      </h2>

      <dl className="flex flex-col">
        <Field label="Environment" tip={env.help}>
          <span className="text-section-heading leading-tight font-semibold font-heading text-primary">
            {capitalise(run.target.environment)}
          </span>
        </Field>
        <Field label={released ? 'Target system' : 'Target system'}>
          <span className={VALUE}>{run.target.system}</span>
        </Field>
        <Field label="Requested by">
          <ActorName name={run.requestedBy} className={cn(VALUE, 'whitespace-nowrap')} />
        </Field>
        <Field label="Ran">
          <span className={VALUE}>
            {formatCalendarDate(run.startedAt)} ·{' '}
            {run.finishedAt
              ? formatClockRange(run.startedAt, run.finishedAt)
              : `from ${formatClock(run.startedAt)}`}{' '}
            ({formatUtcOffset(new Date(run.startedAt))})
          </span>
          <span className={HELP}>Duration {duration}</span>
        </Field>
        <Field
          label={released ? 'Released revision' : 'Revision'}
          tip={
            decided
              ? 'The exact version of the code this decision applied to.'
              : 'The exact version this decision applies to.'
          }
        >
          <span className={cn(VALUE, 'font-mono')}>{run.decision?.revision ?? run.revision}</span>
        </Field>
      </dl>

      <details className="group">
        <summary className="sat cursor-pointer list-none text-meta font-medium">
          <ChevronRight
            aria-hidden
            className="mr-[var(--space-1)] inline h-4 w-4 align-[-3px] transition-transform group-open:rotate-90"
          />
          More details
        </summary>
        <dl className="flex flex-col pt-[var(--space-2)]">
          <Field label="Run reference" tip="Quote this to find the review again later.">
            <span className={cn(VALUE, 'font-mono')}>{run.id}</span>
          </Field>
          <Field label="Agent">
            <span className={VALUE}>
              {run.agent.name} {run.agent.version}
            </span>
            <span className="font-mono text-caption text-text-secondary">{run.agent.model}</span>
          </Field>
          <Field label="Checks">
            <span className={VALUE}>
              {passed} passed
              {failed > 0 && <span className="text-status-fail-tint-fg"> · {failed} failed</span>}
              {notRun > 0 && (
                <span className="text-status-waived-tint-fg">
                  {' '}
                  · {notRun} {noResultLabel(run.status)}
                </span>
              )}
            </span>
            {(waived > 0 || notApplicable > 0) && (
              <span className={HELP}>
                {[
                  waived > 0 ? formatCount(waived, 'exception') : null,
                  notApplicable > 0 ? `${notApplicable} does not apply` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </Field>
          <Field label="Lowest score">
            {lowest && !lowest.missing ? (
              <span className={VALUE}>
                {formatConfidenceAreaLabel(lowest.area)} ·{' '}
                <span
                  className={
                    confidenceLevel(lowest.value) === 'low'
                      ? 'text-status-waived-tint-fg'
                      : undefined
                  }
                >
                  {formatConfidencePercent(lowest.value)}
                </span>
              </span>
            ) : (
              <span className={VALUE}>No scores reported</span>
            )}
          </Field>
        </dl>
      </details>
    </section>
  )
}
