import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

/*
 * shadcn/ui's Badge, restyled onto this project's tokens (docs/DECISIONS.md, 0070): every
 * rounded chip — a status, a count, an environment. A status badge always carries an icon or
 * a word as well as its colour (src/styles/README.md); `StatusBadge` and `ReviewStatusPill`
 * see to that.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-[var(--space-2)] rounded-full border font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-raised text-text-primary',
        outline: 'border-border bg-transparent text-text-primary',
        /** A quiet count beside a label: "Archive 4". */
        muted: 'border-transparent bg-text-primary/14 text-text-primary',
        /** A count that belongs to the selection or a filter. */
        primary: 'border-transparent bg-primary text-primary-foreground',
        'primary-tint': 'border-transparent bg-primary-tint text-primary',
        success: 'border-status-pass/60 bg-status-pass-tint-bg text-status-pass-tint-fg',
        warning: 'border-status-waived/60 bg-status-waived-tint-bg text-status-waived-tint-fg',
        danger: 'border-status-fail/60 bg-status-fail-tint-bg text-status-fail-tint-fg',
        info: 'border-status-unknown/50 bg-status-info-tint-bg text-status-info-tint-fg',
      },
      size: {
        default: 'py-[3px] pr-[11px] pl-[6px] text-badge-label font-body [&>svg]:h-4 [&>svg]:w-4',
        sm: 'h-5 min-w-[22px] justify-center px-[7px] text-caption font-semibold font-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
