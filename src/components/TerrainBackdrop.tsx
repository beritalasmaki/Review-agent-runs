import type { ComponentProps } from 'react'
import { cn } from '../lib/utils'

/**
 * The page's `<main>`, with a living terrain-map backdrop behind its content (docs/DECISIONS.md,
 * 0142, 0143, 0146): shaded relief, parcels, roads and ruler ticks, and five small glowing points that
 * move along long, faint orbits across the page, all in one SVG painted by the element's own
 * `::before`; and two slow patches of mist drifting over it, painted by `::after`
 * (styles/index.css).
 *
 * Nothing here is an element or a text node: the accessibility tools measure text against any element
 * that overlaps it, and a decorative layer of spans made that impossible. With
 * `prefers-reduced-motion: reduce` the mist and the points stand still. Cards are
 * opaque surfaces, so text never relies on the backdrop.
 */
export function TerrainBackdrop({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-testid="terrain-backdrop"
      className={cn('terrain-page relative isolate min-h-screen bg-bg', className)}
      {...props}
    />
  )
}
