import type { ComponentProps } from 'react'
import { cn } from '../lib/utils'

/**
 * The page's `<main>`, with a terrain-map backdrop behind its content (docs/DECISIONS.md, 0142):
 * shaded relief drawn by an SVG filter, a vignette so the edges fall away into the page colour,
 * and a few map coordinates that fade in and out like fog. The backdrop is the element's own
 * `::before` (styles/transitions.css), so it is not part of the DOM, never takes focus, and is
 * invisible to assistive technology. Cards are opaque surfaces, so text never relies on it. Dark
 * theme only; the coordinates stand still for `prefers-reduced-motion: reduce`.
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
