import * as React from 'react'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'

/*
 * shadcn/ui's Checkbox (Radix), restyled onto this project's tokens (docs/DECISIONS.md, 0070).
 * It is a `role="checkbox"` button, not an <input>: find it by role, and read `aria-checked`.
 * Inside a <label>, clicking the label text ticks it, and the label names it.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-border bg-surface text-primary-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        'disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-raised',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center"
      >
        <CheckIcon className="h-3 w-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
