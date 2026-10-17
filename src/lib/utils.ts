import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The type-scale sizes from src/styles/tokens.css (`--text-*`). tailwind-merge only knows
 * Tailwind's own size names, so without this it reads `text-meta` as a text *colour* and
 * silently drops it whenever a colour class such as `text-text-secondary` follows — the size
 * vanished from StatusBadge's tinted tones and from any row that set a size and a colour
 * together (docs/DECISIONS.md, 0043). Keep this list in step with tokens.css.
 */
const TYPE_SCALE = [
  'page-title',
  'section-heading',
  'item-title',
  'body',
  'meta',
  'badge-label',
  'lead',
  'caption',
  'score',
]

/**
 * `btn-glass`/`btn-glass-fill` (src/styles/index.css, docs/DECISIONS.md 0092) each set
 * background-color, border-color, box-shadow and backdrop-filter in one custom class.
 * tailwind-merge doesn't know either name, so without this it would keep both the glass class
 * and whatever `bg-*`/`border-*` class a caller passes alongside it (the same class of bug as
 * `TYPE_SCALE` above, 0043) — which one actually paints would then depend on generated CSS
 * source order, not on which class appears later in the component. `conflictingClassGroups`
 * makes the two sides interchangeable either order: a glass class after a colour class drops
 * the colour class, and a colour class after a glass class drops the glass class — e.g. the
 * Filters button's open-state override (ReviewsToolbar.tsx) still wins over its own `btn-glass`.
 */
const GLASS_BUTTON = ['btn-glass', 'btn-glass-fill']

const twMerge = extendTailwindMerge<'glass-btn'>({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE }],
      'glass-btn': GLASS_BUTTON,
    },
    conflictingClassGroups: {
      'glass-btn': ['bg-color', 'border-color', 'shadow', 'backdrop-blur'],
      'bg-color': ['glass-btn'],
      'border-color': ['glass-btn'],
      shadow: ['glass-btn'],
      'backdrop-blur': ['glass-btn'],
    },
  },
})

/**
 * Merge class names, letting a later Tailwind class win over an earlier one that
 * sets the same property. This is the helper every shadcn/ui component expects at
 * the `utils` alias in components.json.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
