import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

/*
 * shadcn/ui's Button, restyled to the satellite design (docs/DECISIONS.md, 0070, 0143): the same
 * API — `variant`, `size`, `asChild`, `buttonVariants` — with the design's shapes and colours.
 *
 * - `default`: the main action, a signal-orange plate with chamfered corners and a double inner
 *   ring (Review, Send to agent, Create report, Undo, the tour's Next). Never on a decision.
 * - `approve`: the same plate in status green. "Approve and release" only.
 * - `outline`: a quiet outlined button (Request changes, Cancel, Filters, Archive).
 * - `destructive`: Reject run, an outlined red. `destructiveFill`: the confirm footer's filled red.
 * - `ghost`, `link`: no box; `link` is the underlined link whose underline is swept by a short
 *   orange bar on hover and focus, a satellite pass (the `.sat` class, styles/index.css).
 *
 * The chamfer is `clip-path`, which would cut a focus outline off, so the plates draw their focus
 * outline inside the box (a negative offset). Colours fade; nothing grows or moves but the arrow.
 */
const PLATE =
  '[--c:7px] [clip-path:polygon(var(--c)_0,calc(100%-var(--c))_0,100%_var(--c),100%_calc(100%-var(--c)),calc(100%-var(--c))_100%,var(--c)_100%,0_calc(100%-var(--c)),0_var(--c))] border-0 rounded-none hover:brightness-[1.12] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white'

const SWEEP =
  "after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[linear-gradient(90deg,transparent,#fff_55%,transparent)] after:bg-[length:34%_100%] after:bg-[position:-40%_0] after:bg-no-repeat after:opacity-0 after:content-[''] hover:enabled:after:animate-[orbit_3.4s_linear_infinite] hover:enabled:after:opacity-100 focus-visible:after:animate-[orbit_3.4s_linear_infinite] focus-visible:after:opacity-100 motion-reduce:hover:enabled:after:animate-none motion-reduce:hover:enabled:after:[background-size:100%_100%] motion-reduce:hover:enabled:after:[background-position:0_0]"

const buttonVariants = cva(
  [
    'icon-motion relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border',
    'font-semibold font-body leading-tight whitespace-nowrap transition-[filter,background-color,border-color,color] duration-[var(--motion-duration-fast)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    'disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-raised disabled:text-text-disabled disabled:shadow-none disabled:hover:brightness-100',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: cn(
          PLATE,
          SWEEP,
          'bg-primary-strong text-primary-foreground shadow-[inset_0_0_0_3px_var(--color-primary-strong),inset_0_0_0_4px_rgb(20_10_4/0.38)] disabled:bg-surface-raised',
        ),
        approve: cn(
          PLATE,
          SWEEP,
          'bg-status-pass text-status-pass-ink shadow-[inset_0_0_0_3px_var(--color-status-pass),inset_0_0_0_4px_rgb(4_20_12/0.35)] disabled:bg-status-pass/12 disabled:text-status-pass-quiet',
        ),
        outline: cn(
          SWEEP,
          'border-border bg-transparent font-medium text-text-primary hover:enabled:brightness-125 hover:enabled:bg-surface-raised',
        ),
        destructive: cn(
          SWEEP,
          'border-status-fail bg-status-fail-tint-bg font-medium text-text-primary hover:enabled:brightness-125',
        ),
        destructiveFill:
          'border-status-fail bg-status-fail text-primary-foreground hover:enabled:brightness-110',
        ghost:
          'border-transparent bg-transparent font-medium text-text-primary hover:bg-surface-raised',
        link: 'sat rounded-none border-0 bg-transparent p-0 font-medium text-text-primary',
      },
      size: {
        default: 'min-h-[46px] gap-[9px] px-[18px] py-[10px] text-body',
        sm: 'min-h-[34px] gap-[7px] px-[14px] py-[6px] text-[14px] [--c:6px]',
        icon: 'h-8 min-h-0 w-8 p-0',
        /** No box at all, for `link` inside running text or under an item. */
        inline: 'min-h-0 gap-[var(--space-1)] border-0 px-0 py-0 pb-[4px] text-meta',
      },
    },
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
