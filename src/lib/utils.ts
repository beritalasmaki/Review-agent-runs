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
 * `btn-shine`/`btn-shine-sm` (src/styles/transitions.css, docs/DECISIONS.md 0120) are the two
 * strengths of the button hover stripe: a call site opts up from the `default`/`ghost`
 * variants' quiet `btn-shine-sm` base to the full `btn-shine` sweep for a one-off, final action
 * by passing `className="btn-shine"`. Grouping both names together is what makes that `cn()`
 * call actually drop the variant's own `btn-shine-sm` instead of applying both at once — the
 * same "classes in one group are mutually exclusive, last one wins" mechanism `TYPE_SCALE`
 * above already relies on for `text-meta` vs. a colour class.
 */
const BUTTON_SHINE = ['btn-shine', 'btn-shine-sm']

const twMerge = extendTailwindMerge<'btn-shine'>({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SCALE }],
      'btn-shine': BUTTON_SHINE,
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
