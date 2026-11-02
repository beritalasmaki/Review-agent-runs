import { buildOpenItems } from '../../lib/openItems'
import { spotlight } from '../../components/spotlight'
import type { Run } from '../../lib/types'

/**
 * How many things are open before a decision, at the right end of the page's top bar: a
 * yellow dot, "3 things to solve" and a link to the tick list in the decision panel
 * (docs/DECISIONS.md, 0053). The link scrolls to the list, spotlights it (0056) and focuses its first unticked item (0059); the `href`
 * still works without script. Nothing when nothing is open — the decision panel says so itself.
 * After a decision the page does not show it.
 */
export interface OpenItemsNoticeProps {
  run: Run
  /** Where "Jump to the open items" goes — the tick list in the decision panel. */
  href?: string
}

export function OpenItemsNotice({ run, href = '#open-items' }: OpenItemsNoticeProps) {
  const count = buildOpenItems(run).length
  if (count === 0) return null

  return (
    <p className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)] text-meta font-body">
      <span className="inline-flex items-center gap-[var(--space-2)] font-semibold text-text-primary">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-status-waived-dot" />
        {count === 1 ? '1 thing to solve' : `${count} things to solve`}
      </span>
      <a
        href={href}
        onClick={(event) => {
          const target = document.getElementById(href.slice(1))
          if (!target) return
          event.preventDefault()
          target.scrollIntoView({ block: 'start' })
          spotlight(target)
          // The spotlight is only seen. Focus goes to the first item still to tick, so a
          // keyboard or screen reader user lands where the work is (docs/DECISIONS.md, 0059).
          const boxes = target.querySelectorAll<HTMLElement>('[role="checkbox"]')
          const next =
            [...boxes].find((box) => box.getAttribute('aria-checked') !== 'true') ?? boxes[0]
          next?.focus({ preventScroll: true })
        }}
        className="-mx-[var(--space-2)] -my-[var(--space-1)] inline-block rounded-xs px-[var(--space-2)] py-[var(--space-1)] font-medium whitespace-nowrap text-primary transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:bg-primary-tint hover:text-primary-hover"
      >
        Jump to the open items →
      </a>
    </p>
  )
}
