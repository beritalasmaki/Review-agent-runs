import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

/**
 * A small "i" button that explains the label next to it, on shadcn/ui's Tooltip (Radix —
 * docs/DECISIONS.md, 0070): the text shows on hover and on keyboard focus, and screen readers
 * hear it as the button's description. Escape hides it without moving the pointer, and it
 * stays inside the window on its own (WCAG 1.4.13).
 */
export interface InfoTipProps {
  /** What the tip is about — the button reads "About <label>". */
  label: string
  children: string
  /** `end`: the tip lines up with the button's right edge, for columns at the right edge. */
  align?: 'start' | 'end'
  className?: string
}

export function InfoTip({ label, children, align = 'start', className }: InfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`About ${label}`}
          className={cn(
            'h-4 w-4 cursor-help rounded-full border-border text-caption leading-none text-text-secondary hover:text-text-primary',
            className,
          )}
        >
          i
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align={align}>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
