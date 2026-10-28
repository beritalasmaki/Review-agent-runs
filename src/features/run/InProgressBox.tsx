import { Loader } from 'lucide-react'
import type { Run } from '../../lib/types'

/**
 * In the decision's place while the agent or the checks are still working (docs/DECISIONS.md,
 * 0066). There is nothing final to decide on yet, so the page offers no decision at all, and
 * says why and what happens next — in the same words as My reviews' Decision details.
 */
export interface InProgressBoxProps {
  run: Run
  reviewsHref: string
}

export function InProgressBox({ run, reviewsHref }: InProgressBoxProps) {
  const reason =
    run.status === 'checks_running'
      ? 'The agent has finished. The automatic checks are still running.'
      : 'The agent is still working on the change.'

  return (
    <div className="flex w-full flex-col gap-[var(--space-5)] rounded-lg bg-surface shadow-card-smoky p-[var(--space-4)]">
      <h2 className="flex items-center gap-[var(--space-2)] text-section-heading leading-none font-semibold font-heading text-text-primary">
        <Loader aria-hidden className="h-5 w-5 text-text-secondary" />
        Not ready for review yet
      </h2>
      <div className="flex flex-col gap-[var(--space-2)]">
        <p className="text-body font-normal font-body leading-relaxed text-text-primary">
          {reason}
        </p>
        <p className="text-caption font-normal font-body leading-relaxed text-text-secondary">
          You will get a message when the run is ready for you. Until then there is nothing to
          approve, send back or reject.
        </p>
      </div>
      <a href={reviewsHref} className="text-meta font-semibold font-heading text-primary underline">
        Back to my reviews
      </a>
    </div>
  )
}
