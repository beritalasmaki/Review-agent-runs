import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

/*
 * shadcn/ui's Button, restyled onto this project's tokens (docs/DECISIONS.md, 0070): the same
 * API — `variant`, `size`, `asChild`, `buttonVariants` — with our type, spacing and colours in
 * place of shadcn's defaults. The colour rules still hold (src/styles/README.md): the decision
 * actions are never the brand colour, and a red action is an outline, never a red fill.
 *
 * No colour transition, on purpose: one on the line tabs made keyboard tests drop key presses
 * (docs/WORKLOG.md, 2026-09-24).
 */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border',
    'font-semibold font-heading leading-none whitespace-nowrap',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    'disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-border-subtle disabled:text-text-disabled',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /** The page's main action: Approve and release, Review, Undo, Create report. A light
         * stripe sweeps across it on hover/focus — see transitions.css, "Button shine". */
        default: 'border-text-primary bg-text-primary text-surface hover:opacity-85',
        /** The quieter action beside it: Request changes, Cancel, Filters. */
        outline:
          'border-border bg-surface text-text-primary hover:border-text-secondary hover:bg-bg hover:shadow-card active:bg-surface-raised',
        /** Reject run: a red outline, never a red fill (src/styles/README.md). */
        destructive:
          'border-status-fail bg-surface text-status-fail-tint-fg hover:bg-status-fail-tint-bg active:bg-status-fail-tint-bg',
        ghost: 'border-transparent bg-transparent text-text-primary hover:bg-surface-raised',
        /** A button that reads as a link: "Show the checks →", "Retry", "Clear filters". */
        link: 'border-transparent bg-transparent text-primary underline-offset-2 hover:underline',
      },
      size: {
        default: 'gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-body',
        sm: 'gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] text-meta',
        icon: 'h-8 w-8',
        /** No box at all, for `link` inside running text or under an item. */
        inline: 'gap-[var(--space-1)] border-0 p-0 text-meta',
      },
    },
    compoundVariants: [
      // An icon-only outline button lights up in the brand colour, like the row actions.
      {
        variant: 'outline',
        size: 'icon',
        className: 'hover:border-primary hover:bg-surface hover:text-primary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      // `type="button"` by default: a Button inside a form must not submit it by accident.
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
