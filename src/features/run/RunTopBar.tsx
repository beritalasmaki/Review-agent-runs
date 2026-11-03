import { ChevronLeft } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { LogoLabel } from '../../components/LogoLabel'
import { ThemeToggle } from '../../components/ThemeToggle'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'

/**
 * The page's own bar, directly under the host platform's navigation (docs/DECISIONS.md, 0042/
 * 0076, which no longer applies): the app's own wordmark, cut as a hole through this bar's own
 * glass fill (`topnav-logo-cutout`, 0125/0126), a breadcrumb back to the reviewer's list, and at
 * its right end what is open before a decision (0053) — all one row (0125, replacing 0124's
 * separate `TopNav` bar above this one: a logo stacked in a bar of its own, apart from the rest of
 * this page's own navigation, read as unorganised rather than part of it). The three views of the
 * run sit above the view they switch, in `RunViewTabs` (docs/DECISIONS.md, 0052). A long
 * initiative name truncates with the full name on hover; the revision chip next to it never
 * truncates, so two runs of the same initiative stay distinguishable.
 *
 * `bg-glass`/`backdrop-blur`/`border-glass-border` moved off this bar's own `className` and onto
 * `topnav-logo-cutout`'s `::before` (0126): the wordmark is a hole cut through *this bar's own*
 * fill, not a second glass layer stacked on top of it reading as a box of its own — see
 * `src/styles/index.css` for why that distinction matters. The row of real content below keeps
 * `relative z-[1]` to stay stacked above that `::before` fill (`z-index: 0`), the same ordering it
 * already had visually before this fill moved onto a pseudo-element. `shadow-glass-lg` sits on
 * this host element, not the pseudo — independent of the mask, it gives the whole bar a cast
 * shadow onto the page below it (0127 — "add some border shadow or something to make the top
 * navigation pop out"), the same elevation every other glass card in the app already carries.
 *
 * `topnav-logo-sm` (0127, `src/styles/index.css`) shrinks the logo's own box for this placement
 * specifically — sharing a row with the breadcrumb left much less room than the full-width bar
 * 0124 first gave it. The reserved spacer below is sized to exactly the logo's own footprint
 * (inset plus width, no extra margin of its own), so the breadcrumb sits right next to it — the
 * row's ordinary `gap-x-[var(--space-4)]` is the only space between them (0129 — "move the 'Go
 * back to' link next to the logo"), the same gap every other pair of items in this row already
 * has, not a special-cased wider one.
 *
 * Fixed at the viewport's own top, not sticky (0119): the way back is always one click away
 * (docs/DECISIONS.md, 0044). `ref` lets the page measure its height, so `RunReviewPage` can pad
 * its own content clear of it (a `position: fixed` bar takes no space in flow, unlike `sticky`)
 * and the view tabs and sticky side column still stick just below it.
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
      className="topnav topnav-logo-cutout topnav-logo-start topnav-logo-sm fixed inset-x-0 top-0 z-20 border-b border-glass-border shadow-glass-lg"
    >
      <LogoLabel />
      <span aria-hidden className="topnav-logo-glow" />
      <div className="relative z-[1] mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] md:px-[var(--space-6)]">
        <span aria-hidden className="h-px shrink-0 basis-[calc(var(--topnav-logo-width)+var(--space-4))]" />
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 md:flex-none">
          <ol className="flex min-w-0 items-center gap-[var(--space-2)] text-meta font-normal font-body text-text-secondary">
            <li className="shrink-0">
              <a
                href={reviewsHref}
                className="-mx-[var(--space-2)] -my-[var(--space-1)] inline-flex translate-y-[2px] items-center gap-[var(--space-1)] rounded-xs px-[var(--space-2)] py-[var(--space-1)] whitespace-nowrap text-primary transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:bg-primary-tint hover:text-primary-hover"
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
