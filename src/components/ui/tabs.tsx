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
      pill: 'relative inline-flex gap-[var(--space-1)] border border-border-subtle bg-surface-raised p-[var(--space-2)]',
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
  'cursor-pointer items-center whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring',
  {
    variants: {
      variant: {
        segmented: [
          'flex flex-1 justify-center gap-[var(--space-2)] px-[var(--space-5)] py-[var(--space-3)]',
          'text-item-title font-semibold font-body text-text-secondary underline-offset-4',
          'bg-surface-raised transition-colors duration-[var(--motion-duration-fast)] hover:underline',
          'data-[state=active]:bg-surface data-[state=active]:text-text-primary',
          'focus-visible:relative focus-visible:z-10 focus-visible:outline-offset-[-2px]',
        ],
        pill: [
          't-tab inline-flex gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]',
          'text-meta font-semibold font-heading leading-none text-primary',
          // An inactive tab reads as an available choice, not a disabled one — brand-tinted at
          // full strength, not the plain grey `text-text-secondary` a disabled control would
          // use, and not a reduced-opacity version of the brand colour either (tried first; it
          // read as faded/inconsistent rather than a deliberate colour, and the translucency
          // also dropped the measured contrast below 4.5:1 in several states — real pixel
          // measurement caught it, not assumed). The active tab (`text-text-primary`, the
          // strongest contrast on the page) and the sliding pill behind it still carry the
          // "selected" signal on their own.
          //
          // aria-selected, not data-[state=active]: a pill trigger with a tooltip is wrapped in
          // Radix's Tooltip via `asChild` (components/Tabs.tsx's PillTrigger), which ends up
          // writing its own data-state (tooltip open/closed) onto the same DOM node — it wins,
          // so a selector keyed on data-state never matches once Tooltip's state settles.
          // aria-selected is Radix Tabs' own attribute; nothing else touches it.
          'hover:text-primary-hover aria-selected:text-text-primary focus-visible:outline-offset-2',
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
          'hover:border-border hover:text-text-primary',
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
