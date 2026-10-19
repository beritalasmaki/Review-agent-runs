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
 * Fixed at the top of the viewport, not sticky (0119 — reversing 0117's revert): the way back is
 * always one click away (docs/DECISIONS.md, 0044). `ref` lets the page measure its height, so
 * `RunReviewPage` can pad its own content clear of it (a `position: fixed` bar takes no space in
 * flow, unlike `sticky`) and the view tabs and sticky side column still stick just below it.
 *
 * Glass (0117 tried this on `position: sticky`, hit a real test failure, and reverted to opaque;
 * 0119 tries again on `fixed` instead, which is what actually fixed it). `position: sticky` +
 * `backdrop-filter` made axe's color-contrast rule flag unrelated text elsewhere on the page —
 * not inside this bar, not even nearby — as "overlapped by another element." Switching to
 * `position: fixed` (with `RunReviewPage` padding its content to compensate for the bar no
 * longer reserving space in flow) resolved it: `fixed` is a stable, non-scrolling layer in a way
 * `sticky` fundamentally isn't (its own box never moves once the page has scrolled past its
 * start), which is exactly the property the accessibility suite's `ownContrast` helper already
 * special-cases. The real, measured contrast was fine throughout both attempts (14.2:1 light,
 * 13.5:1 dark on this bar's own text) — the earlier failure traced to the position type, not the
 * actual colours.
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
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-20 border-b border-glass-border bg-glass backdrop-blur-[var(--blur-glass)]"
    >
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-6)]">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 md:flex-none">
          <ol className="flex min-w-0 items-center gap-[var(--space-2)] text-meta font-normal font-body text-text-secondary">
            <li className="shrink-0">
              <a
                href={reviewsHref}
                className="inline-flex translate-y-[2px] items-center gap-[var(--space-1)] whitespace-nowrap text-primary no-underline underline-offset-2 hover:underline"
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
