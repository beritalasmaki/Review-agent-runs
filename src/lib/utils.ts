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
 * `btn-glass` (src/styles/index.css, docs/DECISIONS.md 0092, 0098 — the `outline`-variant glass
 * button; `btn-glass-fill` was its filled-variant counterpart, removed in 0109) sets background-
 * color, border-color, border-radius, box-shadow and backdrop-filter in one custom class.
 * tailwind-merge doesn't know the name, so without this it would keep both the glass class and
 * whatever `bg-*`/`border-*`/`rounded-*` class a caller passes alongside it (the same class of
 * bug as `TYPE_SCALE` above, 0043) — which one actually painted would then depend on generated
 * CSS source order, not on which class appears later in the component. `conflictingClassGroups`
 * makes the two sides interchangeable either order: a glass class after a colour/radius class
 * drops that class, and a colour/radius class after a glass class drops the glass class — e.g.
 * the Filters button's open-state override (ReviewsToolbar.tsx) still wins over its own
 * `btn-glass`, and `btn-glass`'s own `border-radius: 9999px` still wins over `button.tsx`'s base
 * `rounded-md`.
 */
const GLASS_BUTTON = ['btn-glass']

/**
 * `btn-shine`/`btn-shine-sm` (src/styles/transitions.css, docs/DECISIONS.md 0120) are the two
 * strengths of the button hover stripe: a call site opts up from the `default`/`ghost`
 * variants' quiet `btn-shine-sm` base to the full `btn-shine` sweep for a one-off, final action
 * by passing `className="btn-shine"`. Grouping both names together is what makes that `cn()`
 * call actually drop the variant's own `btn-shine-sm` instead of applying both at once — the
 * same "classes in one group are mutually exclusive, last one wins" mechanism `TYPE_SCALE`
 * above already relies on for `text-meta` vs. a colour class.
 */
const BUTTON_SHINE = ['btn-shine', 'btn-shine-sm']

const twMerge = extendTailwindMerge<'glass-btn' | 'btn-shine'>({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE }],
      'glass-btn': GLASS_BUTTON,
      'btn-shine': BUTTON_SHINE,
    },
    conflictingClassGroups: {
      'glass-btn': ['bg-color', 'border-color', 'shadow', 'backdrop-blur', 'rounded'],
      'bg-color': ['glass-btn'],
      'border-color': ['glass-btn'],
      shadow: ['glass-btn'],
      'backdrop-blur': ['glass-btn'],
      rounded: ['glass-btn'],
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
