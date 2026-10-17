import { MorphIcon as MorphIconPrimitive } from 'morphicons/react'
import type { MorphIconProps as MorphIconPrimitiveProps } from 'morphicons/react'

/**
 * An icon that morphs into a different one when its `icon` prop changes, instead of swapping
 * instantly (docs/DECISIONS.md, 0090) — built on `morphicons`, the one third-party visual engine
 * here besides `LoadingState`'s `thinking-orbs`. Icon data comes from the `lucide` package (icon
 * nodes), not `lucide-react` (components) — `morphicons` animates the underlying path data, so
 * it needs the data, not a rendered component: `<MorphIcon icon={open ? ChevronUp : ChevronDown} />`.
 *
 * `reducedMotion` always defaults to `"user"` here (morphicons' own default is `"never"`): under
 * `prefers-reduced-motion`, the icon jumps straight to its new shape instead of morphing, the
 * same guarantee every other `.t-*` animation in `transitions.css` already makes. Pass a
 * different value only to deliberately override it.
 */
export type MorphIconProps = MorphIconPrimitiveProps

export function MorphIcon({ reducedMotion = 'user', ...props }: MorphIconProps) {
  return <MorphIconPrimitive reducedMotion={reducedMotion} {...props} />
}
