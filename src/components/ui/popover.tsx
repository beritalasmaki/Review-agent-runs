import * as React from 'react'
import { cn } from '@/lib/utils'
import { Popover as PopoverPrimitive } from 'radix-ui'

/*
 * shadcn/ui's Popover (Radix), restyled onto this project's tokens (docs/DECISIONS.md, 0070).
 * Added for the onboarding tour's step bubble (docs/DECISIONS.md, 0078): `PopoverAnchor` lets
 * the bubble position itself off a point that isn't the thing that opened it — the tour's
 * current spotlight target, not a trigger the visitor clicked — while Radix's own collision
 * detection keeps it on screen near a window edge.
 */

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 12,
  collisionPadding = 16,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 w-80 rounded-lg border border-border-subtle bg-surface p-[var(--space-4)] text-text-primary shadow-card outline-none',
          'origin-(--radix-popover-content-transform-origin) animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }
