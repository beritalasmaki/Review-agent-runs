# styles

The design system's foundation: `tokens.css` and the Tailwind theme that exposes it.

**Tokens are named by meaning, not by appearance.** `--color-status-pass`, not
`--color-green-600`. The name says what it is for, so the value can change without every
component having to.

Two layers:

1. **Primitives** — the raw values: `--ink-1`, `--orange`, `--st-pass`. Plain custom properties,
   deliberately not inside `@theme`, so they never become Tailwind utilities. Components must
   not use them.
2. **Semantic tokens** — what the product uses: `--color-primary`, `--color-status-pass`,
   `--color-surface-raised`, `--color-border-subtle`. Components only ever use these.

There is one theme: dark (docs/DECISIONS.md, 0143, which also removed the light theme and its
switch that 0063 and 0142 had kept). The palette is the satellite design's — warm black
surfaces, one signal orange, steel for people, four status colours — and `check-theme-bridge`
still checks every semantic token resolves in a real browser.

## Type

Chakra Petch (500/600/700) for headings, labels and the wordmark — `--font-heading`. Hanken
Grotesk (400/500/600) for body text, buttons and table/data text — `--font-body`. Both load via
Google Fonts (see `index.html`).

## Type scale

Exact sizes, weights and fonts, decided once — not a fresh judgment call per component.

| Token                     | Size  | Weight | Font                 | Used for                                             |
| ------------------------- | ----- | ------ | -------------------- | ----------------------------------------------------- |
| `--text-page-title`       | 44px  | 700    | `font-heading`        | The page identity element — one per page              |
| `--text-run-title`        | 32px  | 600    | `font-heading`        | A run's title on its own page                         |
| `--text-section-heading`  | 22px  | 600    | `font-heading`        | One per region: Run details, Your decision...         |
| `--text-item-title`       | 16px  | 600    | `font-body`           | A row's own title — a gate's rule name, an event title |
| `--text-body`             | 15px  | 400    | `font-body`           | Descriptions, sentences                               |
| `--text-meta`             | 13px  | 400    | `font-body`, always `--color-text-secondary` | Timestamps, "Evaluated by", counts |
| `--text-badge-label`      | 13px  | 600    | `font-body`           | `StatusBadge`'s label text specifically               |
| `--text-lead`             | 17px  | 400    | `font-body`           | The story's running prose                             |
| `--text-caption`          | 12px  | 500    | `font-heading`, uppercase, tracked | Labels (`.lbl`), helper text   |
| `--text-score`            | 24px  | 600    | `font-heading`        | A confidence percentage, the undo countdown           |

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

- **Primary is never used on Approve, Request changes or Reject.** Approve is the
  green plate (`approve` Button variant, a status colour), Request changes an outline, Reject
  a red outline. The orange plate (`default`) is for everything else: Review, Send to agent, the
  tour's Next. A brand colour on the decision actions would read as "the recommended
  option" or "the easy one," and the interface must never imply that (docs/spec-review-screen.md,
  Scenario S2; AGENTS.md non-negotiable 2).
- **Status is a separate palette from brand, and is never reused for non-status UI.** If
  something needs colour and it is not reporting a pass/fail/waived/not-applicable/unknown
  result, it does not get a status colour.
- **Status colours are for the icon, border and swatch — never the text itself.**
  The label next to a status icon uses `--color-text-primary` or
  `--color-text-secondary`, not the status colour. This is not a style preference: see
  the contrast numbers below. **One scoped exception:** `StatusBadge`'s `success`/`warning`
  tones are a filled tint (background, border, icon and text all the status colour) — see
  `StatusBadge.tsx`'s own doc comment and `docs/DECISIONS.md` for why, and why it stops at
  exactly those two tones. **Two more scoped exceptions** (docs/DECISIONS.md, 0041): the
  confidence level chip (High / Medium / Low, using the pass, waived and new fail tint pairs),
  and `--color-status-waived-tint-fg` as text for a "not run" count or a Low percentage.

## Contrast

Computed with the WCAG relative-luminance formula, target 4.5:1 for text (docs/DECISIONS.md,
0005 for the method; the numbers below are the dark palette's, 0143).

- Text on a panel (`--ink-1`): primary 15.0:1, secondary 6.5:1 (6.0:1 on raised, `--ink-2`).
  Text on a count pill (`--ink-chip`): 10.0:1.
- Brand: `--color-primary` text on a panel 6.9:1; dark text (`--color-primary-foreground`) on the
  orange fill 5.9:1; orange links on the amber tint 5.8:1.
- Status on a panel: pass 11.1:1, waived 11.2:1, fail 5.7:1. Each also holds on its own tint
  (5.4:1 to 9.8:1), and the approve plate's dark text on green is 11.9:1.
- `--color-border` is 3.1:1 against a panel (a control's own edge, WCAG's 3:1 non-text
  threshold); `--color-border-subtle` is a hairline between things and carries no meaning alone.
- `--color-text-disabled` is 4.6:1 here, though inactive text is exempt.
- Panels are solid on purpose: a gradient or texture behind text makes contrast unverifiable for
  axe, and the e2e spec would have to measure pixels instead.

Motion tokens live here too, and motion is functional only: state changes, data arriving,
focus. `prefers-reduced-motion` is respected.

This folder is also the artefact a design agent could read. Keep it tidy and documented in
Storybook — that is the point of writing design decisions as code.

## transitions.css

Transitions from transitions.dev (docs/DECISIONS.md, 0047): "Success check", "Tooltip
open/close" and "Tabs sliding". Each keeps its `.t-*` classes, its own motion variables, and
its `prefers-reduced-motion` guard. Colours come from the semantic tokens above. Change a
transition's feel through its variables (`--check-*`, `--tt-*`, `--tabs-*`), never by editing
the keyframes.

The welcome intro's drawing colours (the `--art-*` palette) are in tokens.css and are used by the intro only (0048, 0143). The terrain backdrop's
SVG is `--terrain-image`: a data URI cannot read tokens, so its colours are literal.
