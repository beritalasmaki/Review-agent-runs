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

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE }],
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
