import type { ReactNode } from 'react'
import { ActorName } from './ActorName'
import { CURRENT_REVIEWER } from './currentReviewer'

/**
 * The bar across the top of every screen (docs/DECISIONS.md, 0143, replacing 0135's plain first
 * row): where you are on the left as a breadcrumb, who is reviewing on the right. It sticks to the
 * top and lets the terrain show faintly through. On a run it ends with "Open audit log" (`end`), which opens the All steps view. No logo, no menu, no
 * theme switch.
 */
export interface TopBarProps {
  /** The breadcrumb: a link back and/or the current page, as the page decides. */
  trail: ReactNode
  /** What follows "Reviewing as": "Open audit log" on a run. */
  end?: ReactNode
}

export function TopBar({ trail, end }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg/80 backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-x-[var(--space-5)] gap-y-[var(--space-3)] px-[var(--space-6)] py-[var(--space-3)]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-[var(--space-3)] text-body">
          {trail}
        </nav>
        <div className="flex flex-wrap items-center gap-[var(--space-4)]">
          <span className="inline-flex items-center gap-[var(--space-3)]">
            <span className="lbl">Reviewing as</span>
            <ActorName name={CURRENT_REVIEWER} />
          </span>
          {end}
        </div>
      </div>
    </header>
  )
}
