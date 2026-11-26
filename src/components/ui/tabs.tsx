import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tabs as TabsPrimitive } from 'radix-ui'

/*
 * shadcn/ui's Tabs (Radix), restyled onto this project's tokens (docs/DECISIONS.md, 0070).
 * shadcn ships `default` and `line`; this project has three looks, as variants of both the
 * list and the trigger — pass the same one to each:
 * - `segmented`: a full-width bar, each tab an equal share, the selected one filled.
 * - `pill`: a compact rounded track; `components/Tabs.tsx` adds the sliding pill behind it.
 * - `line`: text tabs on a rule, the selected one underlined — for tabs that filter one list.
 */

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={className} {...props} />
}

const tabsListVariants = cva('', {
  variants: {
    variant: {
      segmented: 'flex divide-x divide-border-subtle border-y border-border-subtle',
      // No border or fill of its own by default (docs/DECISIONS.md, 0114) — the tabs float
      // directly on whatever surface the caller sits on; only the active tab gets a surface,
      // the sliding glass capsule behind it (components/Tabs.tsx). A caller with more than a
      // small, fixed set of views (My reviews' scrolling, badge-carrying status tabs) can still
      // restore a track via its own `className` (0115) — floating doesn't read as a single
      // control once there's a list long enough to need its own scroll affordance.
      pill: 'relative inline-flex gap-[var(--space-1)]',
      line: 'scrollbar-none flex gap-[var(--space-2)] overflow-x-auto border-b border-border-subtle px-[var(--space-5)] pt-[var(--space-3)]',
    },
  },
  defaultVariants: { variant: 'segmented' },
})

function TabsList({
  className,
  variant = 'segmented',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

const tabsTriggerVariants = cva(
  'icon-motion cursor-pointer items-center whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring',
  {
    variants: {
      variant: {
        segmented: [
          'flex flex-1 justify-center gap-[var(--space-2)] px-[var(--space-5)] py-[var(--space-3)]',
          'text-item-title font-semibold font-body text-text-secondary underline-offset-4',
          'bg-surface-raised transition-colors duration-[var(--motion-duration-fast)] hover:text-text-primary',
          'data-[state=active]:bg-surface data-[state=active]:text-text-primary',
          'focus-visible:relative focus-visible:z-10 focus-visible:outline-offset-[-2px]',
        ],
        pill: [
          't-tab inline-flex min-h-[var(--size-tab)] gap-[9px] rounded-[4px] px-[14px] py-[9px]',
          'text-body font-medium font-body leading-tight text-text-secondary',
          // The pressed tab is brighter and bolder; the sliding underline behind it
          // (components/Tabs.tsx) carries the orange. aria-selected, not data-state: a trigger
          // wrapped in Radix's Tooltip gets that tooltip's own data-state on the same node.
          'sweep hover:text-text-primary aria-selected:font-semibold aria-selected:text-text-primary focus-visible:outline-offset-2',
        ],
        // No -mb-px onto the list's rule: the list scrolls sideways, which clips anything below
        // its edge, and that clipped the selected tab's underline to nothing. No colour
        // transition either: one made keyboard tests drop arrow presses (docs/WORKLOG.md,
        // 2026-09-24). The active underline itself is `components/Tabs.tsx`'s `LineTabsList`,
        // a single sliding span (0084) — this trigger keeps the transparent border only as
        // layout spacing, so the sliding span's height never shifts anything, and keeps the
        // instant text-colour change as a state indicator that doesn't depend on the span
        // having measured yet.
        line: [
          'inline-flex gap-[var(--space-3)] border-b-2 border-transparent px-[var(--space-5)] py-[var(--space-4)]',
          'text-body font-semibold font-heading leading-none text-text-secondary',
          'sweep hover:text-text-primary',
          'data-[state=active]:text-text-primary',
          'focus-visible:outline-offset-[-2px]',
        ],
      },
    },
    defaultVariants: { variant: 'segmented' },
  },
)

function TabsTrigger({
  className,
  variant = 'segmented',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={className} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
