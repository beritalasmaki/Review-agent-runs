import { ChartColumn } from 'lucide-react'
import { testsPassing, timelineShape } from '../../lib/timeline'
import type { Run } from '../../lib/types'

/**
 * "Run shape" — the run in five numbers, beside the story after a decision
 * (docs/spec-review-screen.md, Region 4: "First: the shape of the run — how many steps, where it
 * errored, where it retried"). Every number is counted from the timeline, never stored.
 */
export interface RunShapeProps {
  run: Run
}

export function RunShape({ run }: RunShapeProps) {
  const shape = timelineShape(run.timeline)
  const tests = testsPassing(run.timeline)
  const rows: [string, string][] = [
    ['Steps', String(shape.total)],
    ['Errors', String(shape.errors)],
    ['Retries', String(shape.retries)],
    ['Files changed', String(run.timeline.filter((event) => event.type === 'file_change').length)],
    ['Tests passing', tests == null ? 'unknown' : String(tests)],
  ]

  return (
    <section
      aria-labelledby="run-shape-heading"
      className="flex flex-col gap-[var(--space-2)] rounded-lg border border-border-subtle bg-surface shadow-card p-[var(--space-4)]"
    >
      <h2
        id="run-shape-heading"
        className="flex items-center gap-[var(--space-2)] text-meta font-semibold font-heading text-text-primary"
      >
        <ChartColumn aria-hidden className="h-4 w-4 text-text-primary" />
        Run shape
      </h2>
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between py-[var(--space-1)] text-meta font-normal font-body text-text-secondary"
          >
            <dt>{label}</dt>
            <dd className="text-text-primary tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
