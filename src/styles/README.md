# styles

The design system's foundation: `tokens.css` and the Tailwind theme that exposes it.

**Tokens are named by meaning, not by appearance.** `--color-status-pass`, not
`--color-green-600`. The name says what it is for, so the value can change without every
component having to.

Two layers:

1. **Primitives** — the raw values: `--magenta-light`, `--neutral-3`. Plain custom properties,
   never Tailwind utilities.
2. **Semantic tokens** — what the product uses: `--color-primary`, `--color-status-pass`,
   `--color-surface-raised`, `--color-border-subtle`. Components only ever use these.

Both themes are defined here. Light is the default, because the reviewer often works in
bright, document-heavy environments; dark is available and the system preference is
respected on first load.

## Type

Raleway (500/600/700) for headings, buttons and the wordmark — `--font-heading`. Montserrat
(400/500) for body text and table/data text — `--font-body`. Both load via Google Fonts (see
`index.html`); neither varies by theme.

## Type scale

Exact sizes, weights and fonts, decided once — not a fresh judgment call per component.

| Token                     | Size  | Weight | Font                 | Used for                                             |
| ------------------------- | ----- | ------ | -------------------- | ----------------------------------------------------- |
| `--text-page-title`       | 28px  | 700    | `font-heading`        | The page identity element — one per page              |
| `--text-section-heading`  | 18px  | 600    | `font-heading`        | One per region: Policy gates, Audit log, Decision...  |
| `--text-item-title`       | 15px  | 600    | `font-body`           | A row's own title — a gate's rule name, an event title |
| `--text-body`             | 14px  | 400    | `font-body`           | Descriptions, sentences                               |
| `--text-meta`             | 13px  | 400    | `font-body`, always `--color-text-secondary` | Timestamps, "Evaluated by", counts |
| `--text-badge-label`      | 13px  | 600    | `font-heading`        | `StatusBadge`'s label text specifically               |
| `--text-lead`             | 16px  | 400    | `font-body`           | The story's running prose                             |
| `--text-caption`          | 12px  | 400    | `font-body`           | Field labels, helper text under a control, chips      |
| `--text-score`            | 22px  | 600    | `font-heading`        | A confidence percentage, the undo countdown           |

A new `--text-*` token must also be added to `TYPE_SCALE` in `src/lib/utils.ts`, or `cn()`
will drop it next to a colour class (docs/DECISIONS.md, 0043).

Each `--text-*` value is a real Tailwind utility (`text-item-title`, ...) — that namespace is
Tailwind's own for font-size. A single CSS property can't also carry a weight or a font, so
every use combines it with the matching `font-bold`/`font-semibold`/`font-normal` and
`font-heading`/`font-body` utility; a component never applies one of these sizes alone.
`--text-badge-label` names `StatusBadge` specifically (`docs/DECISIONS.md`, 0010).

## Spacing scale

4px base. Use only these eight values anywhere in the app — no literal px value, and not
Tailwind's own numeric spacing utilities (`gap-3`, `p-4`, ...) either, since nothing stops
those from drifting to a value outside this list.

| Token       | Value |
| ----------- | ----- |
| `--space-1` | 4px   |
| `--space-2` | 8px   |
| `--space-3` | 12px  |
| `--space-4` | 16px  |
| `--space-5` | 24px  |
| `--space-6` | 32px  |
| `--space-7` | 48px  |
| `--space-8` | 64px  |

Unlike the type scale, these are plain custom properties, not inside `@theme`: Tailwind's own
spacing namespace is `--spacing-*`, not `--space-*`, so nothing here auto-generates a utility.
Consumed through Tailwind's arbitrary-value syntax instead — `gap-[var(--space-3)]`,
`p-[var(--space-4)]` — the same way the motion tokens below already are. Common relationships:

- Between regions: `--space-7`
- A region's heading to its content, and between items in a list (two policy gates, two
  timeline events): `--space-3`
- Inside one item, part to part — icon to text, title to body to meta: `--space-2`

## Usage rules

- **Primary and accent are never used on Approve, Request changes or Reject.** Those three
  stay neutral. A brand colour on the decision actions would read as "the recommended
  option" or "the easy one," and the interface must never imply that (docs/spec-review-screen.md,
  Scenario S2; AGENTS.md non-negotiable 2).
