import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

/*
 * shadcn/ui's Button, restyled onto this project's tokens (docs/DECISIONS.md, 0070): the same
 * API — `variant`, `size`, `asChild`, `buttonVariants` — with our type, spacing and colours in
 * place of shadcn's defaults. The colour rules still hold (src/styles/README.md): the decision
 * actions are never the brand colour. A red action is an outline on its own (`destructive`,
 * `DecisionPanel`'s standalone Reject) but a fill beside another button in a modal confirm
 * footer (`destructiveFill`, docs/DECISIONS.md 0113) — two different problems, not a reversal:
 * "never a reflex" next to a caption, "never a second secondary button" next to Cancel.
 *
 * No colour transition on most variants, on purpose: one on the line tabs made keyboard tests
 * drop key presses (docs/WORKLOG.md, 2026-09-24) — but that was a transition keyed to rapid
 * *automatic-activation* state changes from the keyboard. `outline`'s own hover fade (plus a
 * small grow) is keyed to `:hover`/`:focus-visible` only, pseudo-classes the mouse and keyboard
 * focus set directly, never a cascading React re-render from arrow-key navigation elsewhere, so
 * it cannot reproduce that bug — the same reasoning transitions.css's "Button shine" already
 * relies on for `default`/`ghost` (0083).
 *
 * The shine itself comes in two strengths (0120, transitions.css): `default`/`ghost` carry the
 * quiet `btn-shine-sm` (a small in-place fade) as their base, since most of what they're used
 * for is stepped through repeatedly (a tour's Next, a table row's Review) where the full
 * travelling sweep got old fast. A call site opts up to the full `btn-shine` only for a genuine
 * one-off, final action — Approve and release, Take the tour, Move to the archive — via an
 * explicit `className`; `destructiveFill`'s Reject-run confirm keeps `btn-shine` as its base,
 * since it's always exactly that kind of action.
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
         * stripe fades in on hover/focus — see transitions.css, "Button shine" — full-strength
         * only where a call site opts up to `btn-shine` for a one-off, final action (0120). */
        default: 'btn-shine-sm border-text-primary bg-text-primary text-surface hover:opacity-85',
        /** The quieter action beside it: Request changes, Cancel, Filters. A plain fade on
         * hover/focus (not the shine — it read poorly here), with a small grow. */
        outline:
          'border-border bg-surface text-text-primary transition duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:scale-[1.02] hover:border-text-secondary hover:bg-bg hover:shadow-card active:bg-surface-raised',
        /** `DecisionPanel`'s own standalone Reject run: a red outline, never a red fill
         * (docs/DECISIONS.md, 0039) — it sits under Approve with its own caption, not beside
         * another button, so staying quiet is what keeps Approve the one default-reflex action. */
        destructive:
          'border-status-fail bg-surface text-status-fail-tint-fg hover:bg-status-fail-tint-bg active:bg-status-fail-tint-bg',
        /** A modal confirm footer's destructive action (Reject run), beside Cancel: filled, so
         * it reads as the dialog's one primary action rather than a second secondary button
         * next to Cancel (docs/DECISIONS.md, 0113 — a narrower exception to 0039, scoped to the
         * confirm-footer pattern only). `text-destructive-foreground` is the shadcn-bridge pair
         * for `bg-destructive` (src/styles/index.css) — already defined to flip white-in-light/
         * near-black-in-dark, verified at 6.25:1 / 7.10:1 against this red. */
        destructiveFill:
          'btn-shine border-destructive bg-destructive text-destructive-foreground hover:opacity-85',
        ghost:
          'btn-shine-sm border-transparent bg-transparent text-text-primary hover:bg-surface-raised',
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
