import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '../../components/ThemeToggle'

/**
 * The one way back from a run: a link to the reviewer's list, and the theme switch (0063). It is
 * an ordinary row at the top of the page content — no bar, no logo, no fill, not fixed
 * (docs/DECISIONS.md, 0135, replacing 0042/0124–0134's top bar). The page scrolls as one piece,
 * so nothing sits on top of the cards, and the three columns below start at the same height.
 */
export interface RunPageNavProps {
  reviewsHref: string
  /** What is open before a decision (0053), shown beside the theme switch. */
  end?: ReactNode
}

export function RunPageNav({ reviewsHref, end }: RunPageNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center justify-between gap-[var(--space-4)] text-meta font-body"
    >
      <a
        href={reviewsHref}
        className="-mx-[var(--space-2)] inline-flex items-center gap-[var(--space-1)] rounded-xs px-[var(--space-2)] py-[var(--space-1)] whitespace-nowrap text-primary transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:bg-primary-tint hover:text-primary-hover"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        Back to the reviews list
      </a>
      <div className="flex items-center gap-[var(--space-4)]">
        {end}
        <ThemeToggle />
      </div>
    </nav>
  )
}
