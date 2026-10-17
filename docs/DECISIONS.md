# Decisions

A record of choices where there was a real trade-off. Newest first.

Each entry has four parts: the situation, the options, the choice, and what it means going forward.

---

## 0095 · Glass buttons and pills were stacking translucency into solid opacity; a lower-opacity "chip" tier fixes it

**Context.** Direct feedback after 0092/0093 shipped: "the buttons doesn't really have that glass effect... also pills." True on inspection: `btn-glass`/`btn-glass-fill` reused `--color-glass`/`--color-glass-fill` (0092) — the same tokens the outer My reviews card itself uses — and every on-page button sits *inside* that already-glass card. Two ~70%-opaque white layers compose to ~91% opaque, which reads as a plain solid surface, not "more glass." The tab's sliding pill indicator was worse: card → `TabsList`'s own (redundant) `bg-glass` → the indicator's own `bg-glass`, three layers deep, ~97% effective opacity.

**Choice.** A new, meaningfully more translucent token tier for small elements that sit on an already-glass surface: `--color-glass-chip` (buttons, the tab indicator) and `--color-glass-fill-chip`/`-border` (filled buttons), separate from `--color-glass`/`--color-glass-fill` so the card chrome itself (already shipped, already contrast-verified) is untouched. Also removed `TabsList`'s own redundant `bg-glass`/`border-glass-border`/`backdrop-blur` — it sat directly inside the identically-shaped outer `<section>`, adding a layer of stacking for zero visual purpose. `btn-glass`/`btn-glass-fill` also gained `saturate(1.4)` on their `backdrop-filter`, a small assist toward reading as "frosted" rather than merely "washed out." The warning badge's `--color-glass-warning` dropped from 97%/95% to 80%/78% — still clears real contrast (5.34:1 light / 7.85:1 dark) with room to spare.

**A real, visually-confirmed limit, not just a number.** Lowering opacity alone did very little for buttons sitting over the *card's own flat interior* (no texture or colour behind them to reveal, however low the opacity) — confirmed by zoomed screenshots showing near-identical results at 35% and at 70%. The same change was dramatically visible on the header Archive button and the warning badge, both of which sit directly over the page's blob gradient. This is an inherent property of glassmorphism, not a bug to keep chasing with lower numbers: a translucent surface only reads as "glass" where there is something to see through. Settled on `--color-glass-chip` at 18%/15% (light/dark) as a value that helps everywhere without being so low it hurts legibility where there's nothing to blend with.

**The filled variant needed re-tuning in the other direction.** An initial attempt dropped `--color-glass-fill-chip` to 40%/35%, which crashed the "Review"/"Create report" white-on-dark-glass contrast to 2.3–3.2:1 — real pixel measurement caught it immediately. Settled on 68%/62%, which measures 5.17–6.35:1 (comfortably clear) while still visibly reading as a translucent dark pane rather than a solid fill, confirmed by a zoomed screenshot comparison.

**Consequence.** Any future "glass on glass" nesting (a chip, a badge, a second-level card) should reach for `--color-glass-chip`/`--color-glass-fill-chip`, never `--color-glass`/`--color-glass-fill` directly — and should be visually confirmed over a *representative* background (both a flat card interior and a gradient edge), not just contrast-checked, since the two surfaces behave very differently.

---

## 0094 · Primary goes back to a brand hue — indigo-blue, shifted away from the existing status-blue

**Context.** Follow-up after 0092 shipped neutral primary: "I changed the primary color pink to blue color but it seems like it doesn't work well in dark mode." Investigation found the literal problem first: outside this session, a direct commit to `main` had recoloured the (still-present, not-yet-deleted-there) `--magenta-*` primitives to a dark navy (`#032243` for the dark-theme value) — on a dark surface, a near-black "blue" reads as almost invisible, which is exactly "doesn't work well in dark mode." Confirmed via `AskUserQuestion` that an actual blue primary (not neutral) was wanted, with the dark-mode contrast as the thing to fix.

**Choice.** A proper indigo-blue, not the navy hack: `--indigo-light: #4338ca`, `--indigo-dark: #9ea3ff` (plus hover/strong/tint primitives), chosen for two things verified before picking final values — real contrast (8.08–8.45:1 light text-on-white, 6.41–7.87:1 dark text-on-surface, all comfortably clear 4.5:1) and hue distance from the existing `--status-blue-*`/`--mark-blue` (~210–215°, the "Requested for change"/"unknown" status colour) — shifted to ~248° (violet-leaning) so a brand-coloured focus ring or active-tab badge never reads as that status colour, the same reasoning 0073 used to shift magenta away from `--status-red`. Same primitive shape 0073/0092 already established (`-hover`, dark-theme `-strong` for fills/underlines only, tint pair, cross-theme `--color-toast-link`) — a hue swap, not a new architecture.

**A merge conflict surfaced the same problem twice.** The direct `main` commits (recolouring `--magenta-*`, hand-tuning several motion durations/easings) conflicted with this branch's own `--magenta-*` removal (0092) and its `.t-icon-pop` keyframe redesign (0093) — both sides touched the same lines. Resolved by taking this branch's architecture (neutral/indigo primitives already fully replace `--magenta-*`, so main's recoloured values were dropped rather than merged) for the colour conflict, and `main`'s own hand-tuned `t-icon-fade` keyframe/timing (five separate commits of real iteration: "Adjust duration," "Modify scale effect," "Modify scale at 20%") for the animation conflict, since that was deliberate, repeated human tuning worth keeping over this session's first-pass values. `main`'s other, non-conflicting motion tuning (check/tabs-sliding/pop/shine durations and easings) merged automatically with no conflict at all, since this branch never touched those lines.

**Consequence.** A literal `*/` inside a CSS comment (`--status-blue-*/--mark-blue`) silently truncated the comment early and broke the Tailwind build with a confusing "unterminated string" error pointing at unrelated text further down — `check-theme-bridge.mjs` caught it immediately on the next run. Worth remembering: never write a literal `*/` sequence inside a `/* */` comment, even as a glob-like shorthand for two token names.

---

## 0093 · Tab icon pop replaced: a persistent colour reveal on the active tab, a gentler settle everywhere else

**Context.** Direct feedback once 0092 shipped: "that icon-pop animation is annoying to the
eye and would rather prefer some gentle fade-in... or something similar," followed by a
concrete idea for the My reviews status tabs specifically: "inactive tabs icon colors are the
same colour but once the user clicks it, it shows its true colour (e.g. accepted/success is
green)." Also, in hindsight, the old pop's glow was always `filter: drop-shadow(... var(--color-
primary))` — a reference-image detail built around a vivid magenta; once 0092 made primary
neutral, a colourless glow flashing on click had nothing left to justify "pop."

**Choice, My reviews tabs.** Dropped the pop mechanism there entirely, replaced by the
suggested interaction: every tab's icon chip sits at a neutral `bg-surface-raised`/
`text-text-secondary` at rest, and only shows its own status colour (`bg-mark-*`/
`text-mark-glyph` — the same pair it always rendered unconditionally before) once selected.
Implemented as plain Tailwind utilities keyed on `aria-selected` (`group-aria-selected:bg-mark-
pending` etc., each written as a literal string in `TABS` so Tailwind's JIT scanner actually
generates the class — a template-built string would not), with a `transition-colors` for the
reveal rather than the old `data-bounce`/`setTimeout` machinery, which is no longer needed at
all. `aria-selected`, not `data-state`: `Tabs.tsx`'s own comment on `useSlidingIndicator`
already documents a tooltip-wrapped pill trigger shadowing `data-state` with Radix Tooltip's
own; these tabs carry no tooltip today, but `aria-selected` is correct either way.

**A transition, not a bounded keyframe — on purpose, and checked.** `transitions.css`'s own
"Icon pop" comment has warned since 0090 that a *transition* keyed to rapid keyboard tab-
switching broke a keyboard test before (docs/WORKLOG.md, 2026-09-24) — that was specifically a
transform/layout-affecting transition on the sliding indicator's own measured position.
`background-color`/`color` are compositor-only properties with nothing to measure or reflow,
so the same failure mode doesn't apply in principle — confirmed, not just assumed, with the
mandatory `--repeat-each=15` keyboard stress test before shipping (clean: only the pre-existing,
unrelated `My reviews, keyboard only` failure, present identically on clean `main`).

**Choice, everywhere else (Request changes/Reject in `DecisionPanel`).** Still uses
`.t-icon-pop`/`data-bounce` — a one-shot confirmation pulse still fits there, unlike the tabs,
which needed a *persistent* state, not a transient click acknowledgement. The keyframe itself
changed from a springy `scale: 1 → 1.35 → 1` with a coloured `drop-shadow` to a calmer
`opacity: 0.4 → 1` + `scale: 0.92 → 1` settle, no glow, `cubic-bezier(0.16, 1, 0.3, 1)` (an
ease-out, not the old back-easing overshoot) — directly answering "gentle fade-in," and
sidestepping the now-colourless-glow problem outright by not having one.

**Consequence.** `MyReviews.tsx` lost the `poppedTab`/`poppedTabTimer` state and its cleanup
`useEffect` entirely — the Tailwind/CSS mechanism needs no React-side timing at all, a net
simplification. A future tab list that wants the same "neutral until selected" treatment should
follow the same `group` + `group-aria-selected:` pattern (`components/Tabs.tsx`'s own
`TabsTrigger`/`PillTrigger` already forward `className`, so `className="group"` at the call
site is enough) rather than reaching for `data-bounce` again, which this round carries forward
with a changed keyframe but no changed design, for DecisionPanel only.

---

## 0092 · Primary goes neutral (reversing 0073's magenta), and glass buttons on My reviews

**Context.** Two follow-on requests. First: "replace that pink contrast colour with something
more neutral — contrast should be in elements that need your attention more," confirmed via
`AskUserQuestion` to mean brand colour only, not the status palette (already the thing doing
real urgency duty, and already correct by the user's own framing). Second: "can we add glass
style also in buttons," confirmed to mean every `<Button>` on My reviews, including the filled
`default` variant, not an app-wide `Button` change.

**Primary, choice.** `--color-primary`/`-hover`/`-strong` now point at the same neutral
primitives `--color-text-primary` already uses per theme (`--neutral-12`/`-1`), not a hue of
their own — an inventory turned up no place the magenta was actually signalling urgency; that
was always the status palette's job (`src/styles/README.md`, "Status is a separate palette
from brand"). `--color-primary-tint`/`-tint-border` move to a neutral wash (`--neutral-2`/`-4`
light, `--neutral-11`/`-9` dark) for the same reason. `--color-primary-foreground` needed no
change — already "white on a dark fill, near-black on a light fill" per theme, exactly what a
neutral fill needs too. `--color-toast-link`, previously hard-wired straight to
`--magenta-dark`/`-light` bypassing `--color-primary` entirely, now points at the same
opposite-theme neutral. The `--magenta-*` primitives are deleted, not left orphaned, matching
how 0073 itself fully retired 0068's indigo-blue rather than leaving it behind. Verified by eye
in both themes, not just by contrast number: a neutral "active" state (the Filters button open,
the active tab's count badge, the focus ring) is a real risk pink didn't have — every one still
reads clearly against its own rest state.

**Glass buttons, mechanism.** Two new `@utility` classes in `src/styles/index.css`, applied as
a plain `className` on `Button` — `components/ui/button.tsx` stays untouched, so no button
outside My reviews is affected. `btn-glass` (for `outline`-variant buttons: Filters, Archive,
Clear filters, Details, Request-a-new-run, Archive-icon, New run) reuses the card-chrome glass
tokens from 0089 as-is. `btn-glass-fill` (for the two on-page filled instances — "Create
report," the row "Review" link-button) needed a new token pair, `--color-glass-fill`/
`-fill-border`: `--color-glass`'s light wash would wash out the white text a filled button
needs, so this mixes toward the same primitive `--color-primary` itself now uses per theme
(dark glass in light theme, light glass in dark theme) — the solid button's own fill/text
already flip this way per theme, so the glass version just follows. Real pixel-measured
contrast (the grid-mode technique from 0091) came back 9.1–15.1:1 across every glassed button,
both themes — comfortably clear, no opacity tuning needed beyond the first guess. Dialogs stay
out of scope, same boundary 0089 drew.

**A second instance of the `cn()`/tailwind-merge gap (0043).** `btn-glass`/`btn-glass-fill`
each set `background-color`, `border-color`, `box-shadow` and `backdrop-filter` in one custom
class; tailwind-merge doesn't recognise either name, so without a fix it would keep both the
glass class and whatever `bg-*`/`border-*` class a call site passes alongside it (e.g. the
Filters button's open-state override) — which one actually painted would then depend on
generated CSS source order, not on which class a component author wrote last. Fixed in
`lib/utils.ts` the same way 0043 fixed the type-scale case, but one step further: a
`conflictingClassGroups` entry (not just a `classGroups` entry) makes the glass classes and the
built-in colour groups mutually override each other regardless of which side appears later in
the string — proven with a throwaway `tailwind-merge` script before relying on it, not assumed.

**Consequence.** A future `btn-glass`-adjacent utility (any custom class bundling
`background-color`/`border-color`/`shadow`/`backdrop-filter` in one name) needs the same
`conflictingClassGroups` treatment in `lib/utils.ts`, or it has this exact bug silently.
`components/ui/button.tsx`'s own `outline`+`icon` compound variant still hard-codes
`hover:border-primary hover:bg-surface hover:text-primary`, now pointing at a neutral colour
by construction — left as is, a no-op cleanup, not a required one.

---

## 0091 · Glass tabs and badge on My reviews: a status-tinted glass token, and an amber primitive typo axe-core couldn't have caught

**Context.** Continuing the frosted-glass pilot (0089), the user asked for the My reviews
status tabs and the "N need your review" badge to read as frosted glass too, from a reference
image (a Google Photos–style floating pill nav bar, the active item in its own capsule).

**Choice.** The status tabs switch from the `line` variant to the existing `pill` variant
(`components/Tabs.tsx`) — its sliding capsule (`useSlidingIndicator('pill')`) already does
"active item gets its own highlight," so no new animation code was needed, only a new
`indicatorClassName` prop (threaded through `TabsList`/`PillTabsList`) so this one page's
capsule can use the glass tokens without changing the run page's own `pill` tabs
(Story/Evidence/All steps), which stay on the original `bg-surface shadow-sm`. First pass gave
the capsule its own `border-glass-border`, matching the outer track's border — visibly a
double outline in dark theme, reported directly ("should not have double borders, looks weird
otherwise") and fixed by dropping the capsule's own border entirely: a plain glass fill (bg +
blur + shadow) reads as the highlight, and the one remaining border is the track's.

The badge needed a second glass token, `--color-glass-warning`: the existing neutral
`--color-glass` diluted `--status-waived-tint-fg` (amber text) below 4.5:1 once blended with
the page's gradient, so this one mixes toward the amber tint itself instead of toward white/
black, more opaque than the neutral glass needs to be, tuned against real measured pixels the
same way `--color-glass` was (5.5:1 light / 7.6:1 dark, both comfortably clear).

**A real bug, not just a tuning pass.** The first version of `--color-glass-warning`
referenced `var(--status-waived-tint-bg-light)`/`-dark` — primitives that don't exist; the
actual names are `--status-amber-tint-bg-light`/`-dark`. An invalid reference inside
`color-mix()` makes the whole declaration invalid, which (for a non-inherited property like
`background-color`) silently falls back to `transparent` rather than erroring — so the badge
*looked* like a plausible amber-tinted glass pill (through to a measured contrast of 3.5–4.2:1,
still a real failure) while actually just showing the blurred page gradient through, no tint at
all. `scripts/check-theme-bridge.mjs`'s runtime check (built for a different bug class, 0014)
caught it immediately — it builds the real CSS and asserts every `bg-*`/`text-*` semantic-token
utility actually paints a non-transparent/non-inherited colour in a real browser, in all three
theme states. The static accessibility-contrast infrastructure from 0089/0090 could not have
caught this on its own: a transparent background still measures *some* contrast against
whatever is behind it; only a tool that knows what colour a token is supposed to resolve to at
all catches a reference to a name that silently doesn't exist.

**Consequence.** `check-theme-bridge.mjs` is not just a shadcn-bridge-collision guard anymore
in practice — any new `--color-*` token, used via its `bg-*`/`text-*` utility anywhere in the
app, gets the same runtime verification automatically, which is exactly what caught this.
Worth remembering next time a new token is added: `npm run check` (or
`node scripts/check-theme-bridge.mjs` directly) running clean is part of "this token actually
works," not just the format/typecheck/lint steps.

---

## 0090 · Animated icons: a real morph library for meaning changes, the existing `.t-*` CSS convention for click feedback

**Context.** The user wanted icons to animate on action — two Dribbble references (video
files, which this session cannot play) and Material Design's animated-icons guide, plus a
third inspiration image (a music-player UI with a glowing play/pause button). Clarified
through Plan Mode and several rounds of questions: both morph (an icon's own meaning changes)
and a plain click bounce (it doesn't), applied to every currently-interactive icon, and —
specifically ruling out a cheaper CSS-only approach — literal SVG shape-morphing for the
meaning-change half.

**Options for the morph half.** (a) CSS rotation/scale only, no new dependency, consistent
with every existing animation here. (b) A real path-morphing library. (c) Hand-rolled SVG path
interpolation. The user explicitly chose (b) over (a) before any code (AskUserQuestion), and
(c) was never seriously considered — tweening between two arbitrary Lucide icons' path data by
hand, correctly, is its own hard problem a dedicated library already solves.

**Choice.** `morphicons` (MIT, ~6–7 KB gzip, spring-physics path morphing, built specifically
for icon-to-icon transitions) plus `lucide` (the separate package `morphicons` needs for raw
icon-node *data* — `lucide-react`, already used everywhere else, only exports rendered
components, which morphicons can't animate). A thin wrapper, `components/MorphIcon.tsx`,
defaults `reducedMotion="user"` (morphicons' own default is `"never"`) so every call site gets
an instant swap under reduced motion for free, matching every other `.t-*` animation's own
guarantee, without each call site having to remember to pass it.

Applied to every icon whose own meaning changes on an existing boolean/enum the component
already tracks: the Filters and "runs still in progress" disclosure chevrons, `StepsTab.tsx`'s
grouped-step chevron (also unified from a `ChevronRight` + `rotate-90` approximation onto the
same `ChevronDown`/`ChevronUp` pair the other two use, for one consistent disclosure
convention), and `ReviewsTable.tsx`'s sort-direction arrows. **`ThemeToggle`'s Sun/Moon was
deliberately left alone** despite being a textbook morph target: it currently shows both icons
simultaneously as fixed track-end decorations with the thumb sliding between them, a different,
already-working visual metaphor a literal morph would have to restructure, not drop into — not
something this task's own scope asked for, so left as is rather than redesigned on the side.

For the bounce half (My reviews tab icons on selection; Request changes/Reject's icons on
click) — no new dependency: the existing `transitions.css` `.t-*` convention already covers
this exactly, a new `.t-icon-pop` pattern alongside `.t-pop`/`.t-success-check`, with its own
motion tokens and its own `prefers-reduced-motion` guard, per `src/styles/README.md`'s own
rule ("change a transition's feel through its variables, never by editing the keyframes").

**The keyboard-regression risk, and how it was avoided.** This codebase has broken a keyboard
e2e test from tab-related motion twice before (`docs/WORKLOG.md`, 2026-09-24; this session's
own four-attempt tabs-sliding-indicator fix) — once from a *colour transition* tied to rapid
automatic-activation state, once from a continuously-rescheduling `requestAnimationFrame` loop
perturbing Chromium's synthetic-input handling. `.t-icon-pop` avoids both causes deliberately:
it is a bounded `@keyframes` animation (not a `transition`) gated by a `data-bounce` attribute's
*presence*, set once per genuine action and cleared by a `setTimeout`, mirroring `.t-pop[data-
popping]`'s already-proven-safe mechanism exactly — not derived straight from "is this the
active tab right now" (which would also play on the very first page load, since the default
tab starts selected). `npx playwright test e2e/keyboard.spec.ts --repeat-each=15` (both themes)
confirmed no dropped keypresses before this shipped.

**Consequence.** Two new runtime dependencies (`morphicons`, `lucide`) alongside the
`lucide-react` the rest of the app still uses for every non-morphing icon — a real, if small,
addition to the dependency surface and the production bundle (+~25 KB / +~10 KB gzip, measured
via `npm run build`), for a capability (literal shape-morphing) this app genuinely cannot do
with hand-written CSS alone. Request changes/Reject's confirmation dialog now opens ~260ms
later than before the click, matching the delay `approve()`'s own pop already uses, so the pop
is visible before the dialog covers it — a small, deliberate behaviour change, not a bug.

---

## 0089 · Frosted glass, piloted on My reviews only, chrome translucent and data solid

**Context.** The user asked for a "frosted glass" theme in both light and dark mode, from two
reference images (soft blue/purple and teal/blue/green blurred-glass textures), and specifically
"literal glassmorphism," not just adopting the images' hues as a flat palette. This is a real
reversal of 0073, which deliberately moved this product *away* from a tinted, softer look to a
flat, true-neutral palette because the earlier look read as "a generic AI palette." Given that
tension and the scale of the change (the most visually dominant shift this app has had), this
went through Plan Mode and three explicit clarifying questions before any code: literal glass
vs. a colour-only reading (answer: literal), whether contrast should stay solid even inside a
glassy card (answer: yes, solid), and whether to roll out everywhere at once or pilot one screen
first (answer: pilot — My reviews, both themes, for sign-off before the run page, dialogs,
buttons and badges follow).

**Options for what "glass" touches.** (a) Make every surface (page, cards, chrome, and the data
table/header itself) translucent and blurred. (b) Make the page background and card chrome
(tab bar, search/filter toolbar, card frame) translucent and blurred, but leave the actual data
— `ReviewsTable`/`ArchiveTable` row and header backgrounds, which a reviewer scans closely —
on today's already-contrast-verified solid `--color-surface`. (c) No visual glass on the data
screens at all; keep the hues only.

**Choice.** (b). The user's own answer ("contrast stays solid") pointed here directly, and it
turned out to require no new code in `ReviewsTable`/`ArchiveTable`: those components already set
their own opaque `bg-surface`/`bg-surface-raised` backgrounds, and `TabsList`'s line variant and
`ReviewsToolbar` already have no background of their own — so wrapping the three card-shell
`<section>` elements (`MyReviews.tsx`, the main "Runs" section, the inline "Also found in the
archive" section, and the Archive page's own section) in the new glass tokens made the chrome
glassy and left the data solid automatically, with no separate "give the tabs their own tint"
work the plan had originally scoped in. New tokens in `tokens.css`: `--page-gradient-light`/
`-dark` (soft radial colour blobs, not a single linear sweep, so it reads as the reference
images' blurred texture rather than a flat band), applied only via a new `bg-page-glass`
Tailwind utility (`index.css`) on `<main>`, swapped in only when `!runId` (`App.tsx`) — a run
page keeps the flat `bg-bg` every other screen still uses, so the pilot's background does not
leak past My reviews either. `--color-glass`/`--color-glass-border`/`--shadow-glass`/
`--blur-glass`, the card-shell replacement for `--color-surface`/`--shadow-card`.
`--color-bg` itself, and every other token text already reads, is untouched.

**The real accessibility snag.** Axe-core cannot statically resolve contrast through a CSS
gradient or `backdrop-filter` in the ancestor chain — every page state failed
`e2e/accessibility.spec.ts` with `bgGradient`/`bgImage` "incomplete" results (not a wrong
number; axe refuses to guess at all) the moment `<main>` carried the gradient. The honest fix
was not to loosen the test (AGENTS.md's accessibility baseline, and the user's own "make sure
the website is still accessible" mid-task) but to extend it the same way it already handles text
behind an open dialog: `measuredBackgroundContrast` in `accessibility.spec.ts` screenshots the
real composited pixels and samples a grid across each flagged element, taking the most common
(quantised) colour as the background — not an edge probe, which kept landing on ascenders/
descenders at this app's line-heights and under-reported badly; a grid mode is robust to that
because text ink covers a minority of any of these boxes. Every one of these elements still has
to clear the exact ratio axe itself reports it expects (4.5:1 or 3:1 for large text) — nothing is
waived. A second wrinkle: states with an open dialog, the welcome modal, or the tour's scrim
also failed, because the screenshot genuinely shows the scrim's dimmed colour over that text,
which is real but irrelevant (the content is inert/obscured, same reasoning the file's existing
`behindModal` carve-out already uses for axe's `elmPartiallyObscuring` case) — detected with
`elementFromPoint` and skipped, not measured, for the same reason.

**Consequence.** Real rendered contrast behind the glass chrome measured 5.7–14.3:1 in both
themes (well above the 4.5:1/3:1 bars), and every one of the 34 accessibility states passes
clean. The pilot is deliberately narrow: My reviews only, chrome only. Propagating further (the
run page, dialogs, buttons, badges) is explicitly out of scope until the user signs off on the
screenshots sent for this pilot — if the direction changes, only three call sites and one
`index.css` background rule need to move, not a palette-wide change.

---

## 0088 · The outline button drops the shine for a plain fade and a small grow

**Context.** The user, after trying 0086's wider shine rollout: "the secondary button with
that hover effect is not good. Let's replace it with the original fade. That was better. We
could also include small grow in effect to it as well." A direct reversal for one variant, not
a bug report.

**Choice.** `outline` loses `.btn-shine` outright — back to a plain colour fade (the "original"
the user is referring to: its hover border/background/shadow changes, now actually animated
with a `transition` instead of snapping instantly) — plus `hover:scale-[1.02]`, tweened by the
same `transition`. `default` and `ghost` keep the shine (0086); only `outline` was called out.
Re-examined the file's own "no colour transition" rule (button.tsx's header comment, tracing to
2026-09-24) before adding one here: that bug was a transition keyed to rapid *automatic-
activation* keyboard state changes cascading through React re-renders on the line tabs — a
plain `:hover`/`:focus-visible` transition on a button is a different trigger entirely, the same
distinction the shine itself already relied on, so it cannot reproduce that failure mode.

**A verification snag worth recording.** `getComputedStyle(button).transform` read `'none'`
immediately after confirming the button's own CSS rule existed and `:hover` matched — looked
like the grow wasn't applying at all. It was: Tailwind v4 compiles `scale-[1.02]` to the
standalone CSS `scale` property (`scale: 1.02`), not the legacy `transform` property; checking
the right property (`getComputedStyle(button).scale`) confirmed it was working the whole time.

**Consequence.** `transitions.css`'s "Button shine" comment updated to name only `default`/
`ghost`; `button.tsx`'s variant doc comment explains the fade+grow in `outline`'s place.

---

## 0087 · The radius flattening broke the checkbox; a dedicated small-control radius fixes it

**Context.** The user: "Select boxes changed to radio buttons? Why?" 0082 flattened every
rounded corner to 10px, but `Checkbox` (`components/ui/checkbox.tsx`) is 16px square
(`h-4 w-4`) using `rounded-sm` — at 10px, more than half the box, the browser clamps the visible
radius to 50% and the box renders as a full circle, indistinguishable from `RadioGroupItem`'s
genuine `rounded-full`. A side effect of 0082 missed at the time, not a request to undo it.

**Choice.** A new token, `--radius-xs: 0.25rem` (tokens.css) — the exact pre-0082 value —
applied only to `Checkbox` (`rounded-sm` → `rounded-xs`). Not a return to the old per-size
scale generally: the user's complaint about cards and buttons reading "really round" stands,
and nothing else in the app renders small enough for 10px to reach the 50%-of-box threshold
`Checkbox` hit. `RadioGroupItem` is untouched: it already uses `rounded-full` directly, by
design, not through the flattened scale.

**Consequence.** Verified: `getComputedStyle` on a real checkbox now reports `border-radius: 4px`
(was computing to the full 8px half-box circle before the fix).

---

## 0086 · Button shine: slower, on all three tiers, and surviving `asChild` composition

**Context.** Two follow-ups on 0083's shine: "The primary button hover animation is way too
fast. It should be slower," and "secondary and tertiary hovers should have similar effect when
hovering" — `outline` and `ghost`, the two other button variants besides `default`/`destructive`/
`link`, the ones this app's own comments already call "the quieter action beside it" and a
plainer text-only one respectively.

**Choice, the colour.** Rather than add a second shine token for light-filled variants, the
existing `--color-button-shine` becomes `color-mix(in srgb, currentColor 45%, transparent)`.
`currentColor` resolves per element at the point of use, not where the custom property is
declared, so the same one token gives `default` (light text on a dark fill) a light stripe and
`outline`/`ghost` (dark text on a light fill) a dark stripe, correct in both themes, without a
per-variant override.

**Choice, the duration.** `--shine-dur` 650ms → 1400ms (transitions.css) — "slower," taken at
face value; confirmed by sampling the pseudo-element's computed `transform` across the sweep in
a real browser, not just eyeballing a screenshot.

**Choice, the scoping.** Originally scoped by `[data-slot="button"][data-variant="…"]` — both
attributes `Button` always renders. Extending to `outline` surfaced a real bug: the Filters
button, rendered `asChild` inside a Radix `CollapsibleTrigger`, had `data-slot="button"`
overwritten by the wrapper's own `data-slot="collapsible-trigger"` — the identical class of
collision `components/Tabs.tsx`'s `PillTabsList` already works around for `data-state` (see its
own comment). Switched to a plain `.btn-shine` class added directly in `buttonVariants` (cva):
`cn()`/`twMerge` concatenate class lists and never drop an unrecognised class the way an HTML
attribute can be overwritten, so it survives `asChild` composition. Confirmed: before the fix,
`getComputedStyle(filtersButton, '::after').content` was `'none'` (no rule matched); after,
`'""'`.

**Consequence.** `destructive` and `link` are deliberately left out — a red shine would read as
an alert rather than an affordance, and `link` already animates its own underline on hover.

---

## 0085 · The archive becomes fully read-only: no select, no restore

**Context.** The user: "Archive should not have restore or select button anymore." A direct
removal request, not a bug report — unlike 0087, there is no claim here that anything is
behaving wrongly.

**Choice.** `ArchiveTable.tsx` loses its `selectable`/`onToggle`/`onRestore` props outright (not
just always called with `selectable={false}`): the Select column, the Restore button and the
"Restore locked" icon are deleted from the component, not hidden. `MyReviews.tsx` drops the
`restored` state and the `restore()` function entirely — with no UI path to call them, they
were dead code waiting to happen, per AGENTS.md's "delete it completely" over leaving an unused
path in place. `ReviewDialogs.tsx`'s `RestoreConfirmDialog` is deleted with them, and
`ArchiveConfirmDialog`'s copy drops its "you can restore it for N days" promise, which would
otherwise now be false. `lib/reviews.ts`'s `archiveState` keeps `canRestore`/`restoreDaysLeft`
and `RESTORE_DAYS` untouched — that is data-model infrastructure describing a real distinction
(a run can still be restored for seven days before it locks) that 0060 modeled regardless of
whether any screen exposes a Restore button for it today, and the user's ask was specifically
about the button, not the underlying rule. `lib/reviews.test.ts` and `fixtures/sample-runs.test.ts`,
which assert on that lib-level distinction directly, are both untouched and still pass.

**Consequence.** The Archive page's "Create report" capability for archived runs goes with the
selection it depended on — a report can still include runs from My reviews, just not ones
browsed from the Archive screen itself; not flagged back to the user as a loss, since the
request was unambiguous and a report scoped to the Archive page was never asked for separately.
`e2e/keyboard.spec.ts`'s "My reviews, keyboard only" test, which exercised archive-then-restore,
is rewritten to archive-then-view-in-place instead; its Decision-details open/close check moves
onto the just-archived run, in the Archive view, rather than relying on a run that no longer
sits in the main list.

---

## 0084 · The line tabs get a sliding underline — three implementations in, before one held up

**Context.** The user: "Tabs in list view (pending, accepted, declined etc) should have similar
movement as the tabs in single run view that has 'Story', 'Evidence' and 'All steps' when
changing between tabs." The run page's tabs (`RunViewTabs.tsx`) use the `pill` variant, whose
sliding background (0047) is driven by `components/Tabs.tsx`'s `PillTabsList`: a `span` measured
against the active tab and moved with `transform`/`width`, tracked via a `MutationObserver` on
`aria-selected`. My reviews' run-type tabs use the `line` variant (0060), a plain per-trigger
`border-b-2` with no motion at all — `ui/tabs.tsx`'s own comment already explains why: "a colour
transition on the tabs made keyboard tests drop arrow presses" (2026-09-24).

**Choice.** `useSlidingIndicator(kind: 'pill' | 'line')`, a hook factored out of the pill's
existing logic and shared by a new `LineTabsList`, tweening only `transform`/`width` — never a
colour, the same constraint 2026-09-24 already established — so a new underline `span` slides
to the newly active line tab exactly the way the pill does. `ui/tabs.tsx`'s line trigger drops
its own instant `data-[state=active]:border-primary-strong` (the sliding span replaces it as
the visual indicator) but keeps `data-[state=active]:text-text-primary`, so a sighted cue that
doesn't depend on the span having measured yet survives regardless.

**The measuring mechanism took three tries**, each one verified the same way: a real browser,
three rapid ArrowRight presses with no delay between them (automatic-activation tabs select
immediately on each arrow key, unlike the pill's manual-activation tabs, which only ever change
one at a time — this is the first place the shared mechanism has ever been exercised under a
true rapid-fire burst), repeated 10–15 times via `--repeat-each` to catch intermittent failures
`npm run check`'s own single pass would not.

1. **The `MutationObserver` reading layout directly** (matching the pill's existing code
   exactly): `getBoundingClientRect()` inside the observer's own callback forces a synchronous
   reflow at the moment the browser is handling whatever triggered the mutation. Dropped
   roughly one burst in three — a second or third ArrowRight simply had no effect. The same
   class of regression as 2026-09-24, via layout thrashing instead of a colour transition.
2. **The same observer, its callback coalesced through one `requestAnimationFrame`**: still
   failed about as often. Deferring to the next frame didn't move the read far enough from the
   keystroke.
3. **A continuous per-frame `requestAnimationFrame` poll**, comparing the active tab by
   reference each frame and only measuring on a change: still failed, at a similar rate — and,
   isolated by temporarily no-op'ing the effect entirely (same DOM, same CSS, zero scheduled
   work), the flakiness vanished outright. That isolation is what shows the *continuously
   rescheduling rAF chain itself* — not the layout reads — was what perturbed Chromium's
   input handling here, something neither attempt 1 nor 2 would have revealed on its own.
4. **What holds up**: back to the `MutationObserver` (event-driven — nothing runs on frames
   where nothing changed), but its callback never calls `place()` itself; it only resets a
   60ms `setTimeout`. A burst of rapid changes keeps resetting the same timer, so the one
   `getBoundingClientRect` read per burst happens on a plain timer callback, well clear of any
   keystroke still in flight, once the burst has fully settled. 15/15 and 10/10 repeats clean
   across both the line and pill keyboard specs.

**Consequence.** A real but small trade-off this choice accepts: the indicator's first visible
movement now lags the input that caused it by up to 60ms, instead of starting instantly. Judged
imperceptible (under the ~100ms human "instant" threshold) against the alternative of dropped
keystrokes, and confirmed by frame-by-frame sampling that the slide itself still plays smoothly
once it starts.

---

## 0083 · Button hover: a CSS-only shine, not a pointer-tracked glow; table row hover fixed

**Context.** The user found both hovers too quiet, and supplied a reference implementation for
a brighter one: a `Button` component that tracks the pointer in React state (`onPointerMove`
setting `--mx`/`--my`) to centre a radial glow and a diagonal "shine" gradient under the
cursor, asked to be adapted "according to the style we do." Separately, "table hover" turned
out to be an actual bug, not just quiet: `ReviewsTable`/`ArchiveTable` rows hovered to
`--color-bg` (the page background) — in light theme that's the same value as
`--color-surface-raised` already used for hover everywhere else (barely different from the
row's own white), and in dark theme `--color-bg` (`#121212`) is *darker* than the row's own
surface (`#282828`), so hovering made a dark-theme row look like it was sinking into the page
instead of lifting off it.