- **Accent never resembles a status badge.** No check/cross icon on an accent element, and a
  different shape from a status chip — accent as an outline pill, status as a filled chip
  with icon + text. One is a brand colour, the other is a claim about a policy check; they
  must not be visually interchangeable.
- **Status is a separate palette from brand, and is never reused for non-status UI.** If
  something needs colour and it is not reporting a pass/fail/waived/not-applicable/unknown
  result, it does not get a status colour.
- **Status and accent colours are for the icon, border and swatch — never the text itself.**
  The label next to a status icon or inside an accent pill uses `--color-text-primary` or
  `--color-text-secondary`, not the status/accent colour. This is not a style preference: see
  the contrast numbers below. **One scoped exception:** `StatusBadge`'s `success`/`warning`
  tones are a filled tint (background, border, icon and text all the status colour) — see
  `StatusBadge.tsx`'s own doc comment and `docs/DECISIONS.md` for why, and why it stops at
  exactly those two tones. **Two more scoped exceptions** (docs/DECISIONS.md, 0041): the
  confidence level chip (High / Medium / Low, using the pass, waived and new fail tint pairs),
  and `--color-status-waived-tint-fg` as text for a "not run" count or a Low percentage.

## Contrast

Verified against every realistic pairing (WCAG relative-luminance formula, target 4.5:1 for
text). Full numbers were computed, not estimated — see `docs/DECISIONS.md`, 0005, for how.

- **Text tokens pass everywhere they're used.** `--color-text-primary` and
  `--color-text-secondary` clear 4.5:1 against `--color-bg`, `--color-surface` and
  `--color-surface-raised`, in both themes (5.4:1 to 18:1). The page itself is flat, true-grey,
  with no decorative gradient over it (docs/DECISIONS.md, 0073) — nothing for text to clear
  contrast against beyond the surface tokens above.
- **`--color-text-disabled` does not clear 4.5:1** (2.3–3.4:1 depending on theme and surface).
  Left as given: WCAG 1.4.3 does not require a minimum contrast for inactive UI text, and this
  token is not used for anything else.
- **`--color-status-pass` and `--color-status-not-applicable` fail 4.5:1 as literal text colour
  in light theme** (3.98:1 and 4.43:1 against `--color-surface-raised` respectively). This is
  exactly why the usage rule above exists: used for an icon or a border (WCAG's 3:1
  non-text threshold), both pass; used as running text, neither would. `--color-accent` (the
  chartreuse-lime, 0073) actually clears 4.5:1 even as text now (5.4–5.9:1 light, 9.5:1+ dark) —
  still unused by any component today, but unlike the old teal it would be exempt for this
  reason too, not just by the usage rule. In dark theme every status and brand colour clears
  4.5:1 even as text (5.4–10.5:1) — the dark-theme values were lightened with this in mind.
- **A filled primary (or destructive) surface needs different foreground text per theme.**
  White text on `--color-primary` passes in light (5.9:1) but fails in dark (2.5:1), because
  the dark-theme primary is deliberately lightened for its own contrast; near-black passes in
  dark (6.6:1) but fails in light (2.8:1). `--color-primary-foreground` (and
  `--color-destructive-foreground`, which reuses it) is defined to flip per theme rather than
  fixed to white — a real bug this check caught before it shipped.
- **`--color-border` and `--color-border-subtle` sit at 1.2–1.5:1 against every surface**, in
  both themes. Noted, not changed: borders aren't subject to the text-contrast rule, and these
  are the values given. Worth knowing if a border ever needs to carry meaning on its own — and
  why a container relying on fill contrast alone (not a border) can go invisible even when its
  *stated* contrast ratio looks adequate (docs/DECISIONS.md, 0072).

Motion tokens live here too, and motion is functional only: state changes, data arriving,
focus. `prefers-reduced-motion` is respected.

This folder is also the artefact a design agent could read. Keep it tidy and documented in
Storybook — that is the point of writing design decisions as code.

## transitions.css

Three transitions from transitions.dev (docs/DECISIONS.md, 0047): "Success check", "Tooltip
open/close" and "Tabs sliding". Each keeps its `.t-*` classes, its own motion variables, and
its `prefers-reduced-motion` guard. Colours come from the semantic tokens above. Change a
transition's feel through its variables (`--check-*`, `--tt-*`, `--tabs-*`), never by editing
the keyframes.

The welcome intro's colours (`--color-signature`, `--color-intro-*`) are in tokens.css. They are
the same in both themes on purpose, and are used by the intro only (0048).
