import { confidenceLevel } from '../../lib/confidence'
import type { ResolvedConfidenceArea } from '../../lib/confidence'
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

const CARD =
  'flex max-w-[45rem] flex-col gap-[var(--space-3)] rounded-[3px] border border-border-subtle bg-bg p-[var(--space-5)]'

const SEGMENTS = 30

/** The score as a row of small blocks, filled up to the value. Decoration: the percentage is text. */
function Segments({ value }: { value: number }) {
  const filled = Math.round(value * SEGMENTS)
  return (
    <div aria-hidden className="flex gap-[3px]">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <i
          key={i}
          className={cn(
            'h-[6px] flex-1 rounded-[1px]',
            i < filled ? 'bg-steel-bar' : 'bg-text-primary/15',
          )}
        />
      ))}
    </div>
  )
}

export function ScoreCard({ area, decided = false }: ScoreCardProps) {
  const areaLabel = formatConfidenceAreaLabel(area.area)

  if (area.missing) {
    return (
      <div
        id={scoreCardId(area.area)}
        tabIndex={-1}
        className={cn(CARD, LINK_TARGET, 'flex-row items-center')}
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
    <div id={scoreCardId(area.area)} tabIndex={-1} className={cn(CARD, LINK_TARGET)}>
      <span className="lbl">Confidence · {areaLabel}</span>
      {area.unverified.length > 0 && (
        <div className="flex flex-col gap-[var(--space-1)]">
          <span className="lbl text-status-waived">Could not verify</span>
          <p className="text-body leading-relaxed font-normal font-body text-text-primary">
            {area.unverified.join(' ')}
          </p>
        </div>
      )}
      <span className="flex flex-wrap items-baseline gap-[var(--space-3)]">
        <span
          className={cn(
            'text-score leading-none font-medium font-heading tabular-nums',
            level === 'low' ? 'text-status-fail' : 'text-text-primary',
          )}
        >
          <span className="sr-only">{areaLabel} confidence </span>
          {formatConfidencePercent(area.value)}
        </span>
        <span className="text-body font-semibold font-body text-text-primary">
          {formatConfidenceLevelLabel(level)}
        </span>
        {!decided && (
          <span className="text-meta font-normal font-body text-text-secondary">
            {formatConfidenceAction(level)}
          </span>
        )}
      </span>
      <Segments value={area.value} />
      <p className="text-meta leading-relaxed font-normal font-body text-text-secondary">
        {area.basis}
      </p>
      <details className="group text-meta font-body text-text-secondary">
        <summary className="sat w-fit font-medium">Why this score</summary>
        <p className="pt-[var(--space-1)]">{area.rationale}</p>
      </details>
    </div>
  )
}