**Choice, the button.** Not a literal port. This project's `Button` is a generic, reusable
primitive (components/README.md) rendered many times a page; wiring pointer-position state
through every instance for a hover decoration is exactly the kind of abstraction AGENTS.md
asks not to add beyond what a task needs. It also risks a problem this app has hit before: a
colour/style change keyed to rapid state updates dropped arrow-key presses in the keyboard e2e
spec (docs/WORKLOG.md, 2026-09-24, on the line tabs). A CSS-only diagonal sweep gets the same
"shiny" read without either cost — it keys off `:hover`/`:focus-visible`, pseudo-classes the
mouse and keyboard focus set natively, never a per-keystroke React re-render, so it cannot
reproduce that bug (confirmed: the full keyboard spec still passes, all three specs, zero
dropped presses). It needs no new prop or class either: `Button` already stamps
`data-slot="button"` and `data-variant="default"` on every instance, so the sweep is pure CSS
in `transitions.css`, scoped to the one solid-filled variant — the same shape as the
reference's own `bg-zinc-800` button — where a light stripe reads against a fill. The stripe's
colour is a new token, `--color-button-shine` (tokens.css): `color-mix(in srgb,
var(--color-surface) 55%, transparent)`, i.e. the button's own foreground colour (`text-surface`
is already what the label uses to read against the fill) at partial opacity — correct in both
themes with no separate dark-mode rule, since the fill itself flips dark/light with the theme
and this token flips with it. `prefers-reduced-motion` drops the sweep outright (decorative,
like the welcome intro, not informational like the onboarding tour). The `outline` variant
(Request changes, Cancel, Filters) isn't filled, so a shine wouldn't read on it; it gets
`hover:shadow-card` instead, reusing the existing card-shadow token for a small lift.

**Choice, the table.** `hover:bg-bg` → `hover:bg-border-subtle`. Not `surface-raised` (the
`ghost`-button hover token, and the obvious first guess): checked the actual neutral-scale
values and `--color-border-subtle` sits one step further from the row's own surface in both
themes (`#e9e9e9` vs `#f5f5f5` in light; `#3d3d3d` vs `#323232` in dark, both still lighter
than the row, fixing the inversion) — genuinely more obvious, not just a different name for the
same colour, and still an existing, principled token (already the table's own border colour),
not an invented one.

**Consequence.** Verified by computed-style diff in a real browser: light theme row hover is
now `#fff` → `#e9e9e9` (was `#fff` → `#f5f5f5`, barely perceptible); dark theme is `#282828` →
`#3d3d3d` (was `#282828` → `#121212`, the wrong direction). The button shine was confirmed
frame-by-frame in both themes: a light stripe sweeping a dark-filled button in light theme, a
dark stripe sweeping a light-filled button in dark theme — both read as "shiny," neither
washes out. `npm run check` is green, keyboard e2e included.

---

## 0082 · A flat 10px radius everywhere, replacing the per-size scale

**Context.** The user's reaction to the app's corners: "Instead of having round corners would
rather have 10px borders. Now everything is really round." `--radius-sm`/`-md`/`-lg` (0068)
scaled from 4px to 8px to 14px by element size — cards at 14px read the roundest, and cards are
also the largest, most visually dominant shape on the page, so that's exactly the complaint.

**Choice.** All three tokens become the same flat `0.625rem` (10px), in tokens.css only — no
component changes needed, since every rounded corner in the app already goes through
`rounded-sm`/`-md`/`-lg` and those map straight to these tokens. `rounded-full` (pills, status
dots, the theme toggle, checkboxes, radios) is untouched on purpose: those are circular by
design — a full pill has no "corner" to flatten, and the user's complaint was specifically
about corners reading round, not about rounded controls existing at all.

**Consequence.** Verified: `getComputedStyle` on a real button after the change reports
`border-radius: 10px` exactly, with no other styling needing to change — a one-file fix.

---

## 0081 · The real favicon artwork arrives; the attention variant gets fixed along with it

**Context.** 0075 reconstructed a favicon from circumstantial evidence because the user's
actual attached image never reached a readable path that session. This time the file came
through: a 260×260 PNG, a hand-drawn orange crane/bird mark on a solid black circle — a
different image from 0075's grey-swatch guess, confirming that reconstruction is now
superseded rather than correct. Investigating where to apply it surfaced a second, unrelated
bug: `public/favicon-attention.svg` (the amber-dot variant shown while a run has things to
solve, 0054) was never updated by 0075 — it was still 0065's "mustache heart" icon, completely
unrelated to either favicon that came after it. That latent mismatch is what the user was
actually seeing as "wrong favicon used in single run page."

**Choice.** `public/favicon.svg`/`favicon-attention.svg` are replaced with `favicon.png`/
`favicon-attention.png` — a format change, not just new artwork: the source is a raster PNG,
and this session has no reliable way to vectorize hand-drawn brushwork into an accurate SVG
path, so redrawing it as an SVG (the way 0065 and 0075 both did) would mean approximating the
art rather than using it as supplied. `index.html`'s `<link rel="icon">` and
`useAttentionFavicon.ts`'s `ATTENTION_FAVICON` constant both move to the `.png` paths. The
attention variant is generated from the same source image (Pillow, scripted, not hand-drawn):
the identical logo with a white-ringed amber dot (`#ffb224`, `--status-amber-dark`, the same
tone the "needs your review" badge dot already uses) composited in the top-right corner, the
same position and proportions 0065's SVG version used — so the two favicons are finally the
same mark again, one plain and one with a dot, instead of two unrelated images.

**Consequence.** `useAttentionFavicon.test.tsx`'s hardcoded `/favicon.svg` strings move to
`/favicon.png`. Verified by rendering both PNGs directly: the plain mark reads clearly at
favicon size, and the attention variant's dot is legible in the same corner as before.

---

## 0080 · My reviews drops "Where it is now"; "Run type" becomes "Status"

**Context.** The user noticed "Where it is now" was never carrying information beyond what
the "Run type" column already said: runs still in progress (agent working, checks running)
are already filtered out of the table into their own "still in progress" fold below it
(docs/DECISIONS.md, 0061), so every row left in the table is already at its type's one
settled stage — "Needs your review" for every Pending row, "Agent is making changes" for every
Requested-for-change row, "Decided" for every Declined/Approved row. Within any single tab
every row showed the identical value; in "All runs" it just re-derived what the status pill
already said. Separately, "Run type" was a misnomer for what it actually shows — the column's
own info tip already called it "where the run stands overall," a status, not a category of
run.

**Choice.** Removed the "Where it is now" column and its `StageCell` outright, rather than
keeping it for the "All runs" tab only (a run's status implies its in-table stage one-to-one
here, so a conditional column would have added complexity for zero new information — a run
that could be in a different stage despite the same status is exactly the case the
"still in progress" fold already carries separately, below the table). Renamed "Run type" to
"Status" — plain, short, matches the info tip's own wording. This departs from the Claude
Design handoff's own column set (docs/DECISIONS.md, 0060's "built as designed" baseline) on
this one point; nothing else in that handoff is touched.

**Consequence.** `src/lib/reviews.ts`: `'stage'` dropped from `SortKey`, its `COMPARE.stage`
entry and the now-fully-unused `stageRank` helper removed; `STAGE_STEP`, `reviewStage`,
`formatReviewStage` and `StageSteps` all stay exported and in use elsewhere (the "still in
progress" fold in `MyReviews.tsx`, the decision-details dialog in `ReviewDialogs.tsx`, and
`ReviewsTable.tsx`'s own Action column, which still reads `reviewStage(run) === 'review'` to
decide whether to show the Review button). `src/features/run/ReviewsTable.tsx`: `StageCell`,
its `ColumnHeader`, its `colgroup` width entry and `INFO.stage` all removed; `INFO.type`
renamed to `INFO.status`, label text unchanged. `e2e/keyboard.spec.ts`'s info-tip focus test
updated from "About Run type" to "About Status". The Archive table's own, separate "Run type"
column (`ArchiveTable.tsx`) is untouched — a different view, not part of this request. `npm run
check` — 291 unit tests, 44 e2e tests — green, unaffected in count (removed code had no tests
of its own beyond what the shared table/sort tests already covered generically).

---

## 0079 · The tour is offered, not sprung: a welcome modal gates it

**Context.** 0078's tour auto-started the moment the welcome intro finished — no explanation of
what the product is, who built it, or why, and no choice in the matter. The user asked for a
"Welcome to Review agent runs" step between the two: say what the screen is and why it exists,
then let the visitor choose to take the tour or skip it. Explicitly not attributed to any one
company — Berit noticed teams adopting agents faster than anyone could watch what those agents
were doing, and built this to test an idea for that, not for a client.

