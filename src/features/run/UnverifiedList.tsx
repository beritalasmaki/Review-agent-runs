import { CircleHelp } from 'lucide-react'
import { buildUnverifiedItems } from '../../lib/openItems'
import type { Run } from '../../lib/types'
import { InfoTip } from '../../components/InfoTip'
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
      className="flex flex-col gap-[var(--space-3)] panel p-[var(--space-5)]"
    >
      <div className="flex items-center gap-[var(--space-2)]">
        <SectionHeading
          id="unverified-heading"
          aside
          icon={CircleHelp}
          iconClassName="fill-text-secondary stroke-surface text-text-secondary"
        >
          {decided ? 'What is still unverified' : 'What is not checked'}
        </SectionHeading>
        <InfoTip label="this list">
          {decided
            ? 'Everything this decision was made without. This is the list to explain later.'
            : 'If you approve now, this is the list you would be accepting.'}
        </InfoTip>
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
              className="flex gap-[var(--space-3)] py-[var(--space-2)] text-meta font-normal font-body leading-relaxed text-text-primary"
            >
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
