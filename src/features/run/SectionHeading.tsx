import type { ComponentType, ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * The page's region heading: `--text-section-heading` with a leading icon for quick scanning.
 * The icon is in the brand colour by default; a heading about things left open ("What is not checked") passes
 * the warning colour instead. `id` is what the region's `aria-labelledby` points at.
 */
export interface SectionHeadingProps {
  id: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  iconClassName?: string
  className?: string
  /** The heading a view's tab moves focus to (`RunReviewPage`). Makes it focusable by script
   * only (`tabIndex={-1}`), and keeps it clear of the sticky top bar and view tabs when scrolled to. */
  focusTarget?: boolean
}

export function SectionHeading({
  id,
  icon: Icon,
  children,
  iconClassName,
  className,
  focusTarget = false,
}: SectionHeadingProps) {
  return (
    <h2
      id={id}
      tabIndex={focusTarget ? -1 : undefined}
      className={cn(
        focusTarget &&
          'scroll-mt-[calc(var(--run-bar-height,3rem)+var(--run-tabs-height,3.5rem)+var(--space-4))]',
        'flex items-center gap-[var(--space-3)] text-section-heading leading-tight font-semibold font-heading text-text-primary',
        className,
      )}
    >
      <Icon aria-hidden className={cn('h-5 w-5 shrink-0 text-text-primary', iconClassName)} />
      {children}
    </h2>
  )
}
