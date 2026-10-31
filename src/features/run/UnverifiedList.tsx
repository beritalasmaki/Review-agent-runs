import { TriangleAlert } from 'lucide-react'
import { buildUnverifiedItems } from '../../lib/openItems'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { SectionHeading } from './SectionHeading'

/**
 * Everything nobody has checked, kept on screen next to the decision. Before a decision it is
 * "What is not checked" — the list a reviewer accepts by approving. After one it is "What is
 * still unverified" — the list someone copies into a report when asked, weeks later, what the
 * reviewer knew. Items that need the reviewer's attention come first, marked in the warning
 * colour; smaller gaps follow in grey. Nothing here is ever collapsed.
 */
export interface UnverifiedListProps {
  run: Run
}

export function UnverifiedList({ run }: UnverifiedListProps) {
  const items = buildUnverifiedItems(run)
  const decided = run.decision != null

  return (
    <section
      aria-labelledby="unverified-heading"
      className="dither-edge dither-edge--unverified-list -m-[16px] flex flex-col gap-[var(--space-4)] p-[16px]"
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <SectionHeading
          id="unverified-heading"
          icon={TriangleAlert}
          iconClassName="text-status-waived"
        >
          {decided ? 'What is still unverified' : 'What is not checked'}
        </SectionHeading>
        <p className="text-meta font-normal font-body text-text-secondary">
          {decided
            ? 'Everything this decision was made without. This is the list to explain later.'
            : 'If you approve now, this is the list you would be accepting.'}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="pt-[var(--space-3)] text-meta font-normal font-body text-text-primary">
          Nothing. Every check ran and no score named something it could not check.
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-[var(--space-3)] py-[var(--space-3)] text-meta font-normal font-body leading-relaxed text-text-primary"
            >
              <span
                aria-hidden
                className={cn(
                  'mt-[var(--space-2)] h-1.5 w-1.5 shrink-0 rounded-full',
                  item.severity === 'open' ? 'bg-status-waived' : 'bg-border',
                )}
              />
              <span>
                <span className="sr-only">{item.severity === 'open' ? 'Open: ' : 'Minor: '}</span>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
