import { confidenceLevel } from '../../lib/confidence'
import type { ConfidenceLevel, ResolvedConfidenceArea } from '../../lib/confidence'
import {
  formatConfidenceAction,
  formatConfidenceAreaLabel,
  formatConfidenceLevelLabel,
  formatConfidencePercent,
} from '../../lib/format'
import { cn } from '../../lib/utils'
import { LINK_TARGET, scoreCardId } from './openItemTargets'

/**
 * One confidence score, where it was made in the story. docs/DECISIONS.md, 0041: a percentage
 * is never read on its own. It comes with a level (High, Medium, Low), what the reviewer should
 * do about it, what it is based on, and what the agent could not check. The level is text and
 * colour together, never colour alone. The model's longer reasoning stays behind "Why this
 * score" (docs/spec-review-screen.md, Hierarchy: "Hidden until opened: the model's longer
 * reasoning").
 */
export interface ScoreCardProps {
  area: ResolvedConfidenceArea
  /** After a decision the action ("Check this yourself before approving") no longer applies. */
  decided?: boolean
}

const LEVEL_CHIP: Record<ConfidenceLevel, string> = {
  high: 'bg-status-pass-tint-bg text-status-pass-tint-fg',
  medium: 'bg-status-waived-tint-bg text-status-waived-tint-fg',
  low: 'bg-status-fail-tint-bg text-status-fail-tint-fg',
}

const CARD =
  'flex max-w-[45rem] gap-[var(--space-3)] rounded-md bg-surface-raised px-[var(--space-4)] py-[var(--space-3)]'

export function ScoreCard({ area, decided = false }: ScoreCardProps) {
  const areaLabel = formatConfidenceAreaLabel(area.area)

  if (area.missing) {
    return (
      <div
        id={scoreCardId(area.area)}
        tabIndex={-1}
        className={cn(CARD, LINK_TARGET, 'items-center')}
      >
        <span className="rounded-sm border border-border px-[var(--space-2)] py-[var(--space-1)] text-caption font-semibold font-heading whitespace-nowrap text-text-primary">
          Not checked
        </span>
        <p className="text-body font-normal font-body text-text-secondary">
          <span className="font-medium text-text-primary">{areaLabel}:</span> the agent gave no
          score for this area. Treat it as unknown.
        </p>
      </div>
    )
  }

  const level = confidenceLevel(area.value)

  return (
    <div
      id={scoreCardId(area.area)}
      tabIndex={-1}
      className={cn(CARD, LINK_TARGET, 'items-baseline')}
    >
      <span
        className={cn(
          'text-score font-semibold font-heading leading-none tabular-nums',
          level === 'low' ? 'text-status-waived-tint-fg' : 'text-text-primary',
        )}
      >
        <span className="sr-only">{areaLabel} confidence </span>
        {formatConfidencePercent(area.value)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
        <span className="flex flex-wrap items-center gap-[var(--space-2)]">
          <span
            className={cn(
              'rounded-sm px-[var(--space-2)] py-[var(--space-1)] text-caption font-semibold font-heading whitespace-nowrap',
              LEVEL_CHIP[level],
            )}
          >
            {formatConfidenceLevelLabel(level)}
          </span>
          {!decided && (
            <span className="text-meta font-semibold font-body text-text-primary">
              {formatConfidenceAction(level)}
            </span>
          )}
        </span>
        <p className="text-body font-normal font-body leading-relaxed text-text-secondary">
          <span className="font-medium text-text-primary">{areaLabel}.</span> {area.basis}
          {area.unverified.length > 0 && (
            <>
              {' '}
              <span className="font-medium text-text-primary">Could not check:</span>{' '}
              {area.unverified.join(' ')}
            </>
          )}
        </p>
        <details className="group text-meta font-body text-text-secondary">
          <summary className="-mx-[var(--space-2)] -my-[var(--space-1)] w-fit cursor-pointer rounded-xs px-[var(--space-2)] py-[var(--space-1)] font-medium text-primary transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:bg-primary-tint hover:text-primary-hover">
            Why this score
          </summary>
          <p className="pt-[var(--space-1)]">{area.rationale}</p>
        </details>
      </div>
    </div>
  )
}
