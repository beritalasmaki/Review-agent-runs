import { ArrowRightLeft, Check, Clock, X } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import type { ComponentType } from 'react'
import type { ReviewStage, ReviewStatus } from '../../lib/reviews'
import { STAGE_STEP, formatReviewStatus } from '../../lib/reviews'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'

/**
 * The small pieces My reviews repeats in every row (docs/DECISIONS.md, 0060): the run-type
 * pill, the run cell and the three-step progress of a pending run. Status is always
 * an icon and a word, never colour alone.
 */

const PILL: Record<
  ReviewStatus,
  {
    icon: ComponentType<{ className?: string }>
    variant: 'warning' | 'info' | 'danger' | 'success'
  }
> = {
  pending: { icon: Clock, variant: 'warning' },
  requested: { icon: ArrowRightLeft, variant: 'info' },
  declined: { icon: X, variant: 'danger' },
  approved: { icon: Check, variant: 'success' },
}

export function ReviewStatusPill({ status, label }: { status: ReviewStatus; label?: string }) {
  const { icon: Icon, variant } = PILL[status]
  return (
    <Badge
      variant={variant}
      className="justify-self-start py-[var(--space-1)] pr-[var(--space-3)] pl-[var(--space-2)] text-caption leading-snug font-heading"
      size="sm"
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {label ?? formatReviewStatus(status)}
    </Badge>
  )
}

/** Three short bars: done steps in the brand colour, the current one lighter, or amber when
 * it is the reviewer's turn. Decorative next to the stage's own words. */
export function StageSteps({ stage, className }: { stage: ReviewStage; className?: string }) {
  const step = STAGE_STEP[stage]
  return (
    <span aria-hidden className={cn('flex w-24 gap-[var(--space-1)]', className)}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            n < step
              ? 'bg-primary-strong'
              : n === step
                ? stage === 'review'
                  ? 'bg-status-waived'
                  : 'bg-primary-strong/50'
                : 'bg-border-subtle',
          )}
        />
      ))}
    </span>
  )
}

/** The run's name as a link to its review, with its reference, service and environment. */
export function RunCell({ run, href }: { run: Run; href: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
      <a
        href={href}
        title={run.initiative}
        className="truncate text-body leading-snug font-semibold font-body text-text-primary max-w-full underline decoration-text-primary/30 underline-offset-[6px] hover:decoration-text-primary"
      >
        {run.initiative}
      </a>
      {/* Only the run's reference under its title: the one thing a reviewer quotes to find the
          case again. The system and environment are on the run page (docs/DECISIONS.md, 0067). */}
      <span className="truncate font-mono text-caption text-text-secondary">{run.id}</span>
    </div>
  )
}
