/**
 * The plain line that explains the label or title it sits beside. It is read by screen readers and
 * not shown (docs/DECISIONS.md, 0149): the small "i" with a tooltip that showed it (0070, 0148) was
 * taken out, because the little rings distracted from the page. The text stays in the page, so
 * nothing is lost for assistive technology. Knows nothing about the product.
 */
export interface InfoTipProps {
  /** What the line is about. Kept so call sites read as before; the text itself is `children`. */
  label?: string
  children: string
  /** Kept for call sites that placed the old tooltip; has no effect now. */
  align?: 'start' | 'end'
  className?: string
}

export function InfoTip({ children, className }: InfoTipProps) {
  return <span className={className ? `sr-only ${className}` : 'sr-only'}>{children}</span>
}
