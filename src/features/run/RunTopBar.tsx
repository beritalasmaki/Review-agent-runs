import { ChevronLeft } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { ThemeToggle } from '../../components/ThemeToggle'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'

/**
 * The page's own bar, directly under the host platform's navigation: a breadcrumb back to the
 * reviewer's list, and at its right end what is open before a decision (0053). No product logo,
 * no app name, no main menu — this page sits inside another platform that owns those
 * (docs/DECISIONS.md, 0042, 0076): the breadcrumb link is the only wayfinding this bar needs.
 * The three views of the run sit above the view they switch, in `RunViewTabs`
 * (docs/DECISIONS.md, 0052). A long initiative name truncates with the full name on hover; the
 * revision chip next to it never truncates, so two runs of the same initiative stay
 * distinguishable.
 *
 * Sticky at the top of the page, so the way back is always one click away
 * (docs/DECISIONS.md, 0044). `ref` lets the page measure its height, so headings scrolled to,
 * the view tabs and the sticky side column stay clear of it.
 */
export interface RunTopBarProps {
  run: Run
  reviewsHref: string
  /** Shown at the right end of the bar — the page puts what is open there before a decision
   * (docs/DECISIONS.md, 0053). */
  end?: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function RunTopBar({ run, reviewsHref, end, ref }: RunTopBarProps) {
  return (
    <div ref={ref} className="sticky top-0 z-20 border-b border-border-subtle bg-bg">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-6)]">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 md:flex-none">
          <ol className="flex min-w-0 items-center gap-[var(--space-2)] text-meta font-normal font-body text-text-secondary">
            <li className="shrink-0">
              <a
                href={reviewsHref}
                className="inline-flex items-center gap-[var(--space-1)] whitespace-nowrap text-primary no-underline underline-offset-2 hover:underline"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Back to the reviews list
              </a>
            </li>
            <li aria-hidden className="text-border">
              ›
            </li>
            <li className="flex min-w-0 items-center gap-[var(--space-2)]" aria-current="page">
              <span title={run.initiative} className="max-w-[22.5rem] truncate text-text-primary">
                {run.initiative}
              </span>
              <span className="shrink-0 rounded-sm border border-border-subtle bg-surface-raised px-[var(--space-2)] py-[var(--space-1)] font-mono text-caption leading-none font-medium whitespace-nowrap text-text-secondary">
                {run.revision}
              </span>
            </li>
          </ol>
        </nav>
        {/* Light or dark (0063). Beside the breadcrumb on narrow screens, at the far right
            from md. */}
        <ThemeToggle className={cn('md:order-last', end == null && 'md:ml-auto')} />
        {/* App name | breadcrumb on the first row; what is open at the right end from md, and on a
            row of its own under them on narrow screens. */}
        {end != null && <div className="w-full md:ml-auto md:w-auto">{end}</div>}
      </div>
    </div>
  )
}
