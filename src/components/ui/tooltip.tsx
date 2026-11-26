import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip as TooltipPrimitive } from 'radix-ui'

/*
 * shadcn/ui's Tooltip (Radix), restyled onto this project's tokens (docs/DECISIONS.md, 0070).
 * Radix opens it on hover and on keyboard focus, closes it on Escape without moving the
 * pointer, keeps it open while the pointer is on it (WCAG 1.4.13), keeps it inside the window,
 * and describes the trigger with it while it is open. Each `Tooltip` brings its own provider,
 * as newer shadcn versions do, so nothing has to be set up around the app.
 */

function TooltipProvider({
  delayDuration = 150,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  collisionPadding = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 w-max max-w-[230px] rounded-[4px] border border-border bg-bg px-[12px] py-[8px] shadow-[0_14px_30px_-8px_rgb(0_0_0/0.85)]',
          'text-meta leading-snug font-normal font-body tracking-normal text-text-primary normal-case',
          'origin-(--radix-tooltip-content-transform-origin) animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