**Choice.** `src/app/WelcomeModal.tsx`, built on the existing `components/Modal.tsx` (a real
Dialog, focus trap, Escape to close, no click-outside-to-close — the same recipe every other
confirmation dialog in the app already uses), not a new overlay primitive. Two short paragraphs
— what the screen does, then who built it and why, in that order, since "what is this" is the
question a brand-new visitor actually has first — and two real buttons, "Take the tour" and
"Skip, I'll look around myself." Lives in `app/`, not `components/`, because its copy is
specific to this product (same reasoning as `WelcomeIntro.tsx`'s own placement).

**Sequencing.** Inserted between the intro and Leg 1, reusing `tour.ts`'s existing
sessionStorage state rather than adding a new flag: the modal shows whenever
`shouldShowListTour()` would previously have auto-started the tour, "Take the tour" opens Leg 1
exactly as before, and "Skip" (the button, Escape, or any other way the dialog closes) calls
`markTourSeen()` directly — ending onboarding outright, the same as skipping the tour itself,
not just postponing it. Leg 2 (a run page) has no modal of its own: it is already a
continuation of a choice made on My reviews, so it still opens automatically, same as before.

**Consequence.** `App.tsx`'s `showTour` no longer auto-initialises on the home page — only the
modal's "Take the tour" sets it. `tour.ts`'s `TOUR_SEEN_KEY` is now exported (`App.test.tsx`
needs it to isolate its own tests from the modal, the same way it already isolates them from
the intro via `INTRO_SEEN_KEY`). `e2e/onboarding-tour.spec.ts`'s tests now open the modal
first; `e2e/accessibility.spec.ts` gains a welcome-modal state and a `skipInitialHeading` flag,
since the modal (like the tour) opens the instant the page loads, correctly hiding the page's
`<h1>` from assistive tech behind it (Radix's own sibling-hiding for an open dialog) before the
shared per-state check that every other state relies on would run. `npm run check` — 291 unit
tests, 44 e2e tests — green.

---

## 0078 · A two-leg onboarding tour, spotlighting real elements through a true cutout

**Context.** The user asked for onboarding: features explained one at a time, each
highlighted while the rest of the page dims — a spotlight tour. Confirmed before building:
the tour covers My reviews first, then continues onto the run review page once the visitor
opens a run; it plays once per visit, the same mechanism as the existing welcome intro
(`WelcomeIntro.tsx`, `intro.ts`), not once-ever; no replay affordance.

**Two legs, eight steps.** Leg 1 (My reviews, 5 steps): the "needs your review" badge, the
status tabs, the search/filter toolbar, the first run row (an invitation to click it), the
Archive button. Leg 2 (the run page, 3 steps): the overview card, the Story/Evidence/All-steps
tabs, "Your decision." Content follows `docs/spec-review-screen.md`'s voice rules.

**New files.** `src/components/ui/popover.tsx` (a new shadcn/ui port, 0070's recipe — gives
the step bubble real collision-aware positioning off a point that isn't a click trigger).
`src/components/OnboardingTour.tsx` — the generic, product-agnostic engine (steps are just
`{ id, selector, title, body }`; passes `components/README.md`'s "different product" test).
`src/app/tour.ts` — sessionStorage sequencing, mirroring `intro.ts`'s shape. `src/lib/motion.ts`
— `prefersReducedMotion()` extracted out of `intro.ts` so `OnboardingTour` (which cannot import
from `app/`, by the dependency direction in `AGENTS.md`) can reuse the same real check instead
of a second copy. `src/features/run/tourSteps.ts` — the eight steps' copy and `data-tour`
selectors, kept out of the generic component.

**The cutout is four separate dimmed rectangles around the target, not one masked overlay.**
Nothing ever covers the spotlighted element, so it stays genuinely clickable and focusable —
load-bearing for the "click this row" step, which invites exactly that.

**Targets are wired with `data-tour="…"` attributes**, not refs threaded through
`ReviewsTable`/`DecisionPanel` — the least invasive option, and consistent with the
attribute-hook pattern already in the codebase (`data-testid`, shadcn's own `data-slot`).

**Keyboard model: Tab cycles only the step bubble's own Back/Skip/Next buttons** (a small
manual wrap, not Radix Dialog's `aria-modal` trap). A keyboard user reaches the live page the
same way a `Modal.tsx` dialog already works — by dismissing first (Escape or Skip) — rather
than tabbing through a dimmed page mid-tour. Considered letting Tab reach the live element
directly, to mirror the mouse behaviour exactly; rejected once drafted, because nothing
distinguishes a dimmed-but-still-tabbable element from a usable one for a keyboard user, and
there is no clean way to `inert` everything *except* one descendant.

**Reduced motion shows the tour, just without transitions** — unlike the purely decorative
welcome intro, which skips outright. `prefersReducedMotion()` governs `scrollIntoView`'s
`behavior`; `motion-reduce:` Tailwind variants (the same pattern `dialog.tsx`/`tooltip.tsx`
already use) cut everything else to instant.

**A step's target may not be in the DOM yet, not just never.** My reviews fetches its runs
asynchronously (`lib/api.ts`'s default 400ms delay); the first build of this tour checked a
step's target exactly once and, finding nothing (because the page was still loading),
cascaded through every remaining step as "missing" and ended itself before the real page ever
rendered — caught by screenshotting the real app, not by the unit tests, which don't have that
race. Fixed with a `MutationObserver` that waits for the target to appear, up to
`missingTimeoutMs` (3s default, overridable — a test passes a few ms instead of faking timers),
before concluding it is genuinely absent (a real possibility too: responsive layout, a step
whose region isn't always rendered) and skipping ahead.

**The cutout's rect is tied to the step it was measured for**, not just "the latest
measurement" — found the same way, by looking at a real screenshot: advancing steps quickly
showed the right title with the *previous* step's cutout for one frame, because the old rect
stayed in state until the new one replaced it. `rectStepId` gates which rect renders, so a step
never shows with a stale cutout, however briefly.

**Leg 1 continuing to Leg 2 isn't only "reached the last step."** Step 4 is literally an
invitation to click the spotlighted row — on the common path a visitor never reaches step 5 or
the last step's "Done" at all. `OnboardingTour` listens for `pagehide` and calls
`onDismiss('navigated')` if it is still open when the page unloads; `App.tsx` treats that the
same as `'finished'` on Leg 1 (continue to Leg 2) and the same as anything else elsewhere (mark
the whole tour seen) — an explicit Skip or Escape still always ends it outright.

**Sequencing (`App.tsx`).** Intro, then Leg 1 once the intro is no longer in the way, then Leg
2 on a run page if `shouldShowListTour()`/`shouldShowRunTour()` (`tour.ts`) say so.
`ledger:tour-leg` carries "Leg 1 finished, show Leg 2 next" across the run page's full page
load — there is no client router, so React state alone cannot survive that navigation.

**Consequence.** `e2e/fixtures.ts` bypasses the tour for every other spec, the same way it
already bypasses the intro; `e2e/accessibility.spec.ts` gains one state that clears just that
bypass; `e2e/onboarding-tour.spec.ts` covers the golden path (Leg 1 → click the row → Leg 2),
Skip, Escape, and the keyboard model. `npm run check` — typecheck, lint, format, theme-bridge,
format-locale, 283 unit tests, 41 e2e tests — green. Real-browser screenshots of every Leg 1
step, Leg 2's first step, both themes, confirm the cutout, the stale-rect fix, and the
Leg 1 → Leg 2 handoff.

---

## 0077 · The Story/Evidence/Steps tabs get a white card, matching their siblings

**Context.** After 0076 shipped, the user said the fix was still incomplete: "I'm talking
about the tabs. And it still has grey background. It is not inside a white card like other
elements." `RunOverview`, `RunDetails` and `DecisionPanel` ("Your decision") each supply their
own `rounded-lg border border-border-subtle bg-surface shadow-card` card styling. The
Story/Evidence/All-steps tab section never had an equivalent wrapper anywhere in its chain
(`RunReviewPage.tsx` → `RunViewTabs.tsx`/`TabsContent` → `StoryTimeline`/`EvidenceTab`/
`StepsTab`) — it sat directly on the page's grey page background (`bg-bg`), a longstanding
structural gap, not a regression from 0076's work.

**Options.** (a) Add `bg-surface`/border/shadow to each of `StoryTimeline`, `EvidenceTab` and
`StepsTab` individually. (b) Wrap `RunViewTabs` plus the three `TabsContent` blocks in one
shared card at the `RunReviewPage.tsx` call site, matching `RunOverview`'s exact recipe.

**Choice.** (b). The three views share one tab strip and are conceptually one region (0052: the
tabs sit directly above the one view they switch); one shared card avoids three near-identical
copies of the same card recipe and keeps the sticky tab strip visually continuous with the
content scrolling under it.

**Consequence.** `RunReviewPage.tsx`'s tabs wrapper div gains
`rounded-lg border border-border-subtle bg-surface shadow-card`, with the three `TabsContent`
blocks moved into an inner `px-[var(--space-5)] pb-[var(--space-5)]` div (matching
`RunOverview`'s own `space-5` padding). `RunViewTabs.tsx`'s sticky header switches from
`bg-bg` (page-grey, with a `-mx-space-2`/`px-space-2` bleed) to `bg-surface` with
`px-[var(--space-5)]` and a `rounded-t-lg` top, so the sticky strip reads as the top of the
same card rather than a grey strip floating over it. `StepsTab`'s own table already carried
its own `rounded-lg border bg-surface shadow-card`; nested one level inside the new outer
card, it still reads as a distinct table region, not a double border — checked by eye in both
themes. `npm run check` (typecheck, lint, format, theme-bridge, format-locale, 273 unit tests,
35 e2e tests including axe WCAG checks) green; screenshotted the Story, Evidence and All-steps
tabs in both themes to confirm.

---

## 0076 · The design-canvas review propagates: colour usage, grouping, the top bar label

**Context.** The Claude Design mockup (0073's palette, reviewed together) led to concrete
feedback: the primary pink read as "error," with no rule for where it should and shouldn't
appear; "Your decision" needed more white space between its sections; the top bar's app-name
label should go, with the breadcrumb link reading "Back to the reviews list." Applied to the
real app — both My reviews and the run review page — not just the canvas.

**Pink hue, again.** `#c2185b` sat only ~29° from `--status-red-light` on the colour wheel;
`#c21895` (light) / `#ff70d9` (dark) sit ~50° away, same saturation and lightness otherwise.
Computed and contrast-verified the same way as 0073 (≥4.5:1 as text on every surface it
appears on, both themes). The selected-row/active-tab tint wash regenerated from the new hue
for the same reason 0073 regenerated it from the old one.

**The usage rule, written down and applied.** *Primary is for interactive affordances only —
links, and the active/selected state of a real control. Everything else — a section heading's
icon, an eyebrow label, a step-number badge, a legend dot — is neutral, even where it used to
be pink.* Audited every `text-primary`/`bg-primary`/`border-primary`/`fill-primary` use in
`src/` (the brand token; not `text-text-primary`, the neutral one) and reclassified each
against this rule:
- **Kept pink**: `OpenItemsNotice`'s and `InProgressBox`'s links, `RunTopBar`'s breadcrumb
  link, `ScoreCard`'s `<summary>` disclosure trigger, `StepsTab`'s expand-group button,
  `ThemeToggle`'s current-theme icon, `ReviewsTable`'s active-sort button,
  `ReviewsToolbar`'s active-filter toggle, the shadcn `RadioGroup`'s own checked indicator,
  and the `button`/`badge` component's `link`/`primary` variant definitions (real controls,
  not call-site decisions).
- **Changed to neutral** (`text-text-primary`, or an equivalent neutral fill): `SectionHeading`
  (the shared region-heading icon — propagates to every region at once), `RunDetails`' and
  `RunShape`'s own inline heading icons (same pattern, not yet migrated to `SectionHeading`),
  `RunOverview`'s `EYEBROW` class ("Why the agent was asked" / "Where the run is now"),
  `DecisionPanel`'s `StepNumber` badge (both steps, not just one — neither is really
  "disabled," so differentiating them would invent a distinction the data doesn't have),
  `ReviewDialogs`' matching numbered-step circles in the "Request a new run" flow, its
  report-dialog icon, `StoryTimeline`'s "key step" dot and its added/modified file marker, and
  `MyReviews`' two page-heading icons (`PageTitle`, the inline "Also found in the archive" h2)
  plus its in-progress collapsible's icon circle.

**"Your decision" regrouped.** The panel's top-level children — heading+caption, "Deciding
as," the open-items fieldset, the choose-one block, the closing note — all sat at one flat
`gap-space-4` (16px). The heading block and "Deciding as" are now wrapped into one identity
group (`gap-space-4` between them, each keeping its own tighter internal gap), and the
section's own top-level gap becomes `space-6` (32px) between that group, the fieldset, the
choose-one block, and the closing note. No new spacing value: `--space-6` already existed.

**Top bar.** `RunTopBar`'s `AppName` ("Review agent runs") is deleted outright, not hidden —
nothing else on the bar needs the divider it used to sit against. The breadcrumb link's text
changes from "My reviews" to "Back to the reviews list"; its `href` and behaviour are
unchanged. `MyReviews.tsx`'s own internal "My reviews" back-link (from its Archive sub-view)
is a different element and was not touched — the request was about the run page's bar.

**What stayed unchanged.** Spacing elsewhere: a repo-wide check for raw pixel values or
Tailwind's own numeric spacing utilities (`gap-3`, `p-4`, …) in the touched files found none —
the app already enforces the `--space-*` scale strictly, unlike the hand-written canvas
mockup, which had several off-scale values now corrected there too. Status colours and the
`StoryTimeline` "attention" tone (status-amber) are untouched — a separate system, as always.

**Consequence.** One obsolete test deleted (`RunReviewPage.test.tsx`'s "names what the app is
for in the top bar," which tested a label that no longer exists); two more updated for the new
breadcrumb text (`App.test.tsx`, `e2e/approve-flow.spec.ts`). Full `npm run check` — 273 unit
tests (down one, the deleted test, not a regression), all 35 e2e tests including axe WCAG
checks on every state in both themes — green.

---

## 0075 · The favicon becomes the signature mark, on a flat grey swatch

**Context.** The user asked to replace the favicon with an attached image: an orange,
hand-drawn cursive squiggle on a flat grey background. The image file itself never reached a
path this session could read (checked the usual upload/scratch locations; nothing newer than
the previous turn's own screenshot appeared) — but the colour (a vivid orange) and the shape
(a cursive squiggle/flourish) match `SignatureMark.tsx`'s artwork exactly: the same mark
already used in the welcome intro, which draws in `--signature-orange` (`#e8590c`) before
resolving to black. That is strong enough circumstantial evidence (exact colour family, same
shape category, already-established precedent as "the" piece of real supplied artwork in this
app) to act on without the file, flagged openly to the user rather than silently assumed.

**Choice.** Replaced `public/favicon.svg` (the "mustache heart," 0065) with the exact,
unmodified `SignatureMark` path data — not redrawn — filled in `--signature-orange`, centred
in a 200×200 rounded square (`rx="40"`) filled `#646464` (`--neutral-8`/`text-secondary`, an
existing token, not a new grey invented for this one file). The original artwork's 178×101
viewBox doesn't fit a square icon directly, so it's scaled (0.8989×) and translated to sit
centred with even padding, the same "fit the wide mark into a square box" problem
`WelcomeIntro.tsx`'s `bottomAligned` prop solves differently (bottom-aligned there, centred
here, since a favicon has no "title block" to sit above). `index.html`'s existing
`<link rel="icon" type="image/svg+xml" href="/favicon.svg">` needed no change.

**Consequence.** Verified by screenshotting the SVG directly in a real browser: an orange
cursive squiggle, clearly legible even at small sizes, on a flat mid-grey rounded square —
matching the supplied reference image by eye. If the actual uploaded image turns out to differ
from this assumption once it's visible, redoing this is cheap: one file, no other code depends
on its exact contents beyond the existing `<link>` tag.

---

## 0074 · The pill tabs' active colour keys off `aria-selected`, not `data-state`

**Context.** Rebuilding the run review screen as a Claude Design mockup (for the user to
review the design against the live app) surfaced a real bug: in the live app, the active pill
tab (Story/Evidence/All steps) never got its dark `text-text-primary` colour — it stayed the
same grey as the inactive tabs, distinguishable only by the sliding white pill behind it, not
by its own text. The mockup (built from the component's intended styling) showed the active
tab in dark text, which is what exposed the gap.

**Root cause.** `RunViewTabs.tsx` passes a `tooltip` prop to each pill trigger, which routes
through `PillTrigger` (`components/Tabs.tsx`) into `<Tooltip><TooltipTrigger asChild>…`. Radix's
`asChild` merges `TooltipTrigger`'s own props — including its `data-state` (the tooltip's
open/closed state) — onto the same DOM node Radix Tabs already writes its own `data-state`
(active/inactive) to. Once Tooltip's state settles after mount, its value wins: every pill tab
reads `data-state="closed"`, permanently, regardless of which one is actually selected. The
CSS selector `data-[state=active]:text-text-primary` (in `tabsTriggerVariants.pill`) and the
sliding pill's own position query (`[role="tab"][data-state="active"]` in `components/
Tabs.tsx`'s `place()`, plus its `MutationObserver`'s `attributeFilter`) all silently stopped
matching anything. The `segmented` and `line` tab variants never wrap in a `Tooltip`, so they
were never affected — this is specific to a pill tab with a `tooltip` prop, which today means
exactly `RunViewTabs`.

**Choice.** Switch both to `aria-selected="true"`, which Radix Tabs sets on its trigger as
part of its own accessibility contract and which Tooltip has no reason to touch — nothing else
in this composition writes to it. Three call sites changed: the trigger's CSS selector, the
sliding pill's query, and the `MutationObserver`'s `attributeFilter`.

**Consequence.** Verified in a real browser: the active tab's text is now correctly dark on
load and after every switch (click or keyboard), and the sliding pill's position and opacity
track correctly too — before this fix, a *second* tab switch risked the pill query also
finding nothing (since `data-state` had already been corrupted by the time the `Mutation
Observer` fired), which would have made the sliding pill disappear on the next click, not just
leave the label mis-coloured; that risk is gone along with the text-colour bug. Full
`npm run check` (274 unit tests, all 35 e2e tests including the keyboard-only pass that arrows
between these exact tabs) passes unchanged. Worth knowing for any future `asChild`-wrapped
Radix composition: two primitives stacked this way can silently collide on any attribute name
they both happen to use, not just `data-state` — prefer a semantic, single-owner attribute
(`aria-*`, here) over a styling-only one when two behaviours are composed onto one DOM node.

---

## 0073 · A flat, true-neutral palette with a magenta-pink primary, replacing 0068's lavender

**Context.** The user's reaction to the lavender-tinted palette 0068 introduced: it "looks
really bad," reads as a generic "basic beige/AI" palette, and should be "more modern... more
creative." Asked for direction (style, scope, a reference) before touching anything this
broad, per AGENTS.md's own Plan Mode rule for changes larger than a small fix. The answers:
minimal and flat, but with bold contrast colour instead of muted neutrals; foundations first —
tokens, a couple of screens, sign-off, then propagate; reference "Linear but Barbie.com from
the 2000s."

**Choice.** Three changes to the primitive layer, each with a reason tied to a piece of that
brief:

1. **The neutral ramp (`--neutral-0`–`13`) is desaturated to true grey**, every step computed
   from the old ramp's lightness with saturation zeroed (not hand-picked, so the lightness
   steps — and therefore every component's existing light/dark relationships — hold exactly).
   `--page-light`/`--page-dark` follow: `#f5f5f5` and `#121212`, flat, no tint. This is the
   direct answer to "don't use the basic beige/lavender AI colours" and half of "minimal and
   flat": a page that doesn't compete with anything on it.
2. **The decorative gradient blobs (0068's `page-decor` utility, the `--color-decor-*`
   tokens) are removed outright**, not just recoloured — a flat page has nothing soft blurring
   its corner. Removed from `App.tsx` and `RunTopBar.tsx`; the now-dead CSS utility, its three
   primitives and their three `@theme`/dark-theme mappings deleted from `index.css`/
   `tokens.css`; the e2e accessibility spec's `contrastOverDecor` check (which only existed to
   verify text over those blobs) deleted with it, since there's no longer a gradient behind
   any text to measure. `--shadow-card` also loses its page-tinted colour (`rgb(29 34 80 /
   …)` → plain black) for the same reason: flat has nothing to tint a shadow with.
3. **`--color-primary` becomes a magenta-pink (`#c2185b` light, `#ff6ec7` dark), replacing
   indigo-blue; `--color-accent` becomes a chartreuse-lime (`#427000` light, `#a8e063` dark),
   replacing teal.** This is the "contrast colour, more creative" half, and the literal
   "Barbie" of the brief — picked as a specific, memorable hue rather than another
   SaaS-default purple/blue, the thing the first complaint was really about. Every primitive
   was computed and verified with the same WCAG relative-luminance script this project has
   used since 0005: both brand colours clear 4.5:1 as text against every surface they appear
   on, in both themes (5.4:1–7.4:1) — not just checked after picking a colour that looked
   right. The `--indigo-tint-*` wash (selected rows, the active tab's count) is regenerated
   from the new primary's hue rather than reused, so it doesn't clash with a pink brand colour
   while still looking blue.

**What stayed unchanged, on purpose.** Status colours (`--status-green/red/amber/slate/blue`,
the filled `StatusBadge` tints) and the `--mark-*` candy colours behind My Reviews' tab icons
are a separate system from brand (`src/styles/README.md`'s own long-standing rule) and already
gave the app most of its colour variety — touching them was never part of the brief and risks
the real thing they encode (pass/fail/waived/etc.). Type scale, spacing scale, radius and
motion are also untouched: the brief was explicitly "foundations first... then propagate
everywhere once you sign off," and colour is the foundation that was actually asked for.

**Consequence.** Because every component already read colour through semantic tokens
(`bg-primary`, `text-primary`, …), this propagated to the whole app with zero component edits
— the full `npm run check` suite, including all 35 Playwright e2e specs (axe WCAG checks on
every state, both themes), passed unchanged after only `tokens.css`, `index.css` and the two
files applying `page-decor` were touched. `src/styles/README.md`'s Contrast section numbers
were recomputed and rewritten to match, not left stale. One naming change worth knowing if
grepped for later: `--indigo-*`/`--teal-*` primitives are gone, renamed `--magenta-*`/
`--lime-*` throughout — a deliberate rename, not a partial one, so the primitive names
describe what they now contain.

---

## 0072 · The pill tabs' track gets a border, not just a fill

**Context.** The user flagged the pill-variant `TabsList` (Story/Evidence/All steps, and the
reviews-page type tabs) as reading as "not tabs" — no visible container, blending into the
page. The track's only definition was `bg-surface-raised` against `--color-bg`: in the current
cool-lavender palette (0068) those are `#f1f3f9` and `#eef1fb`, a difference small enough to be
imperceptible, especially under the page's own decorative gradient (0068's `page-decor`).

**Options.** (a) Darken `--color-surface-raised` itself, app-wide. (b) Add a dedicated token
just for this track. (c) Add a border to the pill track, matching how the `segmented` variant
already gets its definition from borders and dividers rather than fill contrast alone.

**Choice.** (c): `border border-border-subtle` added to the pill variant in
`components/ui/tabs.tsx`'s `tabsListVariants`. (a) would change a token used in many other
places (cards, hover fills, the pill variant's own active-tab fill is `bg-surface`, a separate
token) for a problem specific to one low-contrast pairing; (b) adds a token for what a border
already solves without touching the fill. A border reads as a container's edge regardless of
how close the fill and page background sit, which is the actual failure mode here — the same
reason `segmented` was never affected by this in the first place.

**Consequence.** One line changed, verified in both themes: the track now has a visible edge
distinguishing it from the page at a glance. The fix is local to the pill variant; the
`segmented` and `line` variants, and every other `bg-surface-raised` use, are untouched.

---

## 0071 · The home page is "My reviews"; the welcome intro moves with it

**Context.** The home page (no `?run=` given) opened straight on a run — `run-messy-pending`
by default — with "My reviews" one click away on `?view=reviews`. The user asked to flip
this: a reviewer should land on their list first, and open a run from there. They also asked
to move the welcome intro (the "Made by" signature animation, 0048/0049) to the new home page.

**Choice.**
- `App.tsx`'s routing inverts: `runId` (from `?run=`) is now `string | null`, not defaulted.
  No `runId` renders `MyReviews`; any `runId` renders `RunReviewPage`. `?view=reviews` is
  gone — a bare `/` already shows the list.
- `RunReviewPage`'s `reviewsHref` default changes from `?view=reviews` to `/`, so the
  breadcrumb's "My reviews" link (and `InProgressBox`'s own link back) point at the new home
  without every caller having to pass it explicitly.
- The welcome intro now renders only when `!runId` — over the home page, never over a run
  opened directly. **A reviewer who lands straight on a run** — a shared link, a
  notification — gets to work immediately; the credit animation is for the app's own front
  door, not for content someone was sent to. Because `markIntroSeen()` only ever runs inside
  the intro itself, a visit that starts on a deep-linked run and only later reaches the home
  page still gets the intro then, once — it is "once per visit the first time you reach
  home," not "skipped for the whole visit because you happened to land elsewhere first."
- `?delay=<ms>` now threads into `MyReviews` too (`listRuns` already accepted a delay; it just
  wasn't wired up), so the README's "any of the above" claim for that param is literally true,
  not just true for run pages.

**Consequence.** Every `/?view=reviews` reference in the e2e specs (`accessibility.spec.ts`,
`keyboard.spec.ts`) and the README's URL table moved to `/`; the three accessibility states
that used to reach the pending run via bare `/` now say `/?run=run-messy-pending` explicitly,
since `/` is no longer a run. `App.test.tsx` gained one new test (the intro is suppressed on a
direct run link even on a first visit) and lost the one asserting a bare-`/` default run,
replaced by one asserting the list heading instead. No change to `MyReviews` or
`RunReviewPage` themselves beyond the one default prop value — both already worked
standalone, reachable by URL, before this.

---

## 0070 · Every control on shadcn/ui

**Context.** AGENTS.md has always listed shadcn/ui in the stack. It was set up early
(`components.json`, the theme bridge, `cn()`) and three components were fetched (0013). The
screen was then built on hand-styled elements and Radix used directly, and nothing ever
imported from `components/ui/`. A later cleanup (commit a80a348) removed those three files as unused, and nobody flagged that the listed stack wasn't being used. The user noticed, and
asked for a full migration.

**Options.** (a) Restore `ui/` and use it for new work only. (b) Migrate the primitives most
used (Button, Dialog, Checkbox, Tabs). (c) Migrate every control. The user chose (c).

**Choice.** (c), one component per commit, with `npm run check` gating each:
- **Source:** fetched from shadcn-ui/ui's `new-york-v4` registry on GitHub, because
  ui.shadcn.com is blocked by this environment's egress policy. Imports point at our aliases.
- **Styling:** each file is restyled onto our tokens (type, spacing, colours, radius, focus
  ring), and the API stays shadcn's. shadcn's `accent` classes become `surface-raised`, since
  our `accent` is the brand teal (0007). Additions to shadcn's API, each noted in its file:
  - Button: `inline` size;
  - Tabs: our `segmented`, `pill` and `line` looks as variants;
  - Table: `containerClassName`;
  - Switch: `children` and `thumbClassName`;
  - RadioGroup: `RadioGroupSegment`;
  - Tooltip: its own provider;
  - Input: `fieldClassName`.
- **Components:** Badge, Button, Checkbox, Collapsible, Dialog, Input, NativeSelect,
  RadioGroup, Sonner, Switch, Table, Tabs, Textarea and Tooltip. Popover was fetched and not
  used: the filters open in place, as before.
- **Wrappers kept, now on shadcn:** `Modal` (Dialog), `Tabs`, `InfoTip` (Tooltip),
  `StatusBadge` (Badge), `ThemeToggle` (Switch) and `notify()` (Sonner, replacing `Toast`).
  Their APIs didn't change, so pages barely did. `tooltipPlacement.ts` and the hand-ported
  tooltip CSS are gone: Radix places tooltips itself.
- **Packages:** `class-variance-authority` and `sonner`. `radix-ui` was already installed.
- **`dark:`** now also follows the system's dark mode when no theme is chosen, as the tokens
  already did (0063).

**Found on the way, fixed:**
- **Focus return from dialogs.** Radix gives focus back to a `DialogTrigger`. Modal is opened
  by mounting it, so it records its opener and gives focus back itself.
- **A keyboard loop in Sonner.** Sonner gives focus back to where it was before the toast
  list whenever focus leaves the list. Tab out of the toast jumped back to the last row, and
  never reached the rest of the page. The toast is marked not dismissible (Sonner then skips
  that), and its body keeps its focus events to itself.
- **Unlayered CSS.** Sonner's stylesheet sets `outline: 0` outside Tailwind's cascade layers,
  which beats any utility. The toast's focus ring is marked important.
- **A lightening overlay.** The dialog overlay used `text-primary` and lightened the page in
  dark mode. `--color-modal-scrim` dims it in both themes.
- **Duplicate scroll containers.** The tables' scroll wrappers moved onto Table's own
  container.
- **The overflowing toast.** A long message made the toast wider than Sonner's list and put it
  over the Archive button. Toasts share one width, capped by the window.

**Consequence.**
- AGENTS.md now says controls come from `components/ui/`, and to add the shadcn component
  before hand-writing one.
- The one native control left is the step-group toggle in All steps. It has three states,
  which no shadcn component has.
- Tests find a Radix checkbox by role and `aria-checked`, and find toasts in the
  "Notifications" region.

---

## 0069 · Deeper, brighter accents in dark mode

**Context.** In dark mode, the progress bars, the selected tab's underline, "Needs your
review" and the tab-icon discs looked washed out. The user asked for them deeper and brighter.

**Options.** (a) One more saturated indigo for everything. It would have to stay light enough
for text, so the bars would stay pale. (b) A brighter amber and brighter discs, plus a second,
deeper indigo only for fills and underlines, which need 3:1, not 4.5:1.

**Choice.** (b), dark theme only:
- `--indigo-dark` is `#8a9dff` (text and links: 4.9:1 or more on every dark surface, over the
  circles too).
- `--color-primary-strong` is new: the same as primary in light, `#6b7fff` in dark (4.1–5.3:1).
  It's used for the progress bars and the selected tab's underline.
- `--status-amber-dark` is `#ffb224` (6.9:1 or more, and 7.5:1 on its own tint).
- The tab discs get their own dark values: `#ff9a1f`, `#4f8cff`, `#ff5a5f`, `#2ec46b`.

**Consequence.** Light mode is unchanged, except the amber dot next to "things to solve",
which shares the dark amber in both themes (0053). The discs' white icons are decoration next
to their label, as before.

---

## 0068 · A cool lavender-blue look across the app

**Context.** The user shared a mockup and asked for its colours and style across the whole
site. The mockup has:
- a lavender-blue page;
- white cards with soft corners and hardly any shadow;
- indigo-blue icons, links, step numbers and timeline dots;
- a blue disc, a mint disc and thin rings at the top right, behind everything.
The fonts (Raleway and Montserrat) and the layout were already the same.

**Options.** (a) Restyle components one by one. (b) Change the tokens, and add only what the
tokens can't express: the circles, and the card shadow.

**Choice.** (b):
- **Neutrals:** tinted cool blue. The page is `--page-light` `#eef1fb` in light and
  `--page-dark` `#111526` in dark.
- **Brand:** violet becomes indigo-blue (`--indigo-*`: `#3d55d4` light, `#93a5f7` dark).
- **Cards:** `--radius-lg` goes to 0.875rem and `--radius-md` to 0.5rem, and cards get
  `shadow-card`, a faint page-tinted shadow. It's flatter in dark.
- **Circles:** the `page-decor` utility, in `--color-decor-*` tokens, drawn as background
  gradients on `<main>`.
  - They're gradients, not an SVG element: with the SVG behind the cards, axe could not find
    any text's background.
  - They're fixed to the window, and the run page's sticky top bar repeats them. The bar then
    lines up with the page and still covers content scrolling under it. A see-through bar was
    tried and dropped, because scrolled card text showed through behind the bar's text.
- **Contrast:**
  - Every text colour clears 4.5:1 on the page, surface and raised surface, in both themes.
  - The light circles were lightened until secondary text, links and amber text clear 4.5:1
    over each of them. The first values left the thin ring at 4.39:1.
  - The accessibility spec now measures text over the circles against the page and every
    circle colour, and takes the worst case. Any other undecided result still fails.

**Consequence.** Components did not change, apart from the shadow class on cards and the top
bar. Two limits:
- The teal accent is under 3:1 on the new page (2.94:1). No component uses it; it would need a
  darker value first.
- Safari on iOS ignores `background-attachment: fixed`, so there the circles scroll with the
  page and the top bar's copy stays put. The two may not line up. It's decoration only.

---

## 0067 · My reviews rows show only the run's reference under the title

**Context.** Under each run's title, the table showed its id, the system and an environment
chip (`run-vat-estonia · ledger-sync · PRODUCTION`). The user found the system and the
environment unnecessary there. The reference is what matters: it's how a case is quoted and
found again.

**Options.** (a) Keep all three. (b) Keep only the reference.

**Choice.** (b). `RunCell` shows the title, then the id in monospace. `EnvironmentChip` had
no other use and is removed.

**Consequence.** The system and environment are still on the run page, in the Decision
details dialog and in reports. Search still matches the system's name, so typing
`ledger-sync` still finds the run.

---

## 0066 · No decision on a run that is still running

**Context.** Runs the agent or the checks are still working on are kept out of the My reviews
table (0061), but their own page, reachable by URL, still offered Approve, Request changes
and Reject. The page also asked for a decision in the overview, and called checks that had
not finished "not run".

**Options.** (a) Keep the decision panel, disabled, with a note. (b) Show a notice in its place
and refuse the decision in the api too. A disabled panel full of ticks and a reason field
suggests there is something to prepare, and there isn't until the checks finish.

**Choice.** (b):
- `isStillRunning(run)` in `lib/decision.ts`: no decision, and status `running` or
  `checks_running`.
- `InProgressBox` takes the decision's place: "Not ready for review yet", why (the same words
  as My reviews' Decision details), and a link back to My reviews.
- `submitDecision` refuses such a run with a `ValidationError`.
- Nothing to solve yet: no notice in the top bar, and no dot on the favicon.
- Wording: a check with no result is "not started" while the agent works and "still running"
  while the checks run (`noResultLabel`, `lib/gates.ts`). The overview of a checks-running run
  says the checks are still running, not "Read the run below, then decide". The Checks
  running badge got the grey dot the Running one has.

**Consequence.** A run can only be decided once it has stopped running. When a real backend
comes, it has to hold to the same rule, since the page no longer offers the choice.

---

## 0065 · The mustache heart favicon

**Context.** The user asked for a favicon in the "Mustache heart" style from their icon sheet
(1a): a heart with a mustache, half flat pink, half stripes, on a rounded lavender square.
The notification version from 0054 had to follow.

**Options.** (a) Redraw it as SVG, like the old icon. (b) Export PNGs at each size. SVG stays
sharp at every size, and the page already swaps icons by path.

**Choice.** (a):
- `public/favicon.svg` is redrawn with these colours: lavender `#cbc5f7`, outline and face
  `#2b1f5c`, pink `#ffc2e6`, stripes `#6b4fd8`. The stripes are clipped to the heart's right
  half.
- `public/favicon-attention.svg` is the same icon with the amber dot (`#e0a94d`, as in 0054)
  at the top right. The heart now reaches that corner, so the dot has a lavender ring to keep
  it apart at 16 px.

**Consequence.** `useAttentionFavicon` and index.html are unchanged. The icon's colours are
fixed, as a favicon's must be: they do not follow the theme.

---

## 0064 · Decisions hold across pages, and undo is real in the api

**Context.** Declining a run could end with it showing "Approved". There were three causes:
- **Undo was only on screen (0017).** After approving and undoing, the api still held the
  approval. The next Reject was refused as a conflict, and the page showed the recorded
  decision, "Approved". `run-messy` did this every time: it loads approved.
- **Every link is a full page load (no router), and the api kept decisions only in memory.**
  A run declined on its page went back to its fixture state in My reviews. On `/`, the
  declined `run-messy-pending` has a twin with the same title, `run-messy`, which is approved.
- **The approve button's pop (0051) opened its dialog after a 440 ms timer.** Pressing
  Reject within that time opened Reject, then swapped it for the approve dialog.

**Options.**
(a) A client-side router, so the in-memory store lives across pages. It is out of scope
(AGENTS.md), and a reload would still lose decisions.
(b) Keep decisions in sessionStorage and lay them over the fixtures on load. (c) localStorage:
then decisions last for good, and the demo can't be started over without clearing site data.

**Choice.** (b), plus a real undo:
- `api.ts` records each decision, or undo, in sessionStorage (`ledger:decisions`: run id →
  decision, or `null` for an undone fixture decision). It reads them back when the module
  loads. If storage is blocked, decisions last until the next load, as before.
- `undoDecision(runId)` in `api.ts` clears the decision inside its 10-minute window (0003) and
  throws `UndoClosedError` otherwise. `UndoBox` calls it, shows "Undoing…" while it runs, and
  shows an alert if it fails. This supersedes 0017's local-only undo.
- Request changes and Reject cancel a pending approve pop.

**Consequence.** A decision, and its undo, holds across pages and reloads in one tab; a new
tab starts every run over. The api, UndoBox, DecisionPanel and RunReviewPage tests cover
each of the three paths.

---

## 0063 · A light and dark theme switch at the top of the page

**Context.** The user asked for a switch between dark and light mode at the top of the page.
Both themes already existed: the tokens follow the system setting, and an explicit
`data-theme` on `<html>` overrides it.

**Choice.**
- `ThemeToggle` (components): a switch, announced as "Dark theme, on/off", with a sun and a
  moon. The active icon is in the brand colour, and the knob has its own border, so the state
  reads at a glance in both themes, not only from the knob's position.
- Until the viewer uses it, the page follows the system setting, and follows it if it changes.
  A choice sets `data-theme` and is remembered in this browser (`localStorage`,
  `ledger:theme`).
- A short script in `index.html` applies a remembered choice before the first paint, so a
  reload never flashes the other theme. If storage is blocked, the choice lasts until the page
  reloads.
- Placement:
  - the run page's top bar, at the far right, and beside the breadcrumb on narrow screens;
  - My reviews, after the Archive button;
  - the Archive view, across from "‹ My reviews".
  The welcome intro keeps its own fixed colours (0048).

**Consequence.** The theme is the viewer's choice, per browser. The keyboard spec checks
the switch by keyboard and that the choice survives a reload.

---

## 0062 · Archiving and restoring ask first

**Context.** The user asked for a warning dialog before a run is moved to the archive and
before one is restored.

**Choice.**
- "Move to the archive?" names the run (or lists the runs, for several) and says the
  consequence that isn't obvious: a run can be restored for seven days, then it locks, and a
  mistake can only be fixed with a new run.
- "Restore to My reviews?" says the decision and record stay exactly as they are, and how many
  days are left to restore.
- Cancel and Escape change nothing. Both dialogs use the shared `Modal`, like every other
  dialog.
- Focus moves after the dialog has closed: to the table after archiving, and to the Archive
  heading after restoring. While a modal is open the page behind it is inert, and the button
  that opened the dialog has gone with its row, so the dialog has nothing to hand focus back
  to.

**Consequence.** One more click for each archive or restore, in exchange for no surprise
lock-in. Both dialogs are in the unit tests and the keyboard pass; the archive one is in the
accessibility check in both themes.

---

## 0061 · My reviews gets 21 more sample runs, work in progress in two tabs, and a real archive

**Context.** With only four runs, most of My reviews was empty: no runs in progress, nothing
in Requested for change or Declined, and nothing in the archive. The user asked for more sample
runs, for the "still in progress" view in both Pending and Requested for change, and for
archived runs, some locked and one still restorable. They also asked for the page's visible
scrollbars to go.

**Choice.**
- The new runs are complete `Run` objects (`fixtures/sample-runs.ts`), not list-only rows.
  Every number in the list still comes from a run's own data (non-negotiable 3), and every row
  opens a real review. A small builder, `sampleRun`, makes each run from a short description,
  so the 21 stay consistent. Approvals accept exactly the open items the run's data produces,
  which a fixture test checks. Dates count back from when the app loads, so ages and archive
  states stay true.
- A new run status, `checks_running`: the agent has finished and the policy checks are still
  running. Nothing in the model could express that stage before, and the design shows it. It
  is the one addition to the spec's status list ("Running · Blocked · Awaiting review ·
  Approved · Changes requested · Rejected").
- Runs sent back for changes count as in progress: the agent is making the changes, and
  nothing waits on the reviewer. They sit in the "still in progress" fold of Requested for
  change, as "Agent is making changes". When a tab's table is empty only because everything is
  still in progress, it says "Nothing here needs you yet", not "No active runs match these
  filters".
- The archive holds four runs, archived automatically by the six-month rule: three past the
  seven-day restore window (locked) and one archived three days ago (restorable).
- Scrollbars: the tab list and the tables scroll with no visible bar (`scrollbar-none`), like
  Run details (0054). The Updated column's info tip now opens leftwards; opening rightwards it
  ran past the table and gave it 48 px of blank scroll.

**Consequence.** My reviews shows 21 active runs and 4 archived, in every tab. The page for a
run still in progress is only reachable by its URL, because in-progress rows are not links, and
it still offers a decision. The run page predates unfinished runs. Making it hold back
the decision until the run finishes is a follow-up.

---

## 0060 · My reviews is built to the Claude Design handoff, search, archive and reports included

**Context.** "My reviews" was a navigation-only list: the spec left out filtering, search and
statistics, and 0042 kept it minimal. The user then designed a full My reviews in Claude Design
("My Reviews.dc.html"), with search, filters, sorting, bulk selection, reports, an archive and
"Request a new run". Asked how much to build, they chose the whole design. Asked what data to
show, they chose the four real fixture runs over the design's 63 generated ones: every number
on screen must come from real data (non-negotiable 3).

**Choice.**
- Built as designed:
  - tabs by run type, with counts and "N need your review";
  - search over name, reference, service and requester;
  - filters: calendar time ranges, run type and requester;
  - sortable columns with info tips, "needs your review" pinned first when ordered by Updated;
  - runs still in progress, folded below the table;
  - selection, then Create report or Archive;
  - an Archive view: runs move there automatically six months after the decision, or by
    hand, and can be restored for seven days;
  - the Decision details, Request a new run and Create a report dialogs.
- The rules live in `lib/reviews.ts`, with a `now` parameter, so they are tested with fixed
  dates.
- No backend. Archiving, restoring and new-run requests change the page's own state only, and
  a reload starts over, like decisions. Reports are real files, made in the browser from the
  runs' data: CSV as a download, PDF as a print-ready page the browser saves. A PDF library
  would have been a new dependency, and the print route needs none.
- Where the build departs from the design, and why:
  - dialogs close with Escape or their Close button, like every other dialog here, with no
    corner ✕;
  - archive and restore also show a toast, because the row disappears and a screen reader
    needs to hear what happened;
  - the row tick box is a native checkbox;
  - the model has no "checks are running" status yet, so that stage never shows.
- The design is desktop-only. Below that width the tabs and the table scroll inside their card,
  and the page itself never scrolls sideways.
- New tokens, in both themes: a blue status tint for "Requested for change", a violet tint for
  selection, the tab marks and the toast colours. New components: the `line` Tabs variant,
  InfoTip and Toast.

Found and fixed while building it:
- dialogs opened in the top-left corner, on the run page too, because Tailwind's reset
  removed the auto margins that centre a modal `<dialog>`;
- invisible tooltips were transparent but still in place;
- the restore window counted one day too many for a run archived after the page loaded;
- the row tick boxes had no visible keyboard focus.

**Consequence.** The spec's Out of scope line changes: search, filters, an archive and reports
are now in scope for My reviews. Aggregate statistics dashboards stay out. All six new states
are in the accessibility check, in both themes, and My reviews has its own keyboard-only pass.
One axe limitation is worked around rather than ignored: axe does not model a modal's top
layer, so it calls some dialog text "partially obscured" by the page behind. Checked with
`elementsFromPoint`, nothing covers it, and setting `inert` or moving the dialog to `<body>`
does not change axe's answer. The spec measures that text's contrast in the browser instead
(6.7:1 to 16.7:1).

---

## 0059 · The final accessibility review is a lighter, time-boxed pass, not the full audit

**Context.** AGENTS.md (non-negotiable 4) planned one full accessibility and contrast review
near the end of the project. The timeline does not allow the full audit, so the user chose a
lighter, time-boxed version instead of skipping it. This entry records what that covers and
what it does not, so nobody reads "reviewed" as "audited".

**Options.** (a) The full audit as planned. (b) Skip it. (c) An automated check across the
composed page in both themes, plus one full keyboard-only pass, both kept as end-to-end specs
so they run on every `npm run check`.

**Choice.** (c), in Chromium at 1440 × 900.

What was checked:
- `e2e/accessibility.spec.ts`: axe-core 4.13 (`@axe-core/playwright`) with the WCAG 2.0,
  2.1 and 2.2 A and AA rules, colour contrast included. It ran on eight states: the pending
  run in Story, Evidence and All steps; the clean run; the blocked run; the decided run with
  the undo window open; My reviews; and the decision dialog. Each ran in light and in dark
  (16 cases), and the spec asserts the theme really switched. The contrast rule checked 108
  to 205 text elements per run page. It fails on any violation, and on any contrast result
  axe could not decide. A deliberately broken token turned up 43 failures, so the check
  bites.
- `e2e/keyboard.spec.ts`: the whole review with the keyboard alone, from the top bar to an
  undone approval. Tab, Space, Enter, the arrow keys and Escape; every stop on the way must
  show a focus outline. The full tab order was also recorded once by hand.

Found and fixed:
- The view tabs' tooltips sat inside the tab list as `role="tooltip"`, where only tabs
  belong (axe, `aria-required-children`, every run page). The tooltip is now `aria-hidden`;
  the tab still announces it through `aria-describedby`.
- "Jump to the open items" scrolled and spotlighted the list but left focus on the link.
  Focus now goes to the first item left to tick.
- Closing a dialog (Escape or Cancel) dropped focus to `<body>`. `Modal` now gives it back
  to what opened it.

Seen and left as it is: the tab order runs top bar, decision, then the view, while wide
screens show the view before the decision. That is the page order chosen so phones get the
decision before the long story (0046).

Not checked:
- screen readers (VoiceOver, NVDA, JAWS) by hand;
- zoom to 200% and 400%, reflow and text spacing (WCAG 1.4.4, 1.4.10, 1.4.12);
- browsers other than Chromium, and phone widths and touch;
- forced colours / Windows High Contrast;
- non-text contrast (WCAG 1.4.11): focus rings, status dots, borders and the tick boxes'
  outlines, which axe does not measure;
- states axe cannot see: hover-only tooltips, mid-animation frames (the approve pop, the
  spotlight), the welcome intro, and the loading, not-found and error states;
- a plain-language content review against non-negotiable 1.

**Consequence.** The automated checks now run on every `npm run check`, so contrast and ARIA
regressions in the covered states are caught from here on, not once. The items under "Not
checked" stay open: if the project goes further, they are the audit.

---

## 0058 · The top bar names the app, "Review agent runs", instead of "By Berit ❤︎"

**Context.** The user found the "By Berit ❤︎" mark (0057) distracting, and asked for a short
description of the app in its place.

**Choice.**
- "Review agent runs", in plain text, where the mark was: at the far left, before the
  breadcrumb, with the same thin rule. Heading font, semibold, meta size, primary text colour.
  No heart and no orange.
- It shows from md up only. On a 390 px phone it squeezed the run's name down to one letter,
  and there the breadcrumb matters more.
- It is still not a product logo, in line with 0042.
- The browser tab's title, asked for next, is "Review agent runs | By Berit Alasmäki". It was
  "Ledger — demo". The vertical bar is the thin divider the user asked for. Credit sits in the
  title, where it names the page without taking room in the interface.

**Consequence.** Replaces 0057. Checked in Chromium at 1440, 768 and 390 px. The bar is one row
at 1440 px, and at 390 px it shows the breadcrumb with the full "Move refund processing …".

---

## 0057 · A maker's mark, "By Berit ❤︎", at the top bar's left end (replaced by 0058)

**Context.** The user asked for a logo on the right side of the top navigation reading
"By Berit ❤︎", with the heart in orange. 0042 kept product logos out of the bar, because the
host platform owns those. This is a byline, not a product name, so it does not undo 0042.

**Choice.**
- A text mark, "By Berit", in the heading font, semibold, at meta size, in the primary text
  colour.
- The heart is U+2764 with the text-style variation selector (U+FE0E), so it is drawn as text
  in `--color-signature` (#e8590c, the intro's orange) and not as an emoji. It is
  `aria-hidden`, so screen readers say "By Berit".
- Placed at the far left, before the breadcrumb, with a thin rule between them, where a
  logo usually sits. The user first asked for the right side, then moved it to the left. The
  bar's order is mark | breadcrumb, then what is open at the right end from md, or on a row of
  its own under them on narrow screens, where the initiative name truncates to make room.
- The page passes the open-items notice only when there is something to solve, so a run with
  nothing open has no empty second row. It uses the same condition as the favicon dot (0054).

**Consequence.** Checked in Chromium at 1440, 800 and 390 px, light and dark, on both the
right and the left placement. The heart computed to rgb(232, 89, 12). The bar is one row on wide screens and on a clean phone run, and
two rows on a phone when things are open.

---

## 0056 · "Jump to the open items" spotlights the list it lands on

**Context.** The user asked for the tick list to be highlighted after "Jump to the open
items". They asked for a spotlight: a large, semi-transparent dark border around the area,
thick enough to show, appearing and going away quickly, but slowly enough for the eye to
track.

**Choice.**
- `.t-spotlight` in `transitions.css` is an animated box-shadow on the list: a 0.5 rem ring in
  the card colour, then a `100vmax` spread of `--color-spotlight-scrim` (black at 50%) that
  covers any window.
- The list is raised to z-index 30 while it plays, above the sticky bar and tabs, so they dim
  too.
- Timing, 1.3 s in all: in over the first 15% (about 0.2 s), held until 62% (about 0.8 s),
  then out over about 0.5 s.
- `lib/spotlight.ts` restarts it on every click and removes it on `animationend`, or after
  1.6 s if the animation never runs.
- The link keeps its `#open-items` href for no-script use. With script, it scrolls itself and
  spotlights.
- The spotlight fades opacity only; nothing moves, so it plays for reduced motion too.

**Consequence.** Checked in Chromium from 1500 px down the page. The page dims while the list
scrolls into place, and the list is under the bar by 450 ms. The attribute was gone by
1500 ms.

---

## 0055 · Each open item links to where it is shown in full

**Context.** The user asked for links on the open items in "Confirm each open item", taking the
reviewer to each problem, to make the task faster.

**Choice.**
- Each `OpenItem` carries a `target`:
  - a check item goes to its first gate's card in the story ("Show the check →", or "Show the
    checks →" for several);
  - a low score goes to its score card ("Show the score →");
  - a warning note goes to its own row in All steps ("Show the step →"), through the page's
    existing `showStep`.
- The link is a button under the item text, outside the tick's `<label>`, so following it
  never ticks the item.
- The page switches to Story if needed, then scrolls the card to the middle of the window,
  clear of the sticky bar and tabs, and focuses it.
- The cards are `tabIndex=-1` with ids from `openItemTargets.ts`. While focused they show the
  focus ring, so the reviewer sees where they landed.
- If the story does not show the card, the story heading takes focus.
- Without `onShowItem`, as in stories, there are no links.

**Consequence.** Checked in Chromium. From the Evidence tab, "Show the score" opened Story
with the Side effects card focused and in view, and "Show the checks" did the same for the
licensing card. "Show the step" opened All steps on the nightly-reconciliation row.

---

## 0054 · "Run details" scrolls on its own; an amber dot on the tab's icon

**Context.** From xl up, the "Run details" column sticks under the top bar. In a window
shorter than the card, its lower part could not be reached until the middle and right columns
had scrolled to the end. The user asked to fix the left panel's scrolling. They also asked for
an amber dot on the favicon, so the browser tab shows that a run has things to pay attention
to.

**Choice.**
- Scrolling: from xl up, the card is capped at the window's height below the bar
  (`100dvh − --run-bar-height − 2 × --space-4`) and scrolls on its own
  (`overflow-y: auto`, `overscroll-behavior: contain`). No scrollbar is drawn
  (`scrollbar-none`, in `index.css`), because the user found it untidy. The wheel, trackpad,
  touch and keyboard still scroll the card, and its cut-off bottom edge shows there is more. The page measures whether the card
  overflows. Only then is the card a tab stop (`tabIndex=0`), so a keyboard can scroll it, and
  screen readers name it "Run details" from its heading. Below xl it is not sticky, and nothing
  changes.
- Favicon: `public/favicon-attention.svg` is the same icon with an amber circle (#e0a94d, the
  dot token's colour, 0053) in its top-right corner (redrawn in 0065). `useAttentionFavicon` swaps the
  icon link to it while the run shown has open items and no decision. It puts the original
  back after a decision or when the page leaves, so "My reviews" and clean runs keep the plain
  icon. It is visual only; the page's own notice says the same in text.

**Consequence.** Checked in Chromium, in a 1440 × 700 window. A wheel over the card scrolled
it to its end, 198 px, while the page stayed put. A wheel over the middle scrolled the page
and left the card alone. In a 1400 px tall window the card fit, and was neither scrollable nor
a tab stop. The favicon was the dotted one on the pending run, and the plain one on the clean
run and on "My reviews". The dot shows clearly at 16 px.

---

## 0053 · What is open moves into the top bar, as one line

**Context.** Before a decision, a yellow card at the top of the right column said how many
things were open, in a sentence, with a link to the tick list. The user asked to move it into
the top navigation, as one line: a yellow dot, "3 things to solve", then the link, with no
yellow background and no description. "Your decision" then moves up to the top of the right
column.

**Choice.**
- `OpenItemsBox` becomes `OpenItemsNotice`, placed at the right end of `RunTopBar` through a
  new `end` slot, and only before a decision. The bar wraps it to a second row on narrow
  screens.
- The wording changes from "are open" to "to solve", as the user asked.
- When nothing is open it shows nothing, since the decision panel already asks for no ticks.
  The old "Nothing is open" card goes too.
- `describeOpenItems`, which only wrote the description, is removed from `lib/openItems.ts`.
- The dot gets its own token, `--color-status-waived-dot`, set to the brighter amber
  (#e0a94d) in both themes. The status amber for light mode is dark enough for text, so it
  read as brown. The dot is decoration, and the label beside it says the same thing.

**Consequence.** Checked in Chromium at 1440, 1024 and 390 px, in light and dark. The link
lands the tick list just under the sticky bar at every width, because the panel's scroll
margin already follows the bar's measured height.

---

## 0052 · The view tabs sit above the view they switch

**Context.** The Story / Evidence / All steps tabs were in the sticky top bar, next to the
breadcrumb. The user asked to move them above "What happened, in order", because that area is
the only part of the page they change.

**Choice.** A new `RunViewTabs`, at the top of the middle column, between the overview card and
the view. The top bar keeps only the breadcrumb. The tabs are sticky too, just under the top bar
(`--run-bar-height`), so a long view can still be switched from anywhere in it (0044). Their
height is measured into `--run-tabs-height`, so a view heading that a tab click scrolls to
lands just below them. The sticky "Run details" column and the decision column stay clear of
the bar only. The tabs stay sticky only inside the view's column: below xl, the decision panel
comes before the view, and the tabs don't follow the reader there.

**Consequence.** Checked in Chromium at 1440 and 390 px wide. Scrolled 1400 px down in the
story, a click on Evidence scrolled back so the Evidence heading sat directly under the tabs,
and took focus. 0044's focus behaviour is unchanged.

---

## 0051 · "Approve and release" pops, then asks for confirmation

**Context.** The user shared a short video of a button press: the button squashes, springs
past its size, bounces and settles, and its label pops back in. They asked for the same on
"Approve and release".

**Choice.** The same motion, timed from the video at 30 fps, as `.t-pop` keyframes in
`transitions.css`. The button goes to about 0.94 × 0.9, up to 1.05, down to 0.985, and
settles within 420 ms. The label shrinks away and pops back with a 1.12 overshoot. Our dark
button colour stays; the video's blue does not. The confirmation dialog opens when the pop
ends, about 0.44 s after the click, so the modal doesn't hide the animation. A timer opens
it, not `animationend`, so it opens even if the animation never runs. A second click during
the pop does nothing. Reduced motion, or no `matchMedia` (jsdom), means no pop and no wait.

**Consequence.** Checked in Chromium. The transform sampled over time follows the keyframes,
and the dialog opened at about 470 ms. With reduced motion, the dialog opened at once. The
other decisions (Request changes, Reject run) do not pop: approving is the one celebrated
action (0046's success check is its pair).
## 0050 · The loading state is the `thinking-orbs` orb, centred, with its label under it

**Context.** The user asked to replace the plain "Loading…" text with
`<ThinkingOrb state="working" size={64} />` from the `thinking-orbs` package, with the text
under it, centred instead of left-aligned.

**Choice.** A new dependency, named by the user, `thinking-orbs@0.3.2`. It is pinned exactly,
because 0.x versions may break on a minor release. Checked before installing (`npm pack`): MIT
licence, React as its only peer, no install scripts, and no network code. It paints on a
canvas.
- `components/LoadingState.tsx` is used by the run page ("Loading run…") and "My reviews"
  ("Loading reviews…"). The label is the `role="status"` text, and the orb is `aria-hidden`,
  so screen readers hear the status once instead of the label plus the orb's own label.
- Centred both ways. By default it fills the screen height (`min-h-dvh`), because it is the
  page's only content. "My reviews" gives it a shorter area under its heading.
- The orb picks its own ink: it reads `data-theme` and `prefers-color-scheme`, as the app's
  tokens do. For reduced motion it shows a still frame.
- `vitest.setup.ts` stubs `HTMLCanvasElement.getContext`, because jsdom has no canvas. The
  drawing itself is checked in a browser.

**Consequence.** One more runtime dependency. Checked in a browser: the orb (64 × 64) and the
label are centred at 640, 400 on a 1280 × 800 window, and at the middle of a 390 px phone, with
dark dots in the light theme and light dots in the dark theme. The welcome intro's handoff to
the loading state (0048) is unchanged.

---

## 0049 · The welcome intro plays once per visit, not once ever

**Context.** 0048 showed the intro once per browser, for good (localStorage). The user asked
for it every time someone comes back to the website.

**Options.** (a) Every page load. (b) Once per visit: a browser session, meaning a new tab or
window, or a return after closing it.

**Choice.** (b), by keeping the same `ledger:intro-seen` flag in sessionStorage instead of
localStorage. (a) would replay the whole four-second intro on every breadcrumb or "My reviews"
click, because those links reload the page. The old localStorage flag is removed the next time
the intro finishes or is skipped, so it doesn't linger. Reduced motion still skips the intro,
and any input still dismisses it.

**Consequence.** Checked in a browser. The intro showed on a first visit, on a new tab, and in
a new browser session. It did not show on a page load inside a visit, or on a reload in the
same tab. For the literal "every page load", `shouldShowIntro` would drop the flag check.

---

## 0048 · A one-time welcome intro, laid over the page and never in its way

**Context.** The user asked for a one-time intro before the first page load in a browser. The
signature mark draws itself in orange and resolves to black. The name and title type on, then
"Made by", a hold, and a fade. It must stay separate from the data-loading state, and skip
itself for reduced motion or on any click, tap or key.

**Choice.**
- `App.tsx` mounts the page and the intro together. The page starts loading its run at once,
  underneath. If the intro ends first, the page's own "Loading run…" state is already there,
  with no second waiting treatment. Checked in a browser with `?delay=6000`: after the fade,
  "Loading run…", then the run.
- First visit only (changed to once per visit in 0049): `ledger:intro-seen` in localStorage, set on completion or skip. If storage
  is blocked, the intro is treated as seen instead of showing on every visit.
- `SignatureMark.tsx` uses the supplied path data untouched, plus two attributes: `pathLength`
  for the draw, and `data-resolved` for the ink change. Checked in the browser: its bounding
  box is 177.3 × 100 in the 178 × 101 viewBox.
- **The name and title are typed as real text** in `--font-heading` (Raleway), not drawn from
  the supplied name and title SVGs: typing character by character needs characters. The
  title's capitals and wide spacing follow the supplied title SVG ("UX & PRODUCT DESIGNER").
- **The name and title are one left-aligned block, centred under the mark, and the title
  spans exactly the name's width** (the user's reference image). The title's letter spacing
  is computed, not fixed: the name's width minus the title's natural width, spread over the
  gaps between its characters. It is measured again once `document.fonts` is ready, so the
  edges meet whatever font renders. Checked in a browser: both lines run 530–750 px at
  1280 px wide, and 85–305 px at 390 px.
- **The mark sits on the bottom of its 200×200 box** (`preserveAspectRatio="xMidYMax meet"`),
  so it reads as one group with the name, as the user asked. The artwork is 178 × 101, so
  centred it left about 43 px of empty box under it. The gap to the name is now 13 px, and
  "Made by" is placed level with the drawn mark's middle.
- **A new colour, `--signature-orange` (`--color-signature`)**, for the drawing stroke. The
  brand accent (`--color-accent-hover`) is teal, not orange. The only warm tone in the tokens
  is amber, which belongs to the status palette and must not be used for non-status UI.
  The overlay tokens (`--color-intro-scrim`, `-ink`, `-muted`) are the same in both themes on
  purpose: the logo is black ink on white.
- The overlay is `aria-hidden` and holds nothing focusable, so it never traps focus. A key press
  skips it through a window listener; a click or tap skips it through the overlay itself.

**Consequence.** The intro's timings live in two places that must agree: `INTRO_TIMING` in
`app/intro.ts` (the timeline) and the `--intro-*` variables in `app/intro.css` (the CSS
durations). `?delay=<ms>` is now a supported URL knob for showing the loading state on purpose.

---

## 0047 · Three transitions.dev transitions, ported by hand

**Context.** The user asked for three transitions from transitions.dev: "Success check" when
approving, "Tooltip open/close" on the view tabs, and "Tabs sliding" for the tab pill.

**Options.** (a) Run `npx skills add` / `npx transitions-dev add` in the repo. (b) Read the
recipes and port the CSS and JavaScript into the project by hand.

**Choice.** (b). `npm pack transitions-dev@0.3.0` showed that the package is Markdown recipes
(CSS plus a little JavaScript, MIT) and a copying CLI, with no runtime library. AGENTS.md asks
before adding tooling, and there was nothing to install. `src/styles/transitions.css` keeps
each recipe's `.t-*` classes, its motion variables (duration, easing, distance, blur, scale)
and its `prefers-reduced-motion` guard. Changes from the recipes:
- colours point at semantic tokens, so dark mode works;
- the tooltip opens below its tab and is nudged inside the window (`--tt-shift`, measured in
  `Tabs.tsx`), because the tab bar sits at the top right;
- Escape dismisses the tooltip (WCAG 1.4.13), and the tooltip is linked by
  `aria-describedby`;
- the check uses `pathLength="1"` instead of a measured dash length.
- `Tabs` (pill variant): one sliding pill behind the tabs, following `data-state`, so every
  way of selecting a tab moves it. The first placement and any resize snap without sliding.
- `UndoBox`: the header now names the outcome ("Approved") beside the check. For a decision
  made on this page, the check plays and focus moves to the header. Before this, the Approve
  button disappeared and focus fell back to the top of the page.

**Consequence.** Measured in a browser: the pill slides from 4 px to 181 px over about 250 ms
on the recipe's curve, and at 1280 and 390 px no tooltip leaves the window.

---

## 0046 · Three columns: Run details on the left, no collapsing header

**Context.** The user's next design iteration moves the labelled facts out of the header into
their own left-hand column, "Run details". The header becomes a card above the story. The
right column starts with what is open (or, after a decision, the undo window). The "Show
details" / "Hide details" button is removed.

**Choice.**
- `RunDetails.tsx` (new): *The change* (where it would go, what would be released, run
  reference) and *The run* (requested by, agent, ran, checks, lowest score). From `xl` it is
  sticky under the top bar.
- `RunOverview.tsx` is now only the card: status, initiative, why the agent was asked, where
  the run is now. `OpenItemsBox.tsx` (new) heads the right column before a decision; `UndoBox`
  heads it after.
- The grid is three columns from `xl` (17.5rem | 1fr | 21.25rem). From `md` it is two
  columns, with the details under the overview. On phones it is one column, in the order
  overview, decision, details, view, so the decision is never at the bottom.
- The right column is no longer sticky: before a decision it is taller than the screen, and a
  sticky element taller than the viewport hides its own lower part.

**Consequence.** This replaces the collapsing part of 0044, and all of 0045:
`useUndoActive` and the details state are gone, because nothing collapses any more. The
sticky top bar, focus moving to the chosen view, and manual tab activation from 0044 stay.

---

## 0045 · While a decision can be undone, the details always show

> Replaced by 0046: the details no longer collapse.

**Context.** 0044 let the details collapse after a view change. That hid the undo countdown
and the Undo button in the header. The user asked for the details to always show while the
Undo button is visible.

**Choice.** `useUndoActive` (in `features/run/`) reports whether the undo window is open, and
flips by itself when it closes, using one timer for that moment. While it is open:
- `RunOverview` shows the details whatever `expanded` says, and does not offer the toggle.
- `RunReviewPage` doesn't collapse the details on a view change.
- A decision made on the page opens the details.

**Consequence.** When the window closes, the details stay open: nothing collapses under the
reviewer, and "Hide details" appears again. This replaces 0044's note that the collapsed row
has no undo countdown. The collapsed row can no longer appear while undo is possible.

---

## 0044 · Switching views moves focus, the top bar is sticky, and the details collapse

> The collapsing details are replaced by 0046. The sticky bar and the focus move still hold.

**Context.** After PR #10 the user found that clicking "Evidence" looked like nothing
happened: the view changed below the long overview, off screen. They asked for: focus to move
to the chosen view on every tab change, the top bar to stay in place, and the overview details
to show on first load but hide once the reviewer switches views. A "Show details" / "Hide
details" button sits in the middle of the header's bottom border (reference image in the
conversation).

**Choice.**
- `RunTopBar` is `sticky top-0`. The page measures its height (`ResizeObserver`, since it wraps
  to two rows on narrow screens) into `--run-bar-height`. Headings scrolled to, the "Jump to the
  open items" target and the sticky right column use that height to stay clear of the bar.
- Choosing a tab moves focus to the view's heading (`SectionHeading focusTarget`,
  `tabIndex={-1}`). The heading is scrolled into view only when it isn't already in the top half
  of the screen. Focus moves one animation frame later: Radix selects a tab on mousedown, and
  the browser's default then focuses the clicked tab, which would undo an earlier focus move.
- The tabs switch to **manual activation**. With automatic activation, every arrow key press
  would select a tab and pull focus out of the tab list. Now arrow keys only move along the
  tabs, and Enter, Space or a click selects (the WAI-ARIA tabs pattern for this case).
- `RunOverview` takes `expanded`. On load it is expanded. Any view change, including a "Show
  all 180 steps" link, collapses it to one row: status, initiative (truncated), system,
  environment, revision, and "N open items" linking to the tick list. The toggle is centred on
  the bottom border in both states, so it doesn't move when pressed.

**Consequence.** The environment and status stay visible in the collapsed row, so Scenario
S6's "environment visible without scrolling" still holds. The undo countdown only shows when
the details are open. Once decided, the collapsed row shows the Approved status but not the
remaining time.

---

## 0043 · Two real bugs found while building the story layout

**Context.** Browser screenshots and a new test caught two bugs. Both were already in the code
before this redesign.

1. **`cn()` dropped type-scale sizes.** tailwind-merge only knows Tailwind's own size names. It
   read `text-meta` as a text *colour*, so when a colour class such as `text-text-secondary`
   came later in the same `cn()` call, the size was silently removed. The step-list rows showed
   this: some rows rendered at the browser default size. `StatusBadge`'s tinted tones were
   losing `text-badge-label` in the same way.
2. **`explanationFor` could explain a gate with the wrong event.** It returned the first
   evidence event that had any `detail`. run-messy's licensing gate lists a file change before
   the scanner's own result, so "did not run" was explained with a file's description.

**Choice.** `lib/utils.ts` builds `cn` with `extendTailwindMerge`, and registers the nine
`--text-*` names as font sizes (tested in `utils.test.ts`). `explanationFor` now prefers the
gate's own `gate_eval` event and falls back to the first event with a detail.

**Consequence.** A new `--text-*` token must also be added to `TYPE_SCALE` in `lib/utils.ts`.
If it is not, the same silent drop comes back. The comment in `utils.ts` says this.

---

## 0042 · The page lives inside a host platform: no wordmark, a breadcrumb, one date format

**Context.** The redesign treats the review page as one area inside a bigger service platform
that already has its own navigation (from the design chat: "this page would be part of another
service platform"). The user confirmed that the LEDGER / DEMO wordmark goes (0035).

**Choice.**
- `App.tsx` has no wordmark and no chrome of its own. The page starts with `RunTopBar`: "‹ My
  reviews › <initiative> [revision]", with the three views on the right.
- "My reviews" goes to a minimal `ReviewList` (`?view=reviews`, backed by a new `listRuns`).
  The spec's Out of scope already allowed a list for navigation only.
- Run ids and revisions are labelled fields with one plain line each ("Quote this to find the
  review again later."), instead of bare chips in a header row.
- Dates part of the record use one format: `2026-09-23 · 10:02–11:51 (UTC+3)`.
  `formatUtcOffset` works out "UTC+3" from the offset, not from a zone abbreviation, which
  depends on the runtime ("EEST", "GMT+3").
- People in the fixtures have Finnish names: Maarit Kasakallio, Juhani Virtaleppäsoutu, Aino
  Lehtomäki and others. The messy run's times moved to 2026-09-23 07:02–08:51 UTC, which shows
  as 10:02–11:51 in Finland, as in the design.

**Consequence.** `AnchorNav` stays in `components/` with its story and tests, but nothing uses
it now. It is a design-system part, not a feature.

---

## 0041 · Confidence levels get colour, and warning numbers may be amber text

**Context.** The redesign pairs each percentage with a level (High / Medium / Low, coloured
green / amber / red) and an action ("Check this yourself before approving"). It also shows
"2 not run" and "52%" in amber text. This goes against 0032 (confidence stays one neutral tone)
and 0006 (status colour is never text). Asked the user, who confirmed: follow the design.

**Choice.** `lib/confidence.ts` `confidenceLevel`: 85 % and above is High, 60–84 % is Medium,
below 60 % is Low. The value is rounded first, so the level always agrees with the number
shown. The cut-offs are this app's own policy, not the model's. The level chip uses the
existing tint pairs, plus one new pair, `--color-status-fail-tint-bg/-fg` (5.67:1 light,
6.57:1 dark). Amber as text uses `--color-status-waived-tint-fg`: 5.4–5.9:1 on every light
surface, 6.7–7.5:1 in dark.

**Consequence.** This replaces 0032, and is a scoped exception to 0006: warning numbers and
"not run" counts only. The level is always written as a word, so colour is never the only
signal.

---

## 0040 · Approving means ticking every open item, and giving a reason when checks are missing

**Context.** The spec asked for one tick for failed or waived gates, and no reason for an
approval. The redesign, following the People + AI Guidebook's "more risk, more care", asks the
reviewer to tick each open item separately. That includes checks that did not run, a Low
score, and warning notes. It also asks for a written reason when any check failed or did not
run. The user confirmed this rule.

**Choice.** `lib/openItems.ts` builds the items: failed, not-run and waived gate groups, each
Low area, each warning note. `approvalNeedsReason` says when a reason is required.
`Decision.acknowledgedGateIds` became `acknowledgedItemIds`, and `submitDecision` rejects an
approval without a reason when the rule applies. The spec's Region 6, Content rules and
acceptance criteria were updated.

**Consequence.** The single "I have seen 1 failed check and 1 exception" tick
(`formatSignOffMessage`, `gateAcknowledgement`) and the "Before you approve" digest
(`attention.ts`) are gone. `openItems.ts` does both jobs now.

---

## 0039 · "Approve and release" is the only filled button; Reject run gets a red outline

**Context.** Spec S2 and 0033 kept the three decision buttons identical and neutral. The
redesign gives the decision panel a clear order: Approve is the one filled (dark) button, then
a divider ("or, if it is not ready"), then Request changes (neutral outline) and Reject run (red
outline). Each button has one line saying what happens next. Asked the user, who confirmed:
follow the design.

**Choice.** Approve uses the same inverted neutral tokens as Undo (`bg-text-primary` /
`text-surface`), not a brand colour, and stays disabled until the 0040 rule is met, with a hint
saying what is left. Reject uses `--color-status-fail` for its border and text.

**Consequence.** S2's "no brand colour on the decision actions" still holds. "All three look
the same" does not. The filled button can't become a reflex, because it only turns on after
every open item has been ticked.

---

## 0038 · The story layout replaces the six stacked regions

**Context.** The Claude Design handoff ("Ledger Review Redesign", design 1a before a decision
and 1b after) replaces the six stacked cards with: an overview header, three views (Story,
Evidence, All N steps), and a right column that stays in place.

**Choice.**
- **Story is data.** The prose can't be derived from timeline events, so it is a new field,
  `Run.story`: steps with evidence ids, like `summary`. A step whose evidence doesn't resolve is
  dropped (`lib/story.ts`). Times are computed from the evidence. Scores
  (`confidenceAreas`) and checks that need attention (`gateIds`) sit in the step where they
  happened. `Run.assignment` holds "why the agent was asked".
- **Evidence** groups the events the claims rest on (`lib/evidence.ts`). **All N steps** is the
  full audit log. Runs of 10 or more repeated steps fold into one row that says how many it
  holds (`lib/steps.ts`), and errors and warnings never fold.
- **Pending and decided are one layout.** The run's `decision` picks the header box (open
  items, or undo) and the right column (decision panel, or the record).
- **"Run check again"** is local only, like Undo (0017). It records the request and does not
  change the gate's result.

**Consequence.** The timeline's type filters (0031) are gone: the step list shows everything,
and the Evidence view is the filtered reading. `Run.summary` stays in the data model and in
`lib/summary.ts`, but the page no longer shows it. "Where the run is now" is built from gates
and confidence instead. Numbers the mockup showed that are not in the data (a "+214 −97 lines"
diff size, per-check run times) were left out, not invented.

---

## 0037 · Second correction pass: card padding, band bleed, pill contrast, tab hover

**Context.** After PR #8 merged, the user supplied four more reference images and asked for a
second round of fixes: a "Deselect all" quick action on the timeline filter dropdown,
`ConfidencePanel`'s percentage band matching the mockup's edge-to-edge look (it still had
padding around it after 0036's restructure), the `ActorName` pill in `DecisionBar`'s decided
view no longer blending into its own card background, more padding and gap around
`RegionCard` content generally, and tab hover changed from a background fill to an underline.

**"Deselect all": a real `DropdownMenu.Item`, not a plain `<button>`.** The natural first
build was a plain `<button>` dropped into the menu next to the checkbox items — it renders
and is reachable by `Tab`, so it looks correct at a glance. A Playwright keyboard trace showed
the real problem: a raw button doesn't join Radix's roving-focus `ArrowUp`/`ArrowDown` group,
so once a user is navigating the menu by arrow key (the expected pattern once any item is
focused), "Deselect all" is silently unreachable — present, focusable by `Tab` alone, but
invisible to the same navigation everything else in the menu uses. Converting it to a real
`DropdownMenu.Item` (disabled when `hiddenTypes` is already empty, `onSelect` calling
`event.preventDefault()` to keep the menu open, matching the existing checkbox items'
behaviour) fixed this — it now participates in the same roving-focus group as every other row.
A follow-up trace also caught a false alarm worth recording: `Tab` and the initial auto-focus
correctly skip a *disabled* item, per standard ARIA behaviour, which briefly looked like a
second bug before a cleaner trace ruled it out.

**`RegionCard`'s default padding moved from `--space-4` (16px) to `--space-5` (24px), app-wide,
not per-region.** The user's ask ("Summary and before-you-approve card sections should have
more padding") named two regions, but every `RegionCard` in the app shares the same default —
special-casing two call sites would have meant carrying two padding scales side by side for no
visible reason, since the mockups don't show tighter padding anywhere else either. `Tabs`'
horizontal padding and `PolicyGateList`'s tab-bleed negative margin were both bumped from
`--space-4` to `--space-5` in the same change, since both exist specifically to align with
`RegionCard`'s own inset.

**`ConfidencePanel`'s band bleeds to the row's own edges via `overflow-hidden` + the parent's
`rounded-md`, not its own border-radius.** 0036 already established this "zero the shared
padding, re-add it only where content needs it" pattern for `RunHeader`'s Disclosure and
`PolicyGateList`'s tab bar; this is the same pattern applied a third time. The alternative —
giving the band its own `rounded-l-md` to match the card's corner radius — was rejected
because it hard-codes a radius value that has to be kept in sync with the parent's whenever
either changes; `overflow-hidden` clips whatever radius the parent actually has, so there is
nothing to keep in sync.

**`ActorName`'s `bg-surface-raised` default was overridden with `className="bg-surface"` at
exactly one call site (`DecisionBar`'s `DecidedView`), not changed globally.** Every other
place `ActorName` renders sits on a plain `RegionCard` (`bg-surface`), where the pill's default
fill already contrasts correctly — `DecidedView` is the one context that itself uses
`bg-surface-raised`, which is what caused the collision. Changing the component's own default
would have fixed this one case and broken every other one.

**Tab hover: `hover:underline`, not `hover:bg-surface-raised`.** A pure CSS property swap on
`TabsTrigger` — the mockup's inactive-tab hover state is a text underline, not a background
change, and Playwright confirmed both `text-decoration-line: underline` and `cursor: pointer`
on hover after the change.

**Consequence.** `RegionCard`'s padding bump is the one change in this round with real
downstream reach — it affects every card in the app, not just the two the user pointed at, so
any future card-density work (a denser "compact" variant, say) should treat 24px as the new
baseline, not 16px. Every other change in this round is scoped to one component or one call
site. Re-verified end to end: full `npm run check` (typecheck, lint, theme-bridge,
format-locale, 222 tests) green, and a real-browser Playwright pass across all three fixtures
in both themes confirmed no console/page errors from the app itself (one `ERR_CERT_AUTHORITY_
INVALID` on the Google Fonts `<link>` is this sandbox's own egress policy blocking an external
resource, unrelated to any change here, and not present outside this environment).

---

## 0036 · Correction pass: alignment, spacing and two component-API extensions

**Context.** After PR #7 merged, the user compared the result against the original mockups
directly (not from memory) and found real drift: `ActorName` pills misaligned against their
label text, `RunHeader`'s "Show details" panel squeezed into a narrow right-aligned box
instead of the full card width, inter-item spacing under the mockup's ~24px rhythm in several
regions, and `PolicyGateList`'s tabs looking nothing like the mockup's full-width segmented
control. Fixed all of it against the actual mockup images, not approximated from memory.

**Two shared components needed real API extensions, not just call-site tweaks:**

1. **`Disclosure` gained `summaryClassName`/`contentClassName`.** `RunHeader`'s and
   `ConfidencePanel`'s "Show details" rows need to sit flush inside a card that already
   supplies its own padding — Disclosure's default `px-4 py-3` on both the summary and the
   content wrapper doubled that inset. The existing single `className` prop only reaches the
   outer `<details>`, not those two inner elements, so reaching them required two new,
   narrowly-scoped override props rather than duplicating Disclosure's whole structure at
   each call site.
2. **`Tabs`/`TabsTrigger` gained an `icon` prop and a full-bleed-friendly `TabsList`.** The
   mockup's tabs are a full-width segmented bar with an icon per tab and no rounding (so a
   caller's own `-mx-[var(--space-4)]` can bleed it to the card's edge) — a real visual
   language change from the small underlined text-link tabs shipped in PR #7, not a colour
   tweak.

**Two mockup details deliberately not matched exactly, and why:**

- **Tab width.** The mockup's two tab segments look asymmetric (~25%/75%), which reads like
  two manually-sized Figma rectangles rather than a deliberate rule — nothing in the design
  ties the ratio to tab content length or active state in a way that would generalise. Built
  both tabs `flex-1` (equal width) instead: a standard, predictable segmented-control
  behaviour that doesn't depend on which tab happens to be active or which label is longer.
- **`ConfidencePanel`'s "Not checked" icon.** The Confidence mockup's icon for this state
  looks like a plain exclamation-in-a-circle, slightly different from `CircleHelp`. Kept
  `CircleHelp` anyway: it's the same icon `StatusBadge`'s `info` tone already uses for the
  identical semantic state (`docs/DECISIONS.md` 0028), and switching just here would break
  that one deliberate cross-region consistency for a difference that reads as mockup noise,
  not a signal.

**Consequence.** `Disclosure`'s two new props are optional and backward compatible — every
other existing call site (`PolicyGateRow`, `TimelineEventRow`, `PolicyGateList`'s old
disclosure) is unaffected. `ConfidencePanel`'s reported-area rows are now `<li><Disclosure>…`
instead of a bare `<Disclosure>` as a direct `<ul>` child, fixing an invalid-HTML issue
(`<details>` was a direct child of `<ul>`) that the earlier version had introduced without
anyone noticing. Every fixed region was re-verified against its actual mockup image
side-by-side, not just re-tested — this correction pass exists precisely because that step
was skipped, or done from memory, the first time.

---

## 0035 · The logo is the real Figma SVG, not a re-typeset lockup

**Context.** 0034 (below) approximated the mockup's wordmark as two lines of styled text:
`LEDGER` (bold, uppercase, `--text-page-title`) over `demo` (`--text-body`,
`--color-text-secondary`). The user then supplied the actual logo mark's SVG source directly
— a double-exposure wordmark (a faded, oversized `LEDGER` behind a crisp, smaller one) that a
type-and-token approximation cannot reproduce; that layered effect is the artwork, not
something CSS letter-spacing and font-weight can fake.

**Options.** (a) Keep refining the text lockup's tracking/weight/line-height to get visually
closer. (b) Inline the supplied SVG verbatim as the wordmark, replacing the text lockup
entirely.

**Choice.** (b), with one change from the SVG exactly as given: every `fill="#555555"` and
`fill="#C5C5C5"` became `fill="currentColor"`, and the wrapping `<h1>` sets
`text-text-primary` — so the mark still resolves through the theme token instead of two fixed
hex greys that would look wrong (too dark, low contrast) against the dark theme's background.
Everything else (paths, the 0.2-opacity backdrop layer) is unchanged from the source.

**Consequence.** `App.tsx`'s `Wordmark` component is now ~90 lines of inlined SVG path data —
unusually large for this codebase's usual "no raw values, everything from tokens" components,
but a brand mark's path geometry isn't a token candidate the way a colour or a spacing value
is. Accessibility: the `<h1>` keeps its native heading role (nothing adds `role="img"` to it,
which would replace that role); the `<svg>` itself carries `role="img"` and a `<title>Ledger —
demo</title>`, so assistive tech gets one clean "Ledger — demo, heading level 1" announcement,
not a heading immediately followed by a separately-announced image with the same label.

---

## 0034 · Testing a Radix modal layer (`DropdownMenu`) in jsdom: one open per test file

**Context.** `TimelineFilters.tsx`'s new dropdown (0030, below) is built on `radix-ui`'s
`DropdownMenu`, a modal layer (it locks `body { pointer-events: none }` while open). Two
things about it don't behave the way every other interactive component in this codebase's
test suite does:

1. `userEvent.click()` on the trigger silently fails to open it — the click's own later
   `pointerup`/`click` events land while the body's pointer-events are already locked to
   `none`, and userEvent's default pointer-events visibility check reads that as "target
   unreachable" and cancels the interaction partway through, even though the *first*
   `pointerdown` already toggled it open a moment earlier.
2. More surprising: once a `DropdownMenu` has been opened and closed in one test (however
   cleanly — `Escape`, a full unmount, `document.body.style` reset all tried), a *separate,
   freshly rendered* `DropdownMenu` instance in a *later* test in the same file can no longer
   be opened at all, by any method (`userEvent`, raw `fireEvent.pointerDown`, with or without
   `vi.resetModules()`). Verified this is jsdom-only, not a real bug: the exact same
   open → close → open sequence works every time in a real browser (Playwright), and works
   every time *within one still-mounted instance* in jsdom too — it's specifically a second
   *mount* that fails, not a second *interaction*.

**Options.** (a) Skip or stub out jsdom coverage for anything using `DropdownMenu`, relying on
Playwright alone. (b) Set `pointerEventsCheck: PointerEventsCheckLevel.Never` on `userEvent`
for these tests (fixes surprise 1), and restructure each affected test file so every
interaction that opens the menu happens against one render, in one test, rather than split
across several fresh `render()` calls (works around surprise 2, since re-mounting is what
breaks, not repeated open/close on the same mount).

**Choice.** (b). `TimelineFilters.test.tsx` and `Timeline.test.tsx`'s toggle test both follow
this now: label-only assertions (no menu interaction) stay as ordinary separate tests; the
"opens it, lists items, checks the initial state, toggles a type on, toggles it back off"
coverage is one test with one `render()`, not four.

**Consequence.** This is a real constraint on this repo's tests, not a one-off: **any future
component built on a Radix modal-layer primitive (`DropdownMenu`, `Popover`, `Select`,
`AlertDialog` — anything using `DismissableLayer`) needs the same two workarounds** if its
tests open it more than once across the file. `Tabs` (0028, `PolicyGateList.test.tsx`) and the
plain `Disclosure`/native `<details>` pattern do **not** have this problem — confirmed by
running several fresh `render()`+interact cycles of each in one file with no issue — so this
is specific to Radix's modal-layer machinery, not Radix components generally, and not a
reason to avoid Radix elsewhere.

---

## 0033 · `DecisionBar`'s Undo gets the one filled, non-neutral button in the app

> Partly replaced by 0039: "Approve and release" now shares the filled treatment.

**Context.** Every button in this codebase is deliberately neutral — `features/run/README.md`
and Scenario S2 (docs/spec-review-screen.md) require "no brand colour on any of [the three
decision] actions," so Approve/Request changes/Reject, and every other button built since,
share one plain bordered style (`BUTTON_CLASSNAME` in `DecisionBar.tsx`). The mockup shows
`DecidedView`'s Undo button filled solid dark (light text on a near-black fill in the light
theme).

**Options.** (a) Keep Undo on the same neutral bordered style as every other button, for
absolute consistency. (b) Give Undo a filled treatment, matching the mockup.

**Choice.** (b), reasoned as a *different* rule from S2's, not a violation of it: S2's "no
brand colour" is specifically about not making one of the three *decision* actions look like
"the recommended one." Undo is not a decision action — it only exists after a decision was
already made, in a single-button context with no siblings to rank against. The fill itself
uses `bg-text-primary`/`text-surface` — an inversion of the existing neutral text/background
tokens, not `--color-primary` or any other brand/accent colour — so it stays inside "no brand
colour anywhere," just not inside "every button looks identical."

**Consequence.** `DecisionBar.tsx` now has two distinct button treatments where it previously
had one; a future button added to this file should default to the existing neutral
`BUTTON_CLASSNAME`, not the filled one — the filled treatment is Undo's alone until another
genuine "single prominent action, no siblings" case shows up.

---

## 0032 · Confidence's percentage band stays one neutral tone, never coloured by value

> Replaced by 0041.

**Context.** The mockup colour-codes each `ConfidencePanel` row's percentage band by its
value — green for ~81–88%, yellow for ~52%. This directly contradicts a principle the panel
was already built around (`ConfidencePanel.tsx`'s own doc comment, predating this session):
"Low confidence is normal information, not an alarm" (`features/run/README.md`'s glossary
entry for **Confidence**). Asked the user directly before planning further (see the
transcript) — confirmed: keep it colour-neutral, restyle only the *layout*.

**Options.** (a) Follow the mockup's green/yellow split. (b) Restructure the layout (a left
band with a large percentage, matching the mockup's visual weight) while keeping the band one
consistent tone (`--color-surface-raised`) regardless of value.

**Choice.** (b). A 52% side-effects confidence value in `run-blocked` is the model correctly
reporting something ordinary it couldn't fully verify — not a failure. Colouring it yellow
would read as a warning next to `PolicyGateList`'s actual warnings, undermining the one
signal this app tries hardest to keep calm.

**Consequence.** The big percentage number itself still needs to never read as "a bare
number" (existing acceptance criterion) even without colour to carry that framing — solved
with a visually-hidden `"Confidence "` prefix inside the same element as the number, so a
screen reader always hears "Confidence 72%," not "72%" floating alone, while sighted users get
the plain, unframed number the neutral band already contextualises.

---

## 0031 · Audit log: filter semantics invert to "hide," behind a dropdown

**Context.** The mockup replaces `TimelineFilters`' row of `ToggleChip`s (checked = shown,
matching `activeTypes`) with a single dropdown, "Hide events · N selected." Read literally,
selecting an item now *hides* that type — the inverse of the current semantics, where
selecting a chip *shows* it. Asked the user to confirm this was an intentional inversion, not
a mockup-reading error, before implementing (see the transcript) — confirmed: yes, invert it.

**Options.** (a) Keep `activeTypes`/show-semantics internally, translate to hide-language only
in the label. (b) Actually invert the underlying data: `lib/timeline.ts`'s `filterTimeline`
takes `hiddenTypes`, empty by default (nothing hidden — the least surprising starting state).

**Choice.** (b). A dropdown reading "Hide events · 3 selected" while secretly tracking which
3 types are *shown* is exactly the kind of naming mismatch that turns into a bug the next time
someone touches this code without re-deriving the inversion from scratch. `filterTimeline`,
`TimelineFilters`, `Timeline`'s `defaultHiddenTypes` prop, and every test/story/fixture that
touched the old `activeTypes` shape were all updated together, not left half-converted.

**Consequence.** The one acceptance criterion this must keep holding — "filtering never
actually hides an error or a retry" — is unchanged in logic, just inverted in which set
triggers it: `filterTimeline` now excludes an event only when its type is in `hiddenTypes`
*and* it isn't an error or a retry, instead of excluding when the type is missing from
`activeTypes`.

---

## 0030 · Three mockup renderings treated as unreviewed Figma artifacts, not replicated

**Context.** Cross-referencing the 9 mockup images against each other and against this app's
existing, deliberate content rules surfaced three places where a mockup's rendering looked
like a leftover from building the Figma file, not a considered design choice:

1. **`RunSummary`'s heading icon** shown as a warning triangle — identical to
   `AttentionDigest`'s own icon on the same file, strongly suggesting a duplicated Figma
   instance that was never swapped back. A warning triangle on the Summary region directly
   contradicts Content rules' "no adjectives, no reassurance, no alarm" voice: the summary is
   plain sourced fact, not a caution.
2. **`DecisionStatusBanner`'s body text** reads "This decisions already stands" in the
   mockup — a grammatical typo (plural "decisions," singular subject), not a wording change;
   nothing else in the 9 images suggests the product voice moved to a plural there.
3. **`TimelineEventRow`'s timestamp position** is inconsistent across the mockup's own five
   visible rows — inline with the title for two, on its own line below for three — with no
   pattern tied to event type, length, or anything else in the data that would explain the
   split.

**Options, each time.** (a) Replicate the mockup exactly, on the assumption every pixel was
intentional. (b) Treat it as an artifact and keep (or choose, for #3) the version that's
internally consistent with this app's own established rules.

**Choice.** (b), all three times: `RunSummary` keeps its `FileText` icon; the banner keeps
"This decision already stands" (singular); `TimelineEventRow` gets **one** consistent layout
(title, then timestamp below, always) rather than mirroring the mockup's split — chosen
specifically because a below-the-title timestamp is what avoids the icon/text wrap-alignment
bug 0025 already fixed once for this exact component.

**Consequence.** This is a judgment call, not a certainty — the alternative (asking about all
three before touching anything) was rejected because none of them changes structure or data,
only which of two very similar renderings gets kept, and the reasoning for each is recorded
here rather than silently overriding what the mockup showed.

---

## 0029 · `RunStatus` gets colour, scoped to exactly two of its six values

**Context.** `RunStatus` (`running`/`blocked`/`awaiting_review`/`approved`/
`changes_requested`/`rejected`) was deliberately colour-neutral before this session — a
workflow phase isn't a `GateResult` claim, so it never got `StatusBadge`'s vocabulary. The
mockup colours "Approved" as a filled green pill. Asked the user directly (see the
transcript) whether this meant reversing that rule generally — confirmed: yes, but only for
what the mockups actually show.

**Options.** (a) Invent a six-way colour mapping so every `RunStatus` value has *some* status
colour, for visual consistency. (b) Colour only the two values the mockups have evidence for
(`approved` → `StatusBadge success`, `changes_requested` → `StatusBadge warning`), and leave
`running`/`blocked`/`awaiting_review`/`rejected` on the existing plain `Tag`.

**Choice.** (b). No mockup shows a coloured "Blocked" or "Rejected" pill, and the new tint
tokens (0027, below) were authorized for exactly green and amber — inventing colours for the
other four would mean guessing at values nothing in this task ever specified.

**Consequence.** `RunHeader.tsx` now branches on `run.status`: two values render via
`StatusBadge`, the rest via the pre-existing `Tag` + a small icon map
(`Loader2`/`OctagonAlert`/`Eye`/`CircleX`). The scope boundary is explicit in code
(`STATUS_BADGE_TONE` is a `Partial<Record<...>>` covering only the two colourable values,
not a `Record` that would need a case for all six) so a future contributor adding a colour
for, say, `rejected` has to consciously widen that type, not just add a class string.

---

## 0028 · `info` tone recolours from blue to neutral grey

**Context.** `StatusBadge`'s `info` tone (the only `GateResult` it covers: `unknown`, "Not
run") used `--color-status-unknown`, a blue. Two independent mockups — Policy gates' "Not
run" pill and Confidence's "Not checked" icon — both render this state in plain grey, never
blue, across every instance shown.

**Options.** (a) Keep blue, on the assumption the mockup simply didn't restyle this one
state. (b) Recolour to neutral, since two independent images agree and neither shows blue
anywhere.

**Choice.** (b) — two independent, unprompted agreements is real evidence of intent, not a
single ambiguous instance. `info`'s own `CircleHelp` icon (distinct from `neutral`'s
`CircleMinus`) is what now distinguishes "not run" from "not applicable," since colour no
longer does.

**Consequence.** `--color-status-unknown` (the blue token) is now unused by `StatusBadge`
entirely, but not orphaned: `RunSummary.tsx`'s own `unknown`-kind sentence (icon + text) still
uses it, left unchanged since no mockup showed that specific case. The two are now
deliberately inconsistent — a badge reads neutral grey, an inline summary sentence about the
same kind of gate outcome still reads blue — until there's real evidence either way.

---

## 0027 · One new colour token, not a new palette, for the filled `StatusBadge` exception

**Context.** The mockups show `success`/`warning` `StatusBadge` tones as filled pills (tint
background, coloured icon/border/text) — reversing this app's own "status colour is never a
fill, never the text" rule (`src/styles/README.md`, backed by 0005's contrast work). The user
pre-authorized adding light-green/light-yellow tokens if needed, but that is not the same as
authorizing a whole new colour system.

**Options.** (a) Design a full new tint palette (background + foreground) for every status
colour, for consistency with a hypothetical future need. (b) Reuse the *existing*, already
contrast-verified `--status-green-light`/`-dark` and `--status-amber-light`/`-dark` as the
on-tint foreground, adding only the light-background tints themselves as new tokens — and
only a genuinely new foreground colour where the existing one can't reach 4.5:1.

**Choice.** (b), and the WCAG relative-luminance check (same method as 0005) found that
`--status-green-light` (#1e8a5a) is *mathematically incapable* of reaching 4.5:1 against any
tint background — it already tops out at ~4.3:1 against pure white, the best possible case, so
no darker tint could improve on that. `--status-amber-light` had enough headroom (5.36:1)
against its own tint to reuse directly, as did both dark-theme colours (7.87:1, 6.44:1). Only
one genuinely new primitive was needed: `--status-green-tint-fg-light` (#1a7a3e), verified at
4.81:1 against its paired tint (#e6f6ec).

**Consequence.** Four new tint-background primitives plus one new foreground primitive
(`tokens.css`), surfaced as `--color-status-pass-tint-bg`/`-fg` and
`--color-status-waived-tint-bg`/`-fg` in `@theme` — scoped to exactly the two tones with
mockup evidence, not a blanket "every status gets a filled variant" system; `danger`/`neutral`
stay icon-and-border-only. `npm run check:theme-bridge` still passes (38 colours verified
across 3 themes), confirming the new tokens compute correctly in both light and dark.

---

## 0026 · `RunHeader`'s requester gets the same pill, on its own line

**Context.** 0023 gave every human actor's name a pill — but missed `RunHeader`'s
`requestedBy`, which was still plain text folded into the same sentence as the initiative
name: `"{initiative} — requested by {name}"`. That sentence also truncates to one line at
`md` and up (0025).

**Options.** (a) Wrap just the name in `ActorName`, in place, inside the existing truncating
sentence. (b) Give the requester its own line, separate from the (still truncating)
initiative name.

**Choice.** (b). `ActorName`'s pill has real shape — border, padding, an icon — and a
`text-overflow: ellipsis` truncation clipping it mid-pill when the sentence overflows would
look broken, not just cut text short the way it does for a plain word. The em dash that used
to join the two ("initiative — requested by name") is dropped; "Requested by [pill]" reads
fine as its own line, the same shape `DecisionStatusBanner`/`DecidedView` already use for "by
[pill]".

**Consequence.** The initiative name's own `<p>` no longer carries `run.requestedBy` at all,
so its truncation (`md:truncate`) now only ever clips the initiative name itself, never a
person's name.

---

## 0025 · The mobile region pass: two real bugs fixed, touch-target size left alone

**Context.** 0024 fixed the page shell and nav but explicitly left "a full per-region mobile
pass" as an open gap. Audited every region in a real browser at 375px before changing
anything, rather than guessing what "mobile polish" might mean. Found two concrete bugs and
one thing that looked like it might need fixing but, checked against the actual accessibility
standard, didn't:

1. **`TimelineEventRow` and `RunSummary`**: `IconText`'s icon vertically centers against its
   whole content by default (`items-center`). Fine for the ten other call sites, which are all
   single-line labels — but an event title or a summary sentence can wrap to several lines at
   375px, and centering the icon against the *whole wrapped block* floats it down toward a
   middle line instead of sitting next to the first one.
2. **`RunHeader`**: the initiative name truncates to one line with a `title` attribute as the
   way to read the rest — a tooltip that never fires on a touchscreen, so on a phone the only
   way to reach "what was asked for" (Reviewer question 1, docs/spec-review-screen.md) was
   gone entirely, not just visually compressed.
3. **Touch-target size** (nav links ~33px tall, filter chips ~30px tall): looked undersized
   against the common "44px" mobile guideline. Checked against WCAG 2.5.8 (AA) instead of
   going by that guideline alone: its actual minimum is 24×24 CSS px, which both already
   clear. 44px is Apple/Material's *comfortable* recommendation, not a compliance gap.

**Options, for (1) and (2).** (a) Fold the fix into `IconText`/keep truncate unconditional,
accepting the small side effect elsewhere. (b) Scope each fix to exactly where the real
problem is.

**Choice.** (b), both times.
- `IconText`'s own default (`items-center`) is untouched — changing it globally would nudge
  every heading icon in the app by a few pixels (`items-center` vs `items-start` differ
  slightly even for single-line content, since the icon is shorter than a line box) for a
  problem that only exists at two call sites. `className="items-start"` on just those two
  `IconText` usages relies on `cn()`'s `tailwind-merge`, which already resolves a conflicting
  utility in favour of the later class — no change to the shared component at all.
- `RunHeader`'s truncate becomes `md:truncate` (unconditional wrap below `md`, today's
  single-line truncate unchanged at `md` and up) rather than removing it altogether — the
  desktop reasoning it was added for (bounding the row's height in a side-by-side layout)
  still holds there; only the touchscreen case where the `title` fallback is unreachable
  changes.

**Choice, for (3).** Left as-is. Bumping shared components (`Tag`, `ToggleChip`) used
everywhere to hit a stricter guideline, with no actual failure against the standard this app
already holds itself to elsewhere (WCAG, per AGENTS.md's accessibility non-negotiable), isn't
a fix — it's a redesign with no bug behind it. Named here rather than silently skipped, so the
choice is visible rather than looking like an oversight.

**Consequence.** `RunHeader.test.tsx`'s existing assertion updated from `toHaveClass('truncate')`
to `toHaveClass('md:truncate')` — the behaviour it guards (desktop still truncates) is
unchanged, just correctly scoped now. Verified in a real browser at 375px, both fixes, both
themes: the icon sits against the first line, and the full initiative name reads without
needing a tooltip. Confirmed unchanged at `md` and up by comparison screenshot.

---

## 0024 · Mobile is now in scope — page shell and nav only, not a full per-region pass

**Context.** `docs/spec-review-screen.md`'s "Out of scope" line listed "mobile layouts" since
the project started; `AnchorNav.tsx` repeated it (and mis-cited the source as `AGENTS.md` —
the real line was only ever in `spec-review-screen.md`). The user asked to fix the mobile
version, specifically to put the navigation at the top, and confirmed — asked directly, since
this reverses a standing scope line rather than being a pure style tweak — that mobile should
come into scope generally, not just for this one screen.

**What was actually broken, checked in a real browser before deciding anything**: at 375px,
`RunReviewPage.tsx`'s outer container (`flex items-start`, no responsive variant) never
stacked `AnchorNav`'s fixed `w-44` column above the content — it just squeezed the content
column to roughly 180px, clipping the run's own system name mid-word and forcing real
horizontal overflow (measured: the page was forced to 459px inside a 375px viewport).

**Options.** (a) Design a full mobile pass in one session — every region's density, touch
targets, table-like layouts. (b) Fix the page shell and navigation (what was both asked for
and measurably broken), name the rest as a real, still-open gap rather than let "mobile is in
scope" quietly imply it's all been designed.

**Choice.** (b). `App.tsx`/`RunReviewPage.tsx`/`AnchorNav.tsx` now use Tailwind's default `md`
breakpoint (768px) — no custom value invented, nothing added to `tokens.css` (a breakpoint is
structural, not a design token this app restricts). Below `md`: `RunReviewPage`'s container is
`flex-col` (nav stacks above content — nav is already first in DOM order, so this alone puts
it "at the top"), `AnchorNav` itself switches from a sticky vertical column to a horizontal,
scrollable, non-sticky strip (`overflow-x-auto`, each link `shrink-0` so the scroll container
can't squeeze a label mid-word), and `App.tsx`'s page padding scales down
(`px-4 py-8` → `md:px-6 md:py-12`). `md` and up: pixel-identical to before this change,
confirmed by screenshot.

**Consequence.** Verified in a real browser (not just from source) at 375px and at the `md`
boundary, across all three fixtures, both themes: zero horizontal scroll, all seven nav links
reachable and activatable by keyboard (focus auto-scrolls the strip; Enter still jumps the
page), and every already-existing `flex-wrap` group (`RunHeader`'s tag row, `PolicyGateRow`'s
summary row, `DecisionBar`'s action buttons, `TimelineFilters`' chips) reflowed cleanly once
given real width back — none of them needed their own fix. `docs/spec-review-screen.md`'s
"Out of scope" line now says exactly this: the shell is responsive, a full per-region mobile
design pass is not — the next thing to design, if a phone-width reviewer turns out to matter
enough to invest further in, is density and touch-target sizing per region, not named here as
already handled.

---

## 0023 · A person's name gets a pill; a system's name-and-version doesn't

**Context.** Every actor name on screen already got an icon (`ActorIcon`, person vs system
via `isSystemActor`), but the two read too similarly at a glance — same size, same weight,
distinguished only by which small icon sat next to the text. The user asked, with a reference
image, for a human name to be visually set apart as its own pill/chip, not just plain text
next to an icon.

**Options.** (a) Give every actor name (person and system alike) the same pill chrome,
differing only by icon. (b) Pill only the person case; leave a system's name-and-version as
plain icon + text, unchanged.

**Choice.** (b). The ask was specifically to "emphasize that this is a human" — giving both
kinds the same chrome would restore the exact ambiguity being fixed. The contrast (one gets a
pill, the other doesn't) is what does the emphasizing; the icon distinction alone stays for
the system case, as before.

**Implementation note.** `ActorName` was previously duplicated — a local function in
`PolicyGateRow.tsx`, and the identical JSX inlined again in `DecisionBar.tsx`. Pulled out to
`features/run/ActorName.tsx` (not `components/`, matching the boundary `ActorIcon`'s own doc
comment already draws: the generic circle-around-an-icon shape lives in `components/`, but
deciding *which* icon from a raw name string is product-specific and lives in `features/run/`).
Now used by `PolicyGateRow.tsx`, `DecisionBar.tsx`, and the new `DecisionStatusBanner.tsx`
alike, so the human/system distinction is consistent everywhere an actor's name appears
instead of three places that could quietly drift apart.

**Consequence.** The pill's own border (`border-border-subtle`) is deliberately a step
subtler than `ActorIcon`'s own ring (`border-border`) rather than reusing the same token for
both — nesting two identically-weighted borders a few pixels apart read as visual clutter in
review; keeping them at different strengths reads as one shape (the pill) with a smaller
detail (the avatar) inside it, not two competing outlines.

---

## 0022 · The "Before you rely on this" digest is a new region, not part of the spec's six

**Context.** A reference mockup (shared as inspiration for "make the UI more user-friendly,"
tokens unchanged) showed a synthesized card near the top pulling together the failed/not-run
gates, the weakest confidence area, and a flagged audit note — one scannable pre-flight list
with jump links. `docs/spec-review-screen.md` defines exactly six regions and doesn't have
one for this.

**Options.** (a) Skip it — stay to visual/layout refinements of the existing six regions.
(b) Build it as a seventh, clearly-separate region, sourced from real data only.

**Choice.** (b), confirmed with the user before building (this was asked as a scope question,
since it's new content architecture, not styling). `lib/attention.ts`'s `buildAttentionItems`
is deliberately conservative about what qualifies, the same discipline `isSystemActor`
(0016) and `classifySummarySentence` were held to — a fact, never a threshold judgment:

- A gate group only exists for `fail`/`unknown`/`waived` gates that are actually present
  (`lib/gates.ts`'s `gateAttentionGroups`) — the exact same three results `PolicyGateList` now
  treats as "needs attention" (0021), not a separate definition of "risky."
- The confidence bullet is the single weakest area, but *only* among areas that name
  something concrete they could not verify (`unverified.length > 0`). There is deliberately no
  "confidence below X%" threshold — docs/spec-review-screen.md says "low confidence is normal
  and should look normal, not alarming," so the trigger is a specific, sourced fact ("could
  not verify Y"), never a number judged low on its own.
- The audit-note bullet only ever comes from `severity: 'warning'` `note` events.
  `severity: 'error'` events are excluded on purpose: those are already always-visible in the
  Audit log's own step/error/retry summary (Region 4's own hierarchy rule), so repeating them
  here would be the same fact twice, not a new one.

**Consequence.** Verified by hand against all three fixtures, not just written and trusted:
`run-clean` (the "boring" case) still gets one bullet — a confidence area with something real
it couldn't verify — proving the digest doesn't manufacture urgency where none exists;
`run-blocked` gets three (a failed gate, a waived gate, the weakest confidence area);
`run-messy` gets three (two not-run gates, the weakest confidence area, the reconciliation
note) — which happens to match the reference mockup's own three bullets exactly. If a future
region ever needs the same "which gates need looking at" grouping `PolicyGateList` and the
digest both now use, it has a single source (`gateAttentionGroups`), not two definitions to
keep in sync.

---

## 0021 · Policy gates: settled results collapse only once something needs attention

**Context.** The same reference mockup collapsed passing/not-applicable gates behind "Show N
passed checks," with failed/not-run gates always visible above an eyebrow count. But Scenario
S2 in docs/spec-review-screen.md is explicit: for an all-pass run, a design "fails when...
[it] hides what was checked behind a single green summary" — collapsing everything in the
common, boring case is exactly the failure that scenario names.

**Options.** (a) Always collapse settled (pass/not_applicable) gates behind the disclosure,
matching the mockup literally. (b) Collapse settled gates only when at least one gate needs
attention (`fail`/`waived`/`unknown`); render the flat list, exactly as before, when every
gate is pass/not_applicable.

**Choice.** (b). `PolicyGateList.tsx` computes `attention`/`settled` from the existing
`sortGates` order; `attention.length === 0` renders unchanged from before this session (the
literal S2 case), `attention.length > 0` adds a "Needs attention · N" eyebrow above the
always-visible attention rows and wraps `settled` in the existing `Disclosure` component
("Show N passed checks") — no new component, no new tokens.

**Consequence.** `PolicyGateList.test.tsx`'s existing sort-order test now opens the
disclosure before asserting order (closed native `<details>` content is correctly excluded
from `getAllByRole`, the same behaviour `ConfidencePanel.test.tsx` already relies on) — the
sort behaviour it checks didn't change, only that it's sometimes behind one extra click now.
Two new tests cover the two branches directly: settled gates collapse when something needs
attention, and nothing collapses when everything passed.

---

## 0020 · `AttentionDigest`'s own chrome stays colour-neutral, not a status colour

**Context.** `src/styles/README.md`'s usage rules: `--color-status-*` is for an icon, border
or swatch reporting one specific `GateResult` — "if something needs colour and it is not
reporting a pass/fail/waived/not-applicable/unknown result, it does not get a status colour."
The new `AttentionDigest` card (0022) needed some visual weight for its heading icon and
border, and the reference mockup it took inspiration from used a solid amber/brown fill for
the equivalent card.

**Options.** (a) Give the card's heading icon/border a status colour — `--color-status-waived`
(amber) reads closest to "caution." (b) Keep the card's own chrome fully neutral
(`border-border-subtle`, `text-text-secondary`/`text-text-primary`), the same treatment
`RunHeader.tsx` already gives `RunStatus` for an analogous reason (see that component's own
doc comment).

**Choice.** (b). The digest is not itself reporting one `GateResult` — a single card can
carry a failed-gate bullet, a confidence bullet and an audit-note bullet all at once, so no
single status tone is accurate for the card as a whole, and the usage rule is explicit that
status colour doesn't get reused once something stops being a status claim. (A full
background fill, which the mockup used, was also never on the table: `styles/README.md`
already established status colour as "icon, border and swatch — never the text itself," and a
solid amber fill is the same kind of reuse the "never a fill" line in tokens.css's own status
block already rules out for `StatusBadge`.)

**Consequence.** The card reads calmer than the reference's amber box; each item's own lead
sentence, not the card's chrome, is what tells a reviewer this is a "worth checking" list, the
same way `RunSummary.tsx` and `PolicyGateRow.tsx` already carry their own status meaning at
the item level rather than tinting a whole container. No new token was added or considered.

---

## 0019 · Smooth scroll for section nav: CSS `scroll-behavior`, not `scrollIntoView`

**Context.** AnchorNav's links (`#run-header-heading` etc.) jumped instantly. The ask was a
smooth scroll on click, reduced-motion respected, plus `scroll-margin-top` on each heading if
any sticky/fixed element would otherwise cover it after scrolling.

**Options.** (a) `scroll-behavior: smooth` on `html` via CSS, gated behind
`@media (prefers-reduced-motion: no-preference)`, relying on the browser's native anchor
navigation. (b) A click handler per link calling
`element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })`.

**Choice.** (a). AnchorNav's links are plain `<a href="#id">` with no other click behaviour —
there is nothing for a handler to do that the browser doesn't already do given the CSS
property, and no other programmatic scroll exists anywhere in the app for the site-wide
`html` selector to affect unintentionally. The reduced-motion branch falls out of the media
query for free (the property is simply never set, so the browser's own instant jump runs,
not an animation that's merely shortened) rather than needing a JS `matchMedia` check.

**Consequence — no `scroll-margin-top` added.** The one *conditional* part of the ask
("if any nav/header element is sticky/fixed...") turned out not to apply: `AnchorNav` is
sticky, but it's a side rail next to the content column (`flex items-start` in
`RunReviewPage.tsx`), not a bar stacked above it — scrolling never tucks a region heading
underneath it. Verified in a real browser (Playwright): `getComputedStyle(html).scrollBehavior`
reads `smooth` under `no-preference` and `auto` under `reduce`, and a keyboard-activated
(Enter, not click) nav link scrolls the page either way. If a fixed header is ever added
above the content column, this is the entry to revisit.

---

## 0018 · Disclosure's open/close animation: CSS grid-rows, not a measured-height overshoot

**Context.** The request asked for a springy overshoot easing on open (`cubic-bezier(0.34,
1.56, 0.64, 1)`) with an explicit constraint: "no bounce/scale/rotation — the personality
comes from the easing curve, not from extra movement." Native `<details>` can't be animated
directly (the browser applies `display: none` to its children the instant `open` goes false,
before any transition can run), so this needed a real technique, not just adding
`transition`.

**Options.** (a) A single-track CSS Grid (`grid-template-rows: 0fr` ↔ `1fr`), transitioning
that property with the spring easing — no JS state, `<details>` stays exactly as
uncontrolled as it already was. (b) Measure the content's real pixel height (a ref +
`scrollHeight`, or a `ResizeObserver`) and animate an explicit `height` (or `max-height`) to
that value in React state — more moving parts, and a component whose own doc comment
currently says "native `<details>`/`<summary>` rather than custom JS."

**Choice.** (a) — implemented and verified: the computed `transition-duration` and
`transition-timing-function` on open genuinely match the spring token, and the row's real
height interpolates through it (confirmed via `getComputedStyle` mid-transition in a real
browser, not assumed from the CSS alone). **But it doesn't produce a literally visible
overshoot.** A CSS Grid track sized in `fr` units has nothing to overshoot *into*: with only
one flexible track, the row always claims exactly the space the content needs, at every
point in the curve, including the portion of the curve past `1.0` — there's no pixel value
for the row to briefly exceed and settle back from, the way a `scale` or a fixed-pixel
`height` animation could. (b) would have made a genuine overshoot possible (an explicit pixel
height briefly exceeding the content's natural height *is* visible, as a small extra gap that
closes), but only by giving up the "no custom JS" property this component has had since it
was built, for a request that also explicitly ruled out the other way overshoot is usually
made visible (`scale`). Given the explicit "no scale" constraint, (a) is what's implementable
within it — the curve genuinely runs at the exact tokens specified, it just expresses as an
unusually fast-then-settling *rate* of opening rather than a visible bounce past the final
size.

**Consequence.** `--motion-duration-open`/`-close`/`--motion-ease-spring`/`--motion-ease-in`
are real, used tokens, and the transition timing is verified correct. If a literally visible
overshoot bounce turns out to matter more than keeping `Disclosure` free of JS state and
`transform`/`scale`, option (b) is the concrete alternative — a small, contained change
(a ref, a measured height, React `open` state synced from the native `toggle` event) — not a
redesign.

---

## 0017 · Undo is real, but local-only — there is nothing to reverse it on

**Context.** The undo window (0003) was, until now, a countdown with nothing to click: real
information ("you can undo this for 6 min 59 s more"), but no way to act on it. The request
was to add an actual "Undo" button. `lib/api.ts` has no `undoDecision`-shaped function, and
adding one would mean deciding what a real undo endpoint does — whether it needs its own
audit trail entry, whether a second reviewer can undo someone else's decision, what happens
if the undo itself races a release — none of which this demo's fixture-backed `getRun`/
`submitDecision` pair has any real backend semantics for.

**Options.** (a) A real `<button>` that calls `onRunUpdated({ ...run, decision: undefined,
status: 'awaiting_review' })` — the exact same local-state mechanism `DecisionBar` already
uses for a live decision or an S5 conflict (`RunReviewPage`'s `decidedRun` state), reverting
what's on screen, with no network call. (b) Add a matching `undoDecision` to `lib/api.ts`,
mirroring `submitDecision`'s shape, so undo goes through the same seam a real backend would.
(c) Leave the button out and keep only the countdown text.

**Choice.** (a). It makes the button real in the only sense this app can make anything
real — the screen genuinely changes, immediately, the same way approving or rejecting does —
without inventing backend behaviour (b) would need real answers for for a demo that
explicitly has none (AGENTS.md, Stack: "No backend"). (c) would leave the request half-done
for no reason: the local-state mechanism (a) uses already exists and already does exactly
this shape of thing.

**Consequence.** Undo is real and immediate on screen, but only for this browser tab, this
session, this local React state — refreshing the page reloads the original fixture,
undecided-or-decided exactly as it was written, same as any other local-only change already
made through `DecisionBar`. If a real backend is ever added, this is the seam
(`onRunUpdated`) where an actual `undoDecision` call would slot in, the same way (b) would
have worked, without changing `DecisionBar`'s own shape.

---

## 0016 · Person-vs-system actor icons are a string heuristic, not a data-model field

**Context.** A screenshot review asked for a small icon distinguishing a person's name from a
system's name-and-version next to `PolicyGate.evaluatedBy`, `PolicyGate.waiver.by` and
`Decision.by` (docs/spec-review-screen.md, Content rules, "Who did what": "a person by name,
or a system by name and version"). The data model has no field saying which one a given
string is — adding one was explicitly out of scope for this task.

**Options.** (a) A heuristic over the string itself: every system name in this app's fixtures
ends in a version tag ("policy-engine v2.3"), no person's name does. (b) Add a real
`PolicyGate.evaluatedByKind: 'person' | 'system'` (and the equivalent for `waiver`/
`Decision`) field to the data model. (c) Skip the icon distinction entirely until a real field
exists.

**Choice.** (a), `src/lib/actors.ts`'s `isSystemActor`. Verified against every actual
`evaluatedBy`/`waiver.by`/`decision.by` value across all three fixtures (7 distinct values: 4
system, 3 person) — correct on all of them. (b) is the more correct long-term answer but was
out of scope tonight; (c) would have left the request half-done for no real reason, since (a)
is cheap, reversible, and doesn't touch anything (b) would later need to replace.

**Consequence.** This is a text-pattern guess, not a real distinction: a future system name
that doesn't end in a version tag, or a person whose name coincidentally does, would be
misclassified. It is verified correct on every value that exists today, not proven correct in
general. If a system evaluator is ever named without a version suffix (or a gate/decision
gains a real `evaluatedByKind`-style field for another reason), `isSystemActor` should be
replaced, not extended with more pattern cases.

---

## 0015 · `format.ts`'s locale is now pinned, and checked, not left to the runtime default

**Context.** Relative-time strings (`formatRelativeTime`) rendered in Finnish
("7 kuukautta sitten") instead of English, on a machine whose browser/OS reported that
locale. Every `Intl`/`toLocale*` call in `src/lib/format.ts` passed `undefined` for locale,
which means "follow the runtime's default" — not a deliberate choice, just left unset. This
is the second time a bug in this exact file has come from the same root cause: the first was
12-hour vs. 24-hour clock time (`docs/WORKLOG.md`, 2026-09-19), fixed with `hour12: false`
but without addressing the *other* locale-dependent calls in the same file, which is exactly
why this one was still open to find.

**Options.** (a) Pin every locale-sensitive call in `format.ts` to a single explicit
constant (`'en'`), and rely on code review to keep it that way. (b) Same fix, plus a narrow
automated check (matching `scripts/check-theme-bridge.mjs`'s precedent, 0009) that fails
`npm run check` if any locale-sensitive call in that file omits an explicit locale again.
(c) Leave it locale-dependent, and instead force a consistent locale at the app's root (e.g.
an `<html lang>`-driven i18n setup).

**Choice.** (b), `scripts/check-format-locale.mjs`. (a) alone is what was already true for the
12-hour-clock fix — it held for exactly the one call that got fixed, not the others in the
same file, which is how this happened a second time. (c) is real internationalization
infrastructure this app doesn't have and doesn't need yet (it has no other language content;
Content rules' wording is fixed English throughout) — pinning one file's own calls is a much
smaller, sufficient fix for the actual problem. Verified the same way 0009's check was:
reintroduced the exact bug, confirmed the new check fails and names the offending call, then
confirmed a clean pass after restoring.

**Consequence.** `format.ts` can no longer regress to the runtime's default locale without
`npm run check` failing immediately and naming the exact call. The check is deliberately
narrow — a regex over one file's known call shapes — and would need updating if a
locale-sensitive call were added elsewhere in the app or written in an unrecognized shape.

---

## 0014 · `--color-primary`/`--color-primary-foreground` were a self-reference cycle, not a safe mirror — correcting 0008

**Context.** 0008 audited every bridge name against tokens.css and found one other exact-name
overlap besides border: `primary`. It reasoned that was fine because "the bridge maps it to
itself, which is only safe because both sides already agree on the value" — i.e.
`--color-primary: var(--color-primary);` in the bridge, mirroring tokens.css's own
`--color-primary: var(--violet-light);`. That reasoning was wrong, and 0008's own text above
is left as it was written rather than edited to hide the mistake. Building the first real
shadcn components (0013) and actually looking at the rendered result — not just the source —
showed `bg-primary` painting nothing at all in light theme. Tailwind merges an `@theme` name
and a same-named `@theme inline` name into one registry entry, the later (bridge) declaration
winning outright, never layered on top of the earlier one. So the bridge's line wasn't
"mirroring" anything at runtime — it was the *only* surviving declaration for that name, and
it referenced its own name: a CSS custom-property cycle, which computes to nothing (per spec,
its guaranteed-invalid value), silently. `--color-primary-foreground` had the identical bug.
Worse, tokens.css's own `--color-focus-ring: var(--color-primary);` rode the same cycle,
making `:focus-visible`'s outline colour invalid too — every keyboard focus ring on the site
was invisible in light theme, the default theme, until this was found and fixed.

**Options.** (a) Remove both self-referencing lines from the bridge, same fix as 0007/0008 —
tokens.css's own declaration becomes the only registry entry for the name, nothing to collide
with. (b) Keep the bridge lines but give them a real, different value pointing somewhere
else. (c) Rename tokens.css's `primary`/`primary-foreground` to dodge shadcn's vocabulary
entirely.

**Choice.** (a). There is no version of redeclaring a colliding name in the bridge that is
safe — not a different value (0007/0008's failure mode: silently wrong, not invalid) and not
the name's own value either (this failure mode: silently invalid). The only fix that can't
recreate either bug is to not redeclare the name at all. (c) is a bigger, more disruptive
change for a collision (a) already resolves cleanly, and rejected here for the same reason
0009 rejected it for border/accent.

**Consequence.** `bg-primary`/`text-primary`/`bg-primary-foreground`/`text-primary-foreground`
now resolve to tokens.css's real values in both themes, verified by a probe build and by
`getComputedStyle` on the rendered app. `:focus-visible` is visible again in light theme,
confirmed the same way, on a real focusable element, not just by reading the CSS. Every other
bridge name was re-audited against tokens.css for this exact pattern (a name that collides at
all, regardless of what value it's given); none of the remaining ones do.
`scripts/check-theme-bridge.mjs` (0009) is rewritten: its "safe if the value mirrors the
token's name" exception — exactly the reasoning 0008 used, and exactly what let this bug
through unflagged for as long as it did — is gone; any colliding name is now an error, full
stop. A second, independent check was added alongside it: build the real CSS and, in an
actual browser, verify every semantic colour's `bg-*`/`text-*` utility actually paints its
own colour, in light and both dark paths — the thing that would have caught this even if the
static rule had missed it, and that also caught a synthetic mutual cycle between two
non-colliding bridge names during verification (a case the static rule structurally cannot
see). This makes `npm run check` depend on a real Chromium build; see `README.md` for the
one-time `npx playwright install chromium` this now requires.

---

## 0013 · Added the shadcn bridge's missing `border-color` preflight reset

**Context.** Adding the first real shadcn components (Button, Checkbox, Dialog — fetched
directly from shadcn-ui/ui on GitHub, since ui.shadcn.com is blocked by this session's egress
policy) exposed a gap the bridge comment had flagged as unverified: Tailwind v4's preflight
sets bare `border`/`border-*` width utilities with `border-color: currentColor`, not any theme
token. Every fetched component uses bare `border` assuming shadcn's own classic
`* { @apply border-border }` reset, which this project never had — so `DialogContent`'s and
Button's `outline` variant's border would have rendered as `currentColor` (matching text)
instead of `--color-border`.

**Options.** (a) Add the missing global reset (`*, ::after, ::before { border-color:
var(--color-border); }`) to `index.css`'s existing `@layer base` block, matching shadcn's own
convention. (b) Patch only the three new files to use the explicit `border-border` utility
instead of bare `border`, leaving no site-wide change. (c) Leave it and accept the wrong
border colour until it's visibly noticed.

**Choice.** (a). This is exactly the kind of cross-cutting shadcn-compatibility concern the
bridge file exists to own, and the bridge comment already anticipated needing this fix once a
real component landed. Scoping the fix to only the three new files (b) would leave the same
gap for every future shadcn component to hit again.

**Consequence.** Any element anywhere in the app that uses a bare Tailwind `border` utility
now gets `--color-border` by default instead of `currentColor`. Verified with a probe build:
the compiled CSS shows the reset before any component styles, and `bg-surface-raised`/
`hover:text-foreground` are what the three new files reference instead of shadcn's
`accent`/`accent-foreground` (dropped from the bridge by 0007), per that decision's own
instruction to patch call sites by hand.

---

## 0012 · Passive detection of a conflicting decision is out of scope for v1

**Context.** Scenario S5 ("Run decided by another reviewer during review") describes two
different moments a conflict can be caught: passively, while a reviewer is just reading the
screen and someone else decides in the background; and actively, at the moment this reviewer
tries to submit their own decision and finds one is already recorded. `lib/api.ts` only
supports the second: `submitDecision` throws `DecisionConflictError` if `run.decision` is
already set. There is nothing to poll or subscribe to that would let `RunReviewPage` notice a
conflict while a reviewer is doing nothing but reading.

**Options.** (a) Build only the active form (`DecisionDialog`'s conflict state), leaving the
passive form for later. (b) Add polling to `useRun` (re-`getRun` on an interval, compare
`decision`) so a background change surfaces even without a submit attempt. (c) Add a fake
real-time channel (e.g. an event emitter in `lib/api.ts`) purely to simulate what a real
backend's websocket or long-poll would eventually do.

**Choice.** (a). (b) and (c) are both real, buildable features, but they're a distinct piece
of work — deciding how often to poll, whether to interrupt a reviewer mid-read, how to surface
a change that isn't a conflict yet (the run simply moved on) — and the task that motivated this
session asked specifically for the conflict `submitDecision` already simulates. Building the
passive form now, unasked, would be scope creep into a feature this app doesn't have the
believable backend semantics for yet (AGENTS.md: "ask before... restructuring").

**Consequence.** A reviewer who never clicks Approve/Request changes/Reject while someone else
decides in the background sees nothing change on their screen until they act — at which point
`DecisionDialog` catches it, exactly as the lighter form already does. The full S5 (a banner or
similar appearing unprompted while reading) is genuinely unbuilt, not just untested; it belongs
with whatever `useRun` needs when a real backend can push or be polled for changes.

---

## 0011 · `Run.revision` added to the data model

**Context.** The approve confirmation ("Release revision *x* to *y*") and the post-decision
view both need a real, sourced revision string. The spec's own data model only puts `revision`
on `Decision` — set once a decision exists, too late for a confirmation dialog that has to
show it *before* the reviewer decides anything. Non-negotiable 3 ("No claim without a source")
rules out putting an unsourced or made-up value in that dialog.

**Options.** (a) Add `revision: string` to `Run` itself. (b) Derive something revision-shaped
from existing fields (e.g. `Run.id`) instead of adding one. (c) Leave the confirmation text
without a concrete revision until a real backend supplies one.

**Choice.** (a). (b) would show something in the revision's place that isn't actually a
revision identifier — a different flavor of the same "invented" problem non-negotiable 3
warns against, just one level removed. (c) fails Scenario S6 and the Buttons content rule
outright, both of which give a concrete revision in their own example text. This mirrors
0004's precedent exactly: `DecisionInput` needed a field the spec's `Decision` didn't have, and
the fix there was the same — a small, deliberate, documented addition, not a workaround.

**Consequence.** Every fixture now carries a `revision`; `run-messy`'s matches its already-
recorded `decision.revision` exactly (`e91a4c`), since nothing has moved on since it was
approved. A future run that changes revision after a decision was already made — the deeper
form of staleness 0012 above scopes out — would need `Run.revision` and `Decision.revision` to
be allowed to differ; nothing here prevents that, but nothing depends on it either yet.

---

## 0010 · Run status and environment get a neutral `Tag`, not `StatusBadge`

**Context.** `RunHeader` needs to show `RunStatus` (running/blocked/awaiting_review/approved/
changes_requested/rejected) and the target environment (dev/staging/production), both with
"icon + text, never colour alone" (AGENTS.md non-negotiable 4). `StatusBadge` already does
exactly that shape of thing for `GateResult` — but its five tones are wired to
`--color-status-*`, and both `tokens.css` and `src/styles/README.md` scope those tokens
specifically to "a claim about a policy check." Neither a workflow phase nor a deployment
environment is that.

**Options.** (a) Reuse `StatusBadge`, mapping each `RunStatus`/environment value onto the
closest-feeling existing tone (e.g. `approved` → `success`, `rejected` → `danger`).
(b) Add new tones (and new `--color-status-*` tokens) for the values `StatusBadge` doesn't
already cover. (c) Build a colour-neutral `Tag` (icon + label, no tone) for anything that
needs "icon + text" but isn't a policy-check claim.

**Choice.** (c). (a) would visually conflate two different claims made by two different
parties — "this policy check passed" and "this run was approved" are not the same statement,
and `src/styles/README.md` already warns against exactly this kind of look-alike confusion for
accent vs. status. (b) solves the confusion but violates AGENTS.md's design-system target ("a
new screen can be built without adding a single new colour value") for a case that doesn't
need a new colour at all — a workflow phase doesn't need to look like a pass/fail claim to be
legible; an icon and an exact label are enough.

**Consequence.** `Tag` (`src/components/`) is now the generic building block for "icon + text,
no colour semantics" — reusable anywhere a status-shaped thing isn't actually a policy-check
result. `StatusBadge` stays scoped to `GateResult` exactly as before. If a future region needs
another non-policy status (e.g. something for `ConfidenceArea` or `Decision`), it should reach
for `Tag`, not extend `StatusBadge`'s tone set.

---

## 0009 · Shadcn-bridge/token collisions are now checked by a script, not by memory

**Context.** 0007 (`--color-accent`) and 0008 (`--color-border`) were the same bug found
twice, six commits apart: `src/styles/index.css`'s `@theme inline` block declared a custom
property under the exact name of one of our own semantic tokens, but pointed it at a
different value. Because the bridge is `@import`ed after `tokens.css`, that declaration wins
the cascade for every consumer of the name, everywhere in the app — not only inside shadcn
components. Both were only found because a component happened to be the first thing to use
that particular Tailwind class, and someone thought to run a probe build instead of trusting
the source. Nothing stopped a third name from doing the same thing silently, forever, until
something visibly broke.

**Options.** (a) Keep relying on probe builds and code review to catch this by eye, now
that it's a documented pattern to watch for. (b) Write an automated check for this specific
class of bug — any bridge declaration that shares a token's name is only valid if it mirrors
that token's value exactly — and run it as part of `npm run check`. (c) Avoid the possibility
entirely by renaming either the bridge's or the tokens' vocabulary so the two can never share
a name.

**Choice.** (b): `scripts/check-theme-bridge.mjs`. (a) is what already failed twice — a
pattern worth documenting is a pattern worth enforcing, not re-noticing. (c) would work but
means giving up shadcn's fixed naming convention (`border`, `accent`, `ring`, …) or renaming
our own tokens to dodge collisions that don't exist yet, which is a bigger, more disruptive
change for a problem a small script already solves. The script reads both `@theme` blocks as
text, matches declarations by name, and fails if a bridge value under a colliding name is
anything other than `var(--that-name)` — the one form that provably carries the token's value
through unchanged. Verified by temporarily reintroducing both the accent and the border bugs
and confirming it fails on each, then confirming it passes clean on the current files.

**Consequence.** A third collision like this now fails `npm run check` immediately, at the
name level, before anyone needs to notice a wrong colour or think to probe-build. The check
is deliberately narrow (a regex over two known blocks, not a real CSS parser) — it only knows
about this one failure mode, not shadcn-bridge correctness in general, and it would need
updating if the bridge or tokens file's structure changed shape enough to break the regex.
That's an acceptable trade for how cheaply it runs and how exactly it targets the two bugs
that already happened.

**Superseded in part by 0014.** The "only valid if it mirrors that token's value exactly"
rule above is exactly what missed the `primary`/`primary-foreground` self-reference cycle —
mirroring by name is not safe, only omitting the colliding name is. The script no longer has
that exception, and now also builds the real CSS and checks computed values in a browser,
which a text-level regex structurally cannot do. See 0014 for the full account.

---

## 0008 · Removed the shadcn bridge's `--color-border` override

**Context.** `src/styles/index.css`'s shadcn bridge redeclared `--color-border` to equal
`--color-border-subtle`, for shadcn's own fixed vocabulary. `--color-border` is also a real
semantic token in `tokens.css`, a stronger border colour than the subtle one — the same name
meaning two different things, the same collision already caught for `accent` (0007), just
missed for `border` because nothing had used `border-border`/`bg-border`/`text-border`
directly until building `ToggleChip` for the Timeline task. Verified with a probe build, not
assumed: `border-border` was silently resolving to the subtle value.

**Options.** (a) Leave it — nothing currently visible was wrong. (b) Rename our semantic
token to avoid the collision. (c) Remove the bridge's override, same as 0007 did for accent.

**Choice.** (c). Once removed, `--color-input` (which was already defined as
`var(--color-border)`) automatically resolves to our real token via the normal CSS cascade,
with no further change needed — a strictly better outcome than 0007's accent case, which is
left with no value in the bridge at all until a real component supplies one.

**Consequence.** `border-border`/`bg-border`/`text-border` now mean what `tokens.css` says
they mean, everywhere, including inside any future shadcn component. Audited the rest of
shadcn's bridge vocabulary the same way (probe-built and checked the resolved value, not
just read the source) rather than assume this was the only one: `primary` is the one other
exact-name overlap, and it isn't a collision — the bridge maps it to itself, which is only
safe because both sides already agree on the value. `secondary`, `muted`, `destructive`,
`ring` and `input` don't collide, because none of them is also one of our own token names.

**Correction (see 0014).** The claim above about `primary` being safe was wrong, and this
paragraph is left as originally written rather than edited to hide that. The bridge mapping
it "to itself" wasn't a safe mirror — it was a self-referencing CSS custom-property cycle
that silently computed to nothing in light theme, taking `--color-focus-ring` (and every
`:focus-visible` outline on the site) down with it. The probe-build audit this paragraph
describes checked whether the *value* looked right by reading the source; it didn't check
whether the property actually resolved to anything at runtime, which is the only way this
specific failure mode shows up. 0014 has the full account and the fix.

---

## 0007 · shadcn's `accent` bridge slot is dropped, not remapped

**Context.** shadcn/ui components are written against a fixed vocabulary, including
`accent`/`accent-foreground` for a quiet hover surface. The design system now has a real,
visible `--color-accent` (teal-green) — a genuine brand colour, not a hover tint. One CSS
custom property in the shadcn bridge (`src/styles/index.css`) cannot mean both.

**Options.** (a) Point shadcn's `accent` bridge slot at some neutral surface
(`--color-surface-raised`) so any generated component's hover state still resolves to
something, even though the name no longer means what shadcn intends.
(b) Drop the `accent`/`accent-foreground` mapping from the bridge entirely, and leave it
unmapped until a real component needs it.

**Choice.** (b). Silently repointing `accent` to a neutral surface would make `bg-accent`
resolve to *something* without anyone deciding it was right for that specific component — the
same failure mode as inventing a one-off value, just hidden behind an existing name.

**Consequence.** Any future shadcn component that references `bg-accent` or
`accent-foreground` will not theme itself automatically; whoever adds that component patches
it by hand to use `--color-surface-raised` (or whatever fits), the same way `ui.shadcn.com`
being blocked already means every shadcn integration in this repo is manual and unverified
until a first real component exists.

---

## 0006 · Status and accent colours are icon/border colour, never text colour

**Context.** The design system's colour spec gives one hex value per status and per brand
colour, per theme. Several of those, computed as literal text colour against the app's
surfaces, fail 4.5:1 in light theme: `--color-accent` (~3.1–3.3:1),
`--color-status-pass` (~4.0–4.3:1), `--color-status-not-applicable` on
`--color-surface-raised` specifically (4.43:1).

**Options.** (a) Darken the affected light-theme values until they clear 4.5:1 as text.
(b) Keep the given values exactly, and rule that these colours are only ever used for an icon,
a border or a swatch — never the literal colour of the label text next to them, which stays
`--color-text-primary` or `--color-text-secondary`.

**Choice.** (b). The given values are exact, and the reference mockup this task was built
from already shows label text in the ordinary text colour, not the status colour — the rule
was implicit in the source material, just not written down until now.

**Consequence.** Every status/accent-coloured icon or badge component built from here on
must keep its label in a text token, not the status colour, and this needs to be checked by
eye in review (nothing currently enforces it automatically). Icons and borders themselves are
fine at these values — they clear WCAG's 3:1 non-text threshold — so the values are not
wasted, only restricted in where they can carry text.

---

## 0005 · Contrast is verified by computing WCAG ratios, not by eye

**Context.** This task asked for every text/background pairing in the new colour spec to be
checked against 4.5:1 before finishing. Contrast is a real number, not a visual impression —
"looks readable" and "clears 4.5:1" diverge exactly at the borderline cases that matter most.

**Options.** (a) Judge each pairing visually against the rendered swatches.
(b) Compute the actual WCAG relative-luminance contrast ratio for every pairing.

**Choice.** (b), with a small script (not committed — it was scratch work, not part of the
app) implementing the standard formula: linearize each sRGB channel, take the luminance-
weighted sum, then `(L_lighter + 0.05) / (L_darker + 0.05)`.

**Consequence.** The numbers in `src/styles/README.md`, "Contrast" are exact, not estimated,
and they surfaced a real bug before it shipped: a filled primary button needs white text in
light theme but near-black in dark theme, because the dark-theme primary is a lightened
violet. A by-eye check on one theme alone would very plausibly have missed this.

---

## 0004 · `DecisionInput` carries `by`, not just what changed

**Context.** `submitDecision(runId, decision)` needs to know who is deciding. A real backend
would read that from an authenticated session, never from the request body, so the client
would not need to send it.

**Options.** (a) Add a third `reviewer` parameter to `submitDecision`. (b) Put `by` on
`DecisionInput` itself. (c) Wait until there is a real backend to decide this.

**Choice.** (b), because there is no session to read it from yet, and the task that asked for
this API specified an exact two-argument signature.

**Consequence.** `by` on `DecisionInput` is a stand-in for auth, not a design to keep: once a
real backend exists, it should read the reviewer from the session and this field should come
out. `at`, by contrast, is set by `lib/api.ts` itself, not taken from the input — a client
should not get to say when its own request happened.

---

## 0003 · The undo window is a policy, not a stored field

**Context.** The spec's data model has no field for the undo window it describes elsewhere
(Region 6, "Hierarchy and disclosure", "Acceptance criteria" all mention a counting-down undo
window after a decision), and `docs/spec-review-screen.md` gives one concrete number: "You can
undo this for 10 minutes."

**Options.** (a) Add `undoableUntil` (or similar) to `Decision`, set once at decision time.
(b) Treat the window as a fixed duration computed from `Decision.at`, not stored at all.

**Choice.** (b). It matches the one number the spec actually gives, and it means "use the data
model there" (this task's own instruction) holds literally — no field was added to `Decision`.

**Consequence.** The window length lives wherever it is computed (for now, a comment in
`src/fixtures/run-messy.ts`), not in the type. If a real system ever needs the window to vary
by risk or environment, that is the point to add the field back — a single global constant
does not fit that case.

---

## 0002 · The design system stays inside the app, for now

**Context.** `components/` and `styles/` together are the design system. The obvious
alternative is to publish them as separate packages, which is how a platform that lets AI
agents consume design standards would eventually do it.

**Options.** (a) Monorepo with `packages/ui` and `packages/tokens` from day one.
(b) Keep one app, but write the design system so it can be extracted later.

**Choice.** (b). One screen does not justify the build and release machinery of (a).

**Consequence.** The boundary has to be enforced by discipline instead of package limits:
`components/` and `styles/` never import from `features/` or `fixtures/`, and never contain
product concepts. An ESLint import rule guards this.

---

## 0001 · Light theme is the default

**Context.** The reviewer in this product is often a compliance or security person working
in bright, document-heavy environments, next to spreadsheets and PDFs.

**Options.** (a) Dark default, like most developer tools. (b) Light default, dark available.
(c) Follow the system setting only.

**Choice.** Light default, dark available, system preference respected on first load.

**Consequence.** Every component has to be designed twice, and tokens must be semantic
from day one. It also means the screenshots look unlike the usual dark AI-tool UI, which is
intentional.
