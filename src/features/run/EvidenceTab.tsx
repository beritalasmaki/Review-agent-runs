import { Button } from '../../components/ui/button'
import { isSystemActor } from '../../lib/actors'
import { buildEvidenceGroups } from '../../lib/evidence'
import type { EvidenceKind } from '../../lib/evidence'
import { formatClock } from '../../lib/format'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { SectionHeading } from './SectionHeading'

/**
 * The Evidence tab: every file change, test run, check result and finding the page's claims
 * rest on, grouped by what it supports (AGENTS.md non-negotiable 3: "no claim without a
 * source"). Checks that failed or did not run stay highlighted here too. "Open" jumps to the
 * step in the full record, where nothing is left out.
 */
export interface EvidenceTabProps {
  run: Run
  onOpenStep: (eventId: string) => void
}

const ATTENTION_KIND: Partial<Record<EvidenceKind, string>> = {
  'Not run': 'bg-status-waived-tint-bg text-status-waived-tint-fg',
  Note: 'bg-status-waived-tint-bg text-status-waived-tint-fg',
  'Failed check': 'bg-status-fail-tint-bg text-status-fail-tint-fg',
  Error: 'bg-status-fail-tint-bg text-status-fail-tint-fg',
}

export function EvidenceTab({ run, onOpenStep }: EvidenceTabProps) {
  const groups = buildEvidenceGroups(run)

  return (
    <section
      aria-labelledby="evidence-heading"
      className="flex min-w-0 flex-col gap-[var(--space-7)]"
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <SectionHeading id="evidence-heading" focusTarget>
          Evidence
        </SectionHeading>
        <p className="max-w-[45rem] text-body font-normal font-body text-text-secondary">
          Every file, test run and check result the claims on this page are based on, grouped by
          what they support.
        </p>
      </div>

      {groups.length === 0 && (
        <p className="text-body font-normal font-body text-text-secondary">
          No evidence has been recorded for this run yet.
        </p>
      )}

      {groups.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`evidence-${group.id}`}
          className="dither-edge dither-edge--evidence-group -m-[16px] p-[16px]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)] bg-surface-raised px-[var(--space-4)] py-[var(--space-3)]">
            <h3
              id={`evidence-${group.id}`}
              className="text-body font-semibold font-heading text-text-primary"
            >
              {group.title}
            </h3>
            <span
              className={cn(
                'text-caption font-normal font-body',
                group.supportsAttention ? 'text-status-waived-tint-fg' : 'text-text-secondary',
              )}
            >
              Supports: {group.supports}
            </span>
          </div>
          <ul>
            {group.rows.map((row) => (
              <li
                key={row.event.id}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]',
                  'md:grid-cols-[7rem_minmax(0,1fr)_3.5rem_3.5rem]',
                  row.attention ? 'bg-status-waived-tint-bg/60' : 'hover:bg-bg',
                )}
              >
                <span
                  className={cn(
                    'justify-self-start rounded-sm px-[var(--space-2)] py-[var(--space-1)] text-caption font-semibold font-heading whitespace-nowrap',
                    ATTENTION_KIND[row.kind] ?? 'bg-surface-raised text-text-secondary',
                  )}
                >
                  {row.kind}
                </span>
                <div className="col-span-2 flex min-w-0 flex-col gap-[var(--space-1)] md:col-span-1">
                  <span className="text-body font-normal font-body text-text-primary">
                    {row.event.title}
                  </span>
                  {row.event.detail && (
                    <span className="text-meta font-normal font-body text-text-secondary">
                      {row.event.detail}
                    </span>
                  )}
                  <span className="flex flex-wrap items-center gap-[var(--space-2)] text-caption font-normal font-body text-text-secondary">
                    By{' '}
                    {isSystemActor(row.actor) ? (
                      row.actor
                    ) : (
                      <ActorName name={row.actor} className="text-text-primary" />
                    )}
                  </span>
                </div>
                <span className="row-start-1 justify-self-end text-caption font-normal font-body text-text-secondary tabular-nums md:row-start-auto md:justify-self-start">
                  {formatClock(row.event.at)}
                </span>
                <Button
                  variant="link"
                  size="inline"
                  onClick={() => onOpenStep(row.event.id)}
                  aria-label={`Open step: ${row.event.title}`}
                  className="justify-self-start font-medium font-body md:justify-self-end"
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}
