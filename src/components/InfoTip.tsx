import { Info } from 'lucide-react'
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
          variant="ghost"
          size="icon"
          aria-label={`About ${label}`}
          className={cn(
            'h-4 min-h-0 w-4 cursor-help rounded-full p-0 text-text-secondary hover:enabled:bg-transparent hover:enabled:text-text-primary',
            className,
          )}
        >
          <Info aria-hidden className="h-3 w-3" strokeWidth={1.7} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align={align}>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
