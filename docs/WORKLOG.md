# Worklog

One entry per work session, newest first. Written so that a designer can repeat the same
work by hand. Agents: copy the template, fill every field, keep it short and concrete.

---

## Template

### YYYY-MM-DD · <short title>

**Goal**
One sentence: what we set out to do.

**What changed**
Bullet list of files and what happened in each. Mention the commit(s).

**Steps, in order**
Numbered list of the actual steps, with the commands run. Write it as instructions, not as
a story: "1. Created `src/lib/types.ts` and defined `Run`, `TimelineEvent`, `PolicyGate`."
Include the exact commands (`npm create vite@latest`, `npx shadcn@latest add table`, …).

**Why it was done this way**
The reasoning behind the non-obvious choices. If there was a trade-off worth keeping,
also add it to `DECISIONS.md`.

**How to do this by hand**
The manual version of the same work, for learning: which files to create, what to click in
Figma or Storybook, what to check. Skip this field only when it is identical to the steps.

**Verification**
What was run and what the result was: `npm run check`, tests, manual keyboard pass,
contrast check, screenshots taken.

**Open questions / next**
What is unfinished, uncertain, or should be decided by a human.

---

<!-- New entries go below this line, newest first. -->

### 2026-10-15 · Tabs section gets a white card

**Goal**
The user said 0076's propagation was still incomplete: "I'm talking about the tabs. And it
still has grey background. It is not inside a white card like other elements." Give the
Story/Evidence/All-steps tab section the same white card treatment as its sibling regions.

**What changed**
- `src/features/run/RunReviewPage.tsx` — the div wrapping `RunViewTabs` and the three
  `TabsContent` blocks gains `rounded-lg border border-border-subtle bg-surface shadow-card`;
  the `TabsContent` blocks moved into a new inner `px-[var(--space-5)] pb-[var(--space-5)]`
  div.
- `src/features/run/RunViewTabs.tsx` — sticky header background changes from `bg-bg` (grey)
  to `bg-surface`, its `-mx-space-2 px-space-2` bleed replaced with `px-[var(--space-5)]`
  (matching the new card's own padding) and a `rounded-t-lg` top.

**Steps, in order**
1. Read `RunReviewPage.tsx`'s grid layout and traced the tabs' render chain
   (`RunViewTabs.tsx` → `TabsContent` → `StoryTimeline`/`EvidenceTab`/`StepsTab`) to confirm
   no card styling existed anywhere in it, unlike `RunOverview`/`RunDetails`/`DecisionPanel`.
2. Wrapped the tabs + content in the same card recipe `RunOverview` uses.
3. Changed `RunViewTabs`'s sticky header from grey to white, with padding matching the new
   card so the sticky strip reads as the card's own top rather than a separate grey band.
4. Ran `npm run check` (typecheck, lint, format, theme-bridge, format-locale, 273 unit tests,
   35 e2e tests incl. axe WCAG checks in both themes) — green.
5. Screenshotted the Story, Evidence and All-steps tabs in both themes in a real browser to
   confirm the card renders correctly and `StepsTab`'s own nested table card doesn't look like
   a double border.

**Why it was done this way**
See `docs/DECISIONS.md` 0077. One shared card at the `RunReviewPage.tsx` call site, not three
copies of the same card recipe inside each tab view, since the tabs and their content are one
region (0052).

**How to do this by hand**
Not identical to the steps — by hand, open each sibling card (`RunOverview`) and copy its
exact Tailwind class string onto the tabs wrapper, then adjust the sticky header's own
background and padding to match by eye.

**Verification**
`npm run check` full suite green (273 unit tests, 35 e2e tests, unchanged counts — no test
needed updating since no DOM text or roles changed, only wrapping divs and class strings).
Manual Playwright screenshots of all three tab views, both themes, confirm the white card,
the sticky header's continuity with it, and no double-border artifact around the steps table.

**Open questions / next**
None outstanding from this round.

---

### 2026-10-15 · Propagating the design-canvas review to the real app

**Goal**
The user reviewed the Claude Design mockup and asked for all of it applied to the real app —
both My reviews and the run review page: a less red-adjacent pink used only for interactive
elements, the spacing-scale discipline, more white space and clearer grouping in "Your
decision," and the top-bar label change.

**What changed**
- `src/styles/tokens.css` — `--magenta-light`/`-dark` (and their hover/strong/tint variants)
  re-hued further from `--status-red` (`#c21895`/`#ff70d9`, ~50° away vs. the previous ~29°),
  contrast-verified the same way as the original palette change.
- Audited every `text-primary`/`bg-primary`/`border-primary`/`fill-primary` use in `src/`
  against a new rule — pink for interactive affordances only, neutral everywhere else — and
  changed the decorative ones: `SectionHeading`, `RunDetails`, `RunShape` (region-heading
  icons), `RunOverview`'s `EYEBROW` label, `DecisionPanel`'s `StepNumber` badge,
  `ReviewDialogs`' matching step circles and report-dialog icon, `StoryTimeline`'s "key step"
  dot and file-change marker, `MyReviews`' two page-heading icons and its in-progress circle.
  Left every real link, active-state and form-control indicator alone.
- `src/features/run/DecisionPanel.tsx` — the heading+caption and "Deciding as" wrapped into
  one identity group; the panel's top-level gap goes from `space-4` (16px) to `space-6` (32px)
  between that group, the open-items fieldset, the choose-one block and the closing note.
- `src/features/run/RunTopBar.tsx` — `AppName` ("Review agent runs") deleted; the breadcrumb
  link's text becomes "Back to the reviews list."
- `src/features/run/RunReviewPage.test.tsx`, `src/app/App.test.tsx`,
  `e2e/approve-flow.spec.ts` — the now-obsolete app-name test deleted; the breadcrumb text
  updated in the two tests that asserted it.

**Steps, in order**
1. Computed the new hue (316°, same method as the original palette change) and the
   regenerated tint wash; applied to `tokens.css`; verified with `check:theme-bridge`.
2. Grepped every brand-pink utility class in `src/`, read each call site's context, and
   classified it against the new interactive-only rule before changing anything.
3. Checked the touched files for raw pixel values or Tailwind's own numeric spacing utilities
   — found none; the app already enforces `--space-*` strictly, unlike the hand-written canvas
   mockup.
4. Regrouped `DecisionPanel`'s JSX and widened its top-level gap.
5. Removed `RunTopBar`'s `AppName` and relabeled the breadcrumb link.
6. Ran the full `npm run check` (typecheck, lint, format, theme-bridge, format-locale, 273
   unit tests, 35 e2e tests including axe WCAG checks on every state in both themes) — green.
7. Screenshotted both the list and review pages, both themes, in a real browser to confirm the
   result against the reviewed mockup.

**Why it was done this way**
See `docs/DECISIONS.md` 0076 for the full reasoning: why each pink usage was kept or changed,
why `StepNumber`'s two steps get the same neutral treatment rather than inventing a
current/future distinction the data doesn't have, and why `MyReviews`' own internal
"My reviews" back-link (a different element, in the Archive sub-view) wasn't touched.

**How to do this by hand**
Not identical to the steps — by hand, open a colour-contrast checker for the new hue, then
open each file flagged by a `text-primary`/`bg-primary` search and judge by eye whether that
use is a real link or active state versus decoration.

**Verification**
`npm run check` full suite green (273 unit tests — one fewer than before, the deleted obsolete
test, not a regression; 35 e2e tests). Manual Playwright screenshots of the list and review
pages, both themes, confirm the new hue, the neutral decorative icons/labels, the regrouped
decision panel, and the new breadcrumb text all render as intended.

**Open questions / next**
None outstanding from this round.

---

### 2026-10-15 · Pill tabs' active colour: `aria-selected`, not `data-state`

**Goal**
The user asked to recreate the run review screen in a Claude Design canvas so we could review
the design together. Rebuilding it from the component's intended styling surfaced a real bug:
the live app's active pill tab never actually showed its dark active-state text colour.

**What changed**
- `src/components/ui/tabs.tsx` — `tabsTriggerVariants.pill`'s active-colour selector changes
  from `data-[state=active]` to `aria-selected`.
- `src/components/Tabs.tsx` — `PillTabsList`'s sliding-pill `place()` query and its
  `MutationObserver`'s `attributeFilter` both change from `data-state` to `aria-selected`, for
  the same reason; the doc comment above it updated to match.

**Steps, in order**
1. Took a real-browser screenshot and read computed styles off the live app's pill tabs
   (`?run=run-messy-pending`) to compare against the design mockup — found the "active" tab's
   text colour was grey, same as the inactive ones, not the dark colour either the component's
   own CSS rule or the mockup intended.
2. Found the cause by reading `RunViewTabs.tsx` (passes a `tooltip` prop to each trigger) and
   `components/Tabs.tsx`'s `PillTrigger` (wraps a tooltipped trigger in Radix's
   `Tooltip`/`TooltipTrigger asChild`) — confirmed via `getAttribute('data-state')` in the
   browser that every pill tab reads `"closed"` (Tooltip's own state), never `"active"`/
   `"inactive"` (Tabs' state), regardless of which is actually selected.
3. Swapped both consumers to `aria-selected`, which only Radix Tabs writes.
4. Re-checked in the browser: active tab text now correctly dark on load and after clicking
   another tab; the sliding pill's position and opacity still track correctly too.
5. Ran the full `npm run check` (274 unit tests, 35 e2e tests including the keyboard-only pass
   that arrows between these exact tabs) — all green, unchanged.

**Why it was done this way**
See `docs/DECISIONS.md` 0074 for the root cause (two Radix primitives composed via `asChild`
colliding on the same attribute name) and why `aria-selected` is the safer attribute to key
styling off in this specific composition.

**How to do this by hand**
Not identical to the steps — by hand, open the app, inspect the active tab's text colour in
devtools, and read its `data-state` vs `aria-selected` attributes directly to see the mismatch.

**Verification**
`npm run check` full suite green. Manual check: active pill tab's text is dark on load and
after every click/keyboard switch; the sliding pill's position and visibility track correctly
through repeated switches (previously an unverified risk — see 0074 for why this could have
made the pill disappear on a second switch, not just mis-colour the label).

**Open questions / next**
The design-canvas review (color usage logic, spacing-scale discipline, whitespace/grouping in
the decision panel, dropping the "Review agent runs" label) is still in progress in the Design
artifact, not yet ready to propagate to the app — this entry covers only the one concrete bug
that review surfaced.

---

### 2026-10-14 · A flat, true-neutral palette with a magenta-pink primary

**Goal**
The user reacted strongly against the previous session's lavender palette — "looks really
bad," generic "AI beige," needs to be "modern... creative." Asked for direction before
touching anything this broad (style, scope, a reference), got answers, built a 2-3-screen
preview for sign-off, then propagated it everywhere once approved.

**What changed**
- `src/styles/tokens.css` — the neutral ramp desaturated to true grey (computed from the old
  ramp's lightness, saturation zeroed, so the lightness steps hold); `--page-light`/
  `--page-dark` become flat `#f5f5f5`/`#121212`; `--indigo-*` renamed and recoloured to
  `--magenta-*` (`#c2185b` light / `#ff6ec7` dark) as the new primary; `--teal-*` renamed and
  recoloured to `--lime-*` (`#427000` light / `#a8e063` dark) as the new accent; the selected-
  row/active-tab tint wash regenerated from the new primary's hue; `--shadow-card` de-tinted
  to plain black. Status colours and the My Reviews mark colours (amber/blue/red/green) are
  untouched — a separate system, not part of the brief.
- `src/styles/index.css` — the `page-decor` utility (the soft gradient blobs) deleted; nothing
  applies it any more.
- `src/app/App.tsx`, `src/features/run/RunTopBar.tsx` — `page-decor` class removed from both
  places it was applied.
- `src/styles/tokens.css` — the now-dead `--color-decor-*`/`--decor-*` tokens (three
  primitives, three `@theme`/dark-theme mappings each) deleted along with the utility that was
  their only consumer.
- `e2e/accessibility.spec.ts` — the `contrastOverDecor` helper and its branch in the axe
  undecided-results check deleted; it only ever existed to verify text over the now-removed
  gradient, so it had nothing left to check.
- `src/styles/README.md` — the Contrast section's numbers recomputed and rewritten for the new
  palette (old numbers described the lavender ramp and the old indigo/teal brand colours, and
  would have been wrong left as they were); the `--color-accent` note updated, since the new
  lime clears 4.5:1 as text where the old teal didn't even clear 3:1.

**Steps, in order**
1. Asked three questions (style direction, scope, a reference) via the app's clarifying-
   question flow rather than guessing at "modern."
2. Computed candidate neutral, primary and accent values with a throwaway WCAG
   relative-luminance script (same method as `docs/DECISIONS.md` 0005) — not picked by eye —
   verifying each against every surface it would actually sit on, in both themes.
3. Applied the primitives to `tokens.css`, removed the decorative gradient's application,
   ran `npm run check:theme-bridge` (which verifies every `bg-*`/`text-*` pairing in a real
   browser) before screenshotting anything.
4. Screenshotted the home page and a run review page, both themes, plus a decided run for the
   status badges specifically — sent to the user for sign-off before committing anything.
5. On approval ("keep the direction, propagate it everywhere, commit"): swept the repo for any
   remaining references to the old primitive names or the dead decorative utility, removed the
   now-unused decor tokens and the e2e check that only existed for them, and updated
   `src/styles/README.md`'s numbers to match reality.
6. Ran the full `npm run check` (typecheck, lint, format, theme-bridge, format-locale, 274 unit
   tests, 35 e2e tests including axe WCAG checks on every state in both themes) — all green
   with zero component edits, since every component already read colour through the semantic
   tokens.

**Why it was done this way**
See `docs/DECISIONS.md` 0073 for the full reasoning: why each of the three primitive changes
answers a specific piece of the brief, and why status colours and the mark palette were left
alone.

**How to do this by hand**
Not identical to the steps — the by-hand version has no contrast script: open a colour-
contrast checker, test each candidate against every surface it would sit on in both themes by
eye, and skip straight to screenshotting the preview pages in a browser for sign-off.

**Verification**
`npm run check` full suite green, including all 35 Playwright e2e tests (axe WCAG 2.2 A/AA
checks, contrast included, across every reachable state in both themes) — the comprehensive
proof that the new palette propagated cleanly with no contrast regressions anywhere in the
app, not just the screens that were manually screenshotted for sign-off.

**Open questions / next**
None outstanding. Type scale, spacing, radius and shadows beyond the card's colour were
explicitly out of scope for this round ("foundations first" meant colour, per the user's own
answer) — a candidate for a future round if asked.

---

### 2026-10-14 · Home page becomes "My reviews"; pill tabs get a visible track

**Goal**
The user asked to flip the home page from a run straight to the reviewer's list, move the
welcome intro there with it, and — mid-session — fix a reported design bug: the pill-variant
tabs (Story/Evidence/All steps) had no visible background, blending into the page.

**What changed**
- `src/app/App.tsx` — routing inverts: no `?run=` shows `MyReviews` (home); `?run=<id>` shows
  `RunReviewPage`. `?view=reviews` is gone, superseded by a bare `/`. The welcome intro now
  renders only when there is no `runId`, so it plays over the home page, never over a run
  opened by direct link. `?delay=<ms>` now threads into `MyReviews` too.
- `src/features/run/RunReviewPage.tsx` — `reviewsHref`'s default changes from `?view=reviews`
  to `/`.
- `src/app/App.test.tsx` — tests updated for the new default (list, not a run) and the intro's
  new scope (shown on a fresh visit to home, suppressed on a fresh visit straight to a run).
- `e2e/accessibility.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/approve-flow.spec.ts` — every
  `/?view=reviews` becomes `/`; every bare `/` that was testing a run becomes
  `/?run=run-messy-pending` explicitly.
- `README.md`, `src/app/README.md` — routing table and file notes updated to match.
- `src/components/ui/tabs.tsx` — the pill variant's track gains `border border-border-subtle`,
  so it reads as a distinct container even where its fill and the page background sit too
  close in value to tell apart by eye (see `docs/DECISIONS.md` 0072).

**Steps, in order**
1. Read `App.tsx`, `MyReviews.tsx`, `RunReviewPage.tsx`, `intro.ts`/`WelcomeIntro.tsx` to
   understand the existing routing and intro wiring before changing either.
2. Inverted `currentParams()` and the render branch in `App.tsx`; changed `RunReviewPage`'s
   `reviewsHref` default.
3. Updated every test and e2e spec referencing the old routes; `npm install` (missing
   dependencies from the shadcn/ui migration since this environment's last session).
4. `npm run check` (typecheck, lint, format, theme-bridge, format-locale, 274 unit tests, 35
   e2e tests) — all green.
5. Fixed the pill tabs' track border in `components/ui/tabs.tsx`; re-verified visually in a
   real browser, both themes.

**Why it was done this way**
See `docs/DECISIONS.md` 0071 (home page / intro scope) and 0072 (pill tabs' border) for the
real trade-offs: why the intro is gated on `runId` rather than a separate flag, why a border
was chosen over darkening a shared token for the tabs fix.

**How to do this by hand**
Not identical to the steps — manually, open the app with no query string and confirm the list
loads, then a run via its "Review" button; open `?run=<id>` directly in a fresh private window
and confirm the intro does not play; toggle both themes and look at the Story/Evidence/All
steps tabs for a visible edge around the track.

**Verification**
`npm run check` full suite green (274 unit tests, 35 Playwright e2e tests including axe
accessibility checks on every state in both themes). Manual Playwright screenshots: home page
resolves to the My reviews list after the intro completes; a deep-linked run shows no intro;
the pill tabs' track shows a clear border in both light and dark.

**Open questions / next**
The user separately raised a broader complaint — the whole UI "needs to be more modern" — which
is unscoped and needs direction (what "modern" means here, which areas, any reference) before
touching anything beyond this session's two concrete fixes. Asked, not yet answered.

---

### 2026-09-29 · Every control on shadcn/ui

**Goal**
The stack says shadcn/ui, but nothing used it. Migrate every control to it.

**What changed**
- `src/components/ui/`: 14 shadcn components, restyled onto the tokens.
- Buttons in 13 files, and every dialog, tab, check box, tooltip, badge, text field, table,
  select, radio group, switch, disclosure and toast now use them.
- `Toast` became `notify()` on Sonner. `tooltipPlacement.ts` and the tooltip CSS are gone.
- Packages: `class-variance-authority`, `sonner`.
- Tests: Modal, InfoTip, Tabs and notify rewritten for Radix and Sonner; the keyboard spec
  accepts a checkbox label's focus ring for either kind of checkbox.
- DECISIONS 0070, AGENTS.md, `components/README.md`, README.

**Steps, in order**
1. `git checkout -b feat/shadcn-ui` from main.
2. Checked the registry (blocked) and GitHub (reachable), then fetched the components with
   `curl` from `shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/`.
3. Adapted imports, the accent clash and `next-themes` in Sonner; restyled each onto the
   tokens as it was used.
4. Migrated one component per commit. After each: typecheck, lint, unit tests, all
   Playwright specs, screenshots in both themes, then `npm run check`.
5. Fixed what the specs found. Radix returns focus only to its own trigger. Sonner's focus
   restore made a keyboard loop (traced by logging every Tab stop's outline and
   `:focus-visible`). Sonner's unlayered `outline: 0` hid the toast's focus ring.
6. Built Storybook, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0070. Keeping the wrappers' APIs meant the pages barely changed, so each swap
could be checked on its own.

**How to do this by hand**
Open any control in DevTools: it carries a `data-slot` attribute (`button`, `dialog-content`,
`checkbox`, …), which marks a shadcn component. Tab through My reviews after archiving a run:
focus passes through the toast and on to the top of the page.

### 2026-09-25 · Deeper, brighter accents in dark mode

**Goal**
Make the dark-mode indigo, amber and tab-icon colours deeper and brighter.

**What changed**
- `styles/tokens.css`: dark indigo, amber and disc colours, and `--color-primary-strong`.
- `ReviewParts.tsx` (progress bars) and `components/Tabs.tsx` (the selected underline) use
  `primary-strong`.
- DECISIONS 0069.

**Steps, in order**
1. `git checkout -b style/vivid-dark-accents` from main.
2. Computed the contrast of candidate colours on every dark surface and over the circles.
3. Set the tokens and took dark screenshots. The bars were still pale, because text-safe
   indigo must stay light, so fills got the deeper `primary-strong`.
4. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0069.

**How to do this by hand**
Switch to dark and open My reviews: bright orange, blue, red and green tab icons, deep indigo
progress bars and underline, and a bright amber "Needs your review".

### 2026-09-25 · A cool lavender-blue look across the app

**Goal**
Change the colour tokens, and the site's look overall, to the style of the user's mockup.

**What changed**
- `styles/tokens.css`: a cool neutral ramp, the page colours, indigo brand, radius, card
  shadow and decor tokens, in both themes.
- `styles/index.css`: the `page-decor` utility; `App.tsx` and `RunTopBar.tsx` use it.
- `shadow-card` on the twelve card surfaces.
- `e2e/accessibility.spec.ts`: text over the circles is measured, not skipped.
- DECISIONS 0068, `styles/README.md` contrast figures.

**Steps, in order**
1. `git checkout -b feat/soft-blue-style` from main.
2. Read colours off the mockup, and computed the contrast of every text colour on every new
   surface before writing any token.
3. Wrote the tokens, then took screenshots of the run page and My reviews in both themes.
4. The axe spec failed: the SVG circles hid every background from it. The circles were redrawn
   as gradients, and the spec was taught to measure text over them.
5. That measurement found secondary text over the thin ring at 4.39:1, so the circles were
   lightened.
6. The see-through top bar let scrolled text show behind its own. It got the same fixed
   background as the page instead.
7. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0068. Through the tokens, every screen changes at once, and the components stay
as they were.

**How to do this by hand**
Open `/` and `/?view=reviews` in light and dark: a lavender or navy page, soft white or navy
cards, indigo accents, and circles at the top right that continue behind the top bar.

### 2026-09-24 · Only the run's reference under each title in My reviews

**Goal**
Remove the system name and environment chip under each run's title; keep the case reference.

**What changed**
- `ReviewParts.tsx`: `RunCell` shows the id only, and `EnvironmentChip` is removed.
- DECISIONS 0067.

**Steps, in order**
1. `git checkout -b feat/reviews-row-case-only` from main.
2. Changed `RunCell`, then took a screenshot of the table in Chromium.
3. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0067.

**How to do this by hand**
Open My reviews: each row has the title with its reference, such as `run-vat-estonia`, beneath
it.

### 2026-09-24 · Line tabs showed no selected underline

**Goal**
The user saw no selected state and no hover on My reviews' run-type tabs.

**What changed**
- `components/Tabs.tsx`, line variant: removed `-mb-px` from the tab, and added a grey
  underline on hover.

**Steps, in order**
1. `git checkout -b fix/line-tabs-underline` from main.
2. Measured the selected tab in Chromium: its 2 px violet border was there, but its bottom sat
   on the list's bottom edge. The list scrolls sideways (`overflow-x-auto`), which clips at
   that edge, so the underline was cut away.
3. Removed `-mb-px` and added `hover:border-border`, then took zoomed screenshots in both
   themes.
4. A colour transition on the tab made the keyboard spec lose arrow presses (5 of 8 runs
   failed, 0 of 8 on main), so the transition was left out.
5. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
The underline only needed to stop overlapping the clipped edge. The list keeps its sideways
scroll for narrow screens.

**How to do this by hand**
Open My reviews: Pending has a violet underline. Hover Declined: a grey underline appears.

### 2026-09-24 · No decision on a run that is still running

**Goal**
Hide the decision panel on runs the agent or the checks are still working on.

**What changed**
- `lib/decision.ts` `isStillRunning`, `lib/gates.ts` `noResultLabel`, `lib/story.ts`, and
  `lib/api.ts` refusing the decision.
- `features/run/InProgressBox.tsx`, used by `RunReviewPage.tsx` in the decision's place.
- `RunDetails.tsx` and `lib/evidence.ts` wording, and the `RunOverview.tsx` status dot.
- Tests for each, and DECISIONS 0066.

**Steps, in order**
1. `git checkout -b feat/in-progress-no-decision` from main.
2. Added the helper, the box and the api rule.
3. Screenshots of `run-sms-provider` (agent working, light) and `run-webhook-retries` (checks
   running, dark). They showed the overview still saying "then decide", "5 not run", and a
   badge with no dot. All three were fixed.
4. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0066.

**How to do this by hand**
Open `/?run=run-webhook-retries`: the right column says "Not ready for review yet", and there
are no decision buttons.

### 2026-09-24 · Mustache heart favicon

**Goal**
Replace the favicon with the "Mustache heart" style from the user's icon sheet, and its
notification version too.

**What changed**
- `public/favicon.svg` and `public/favicon-attention.svg`, redrawn.
- DECISIONS 0065, and a note in 0054.

**Steps, in order**
1. `git checkout -b feat/mustache-heart-favicon` from main.
2. Drew the heart in a 140 × 140 SVG: a clip path for the stripes, the eyes as two bars, and
   the mustache as one thick stroke with round ends.
3. Rendered both icons at 280, 64, 32 and 16 px in Chromium and compared them with the
   sheet. The first mustache was too thin and too high, so it was thickened and moved down.
4. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0065. The icon files keep their paths, so no code changed.

**How to do this by hand**
Open `/`: the tab shows the heart with an amber dot while the run has things to solve. Open
`/?run=run-clean`: the plain heart.

### 2026-09-24 · A decline that came back as "Approved"

**Goal**
Find and fix why declining some runs ended with the run showing "Approved", and errors like it.

**What changed**
- `lib/api.ts`: `undoDecision()`, and decisions kept in sessionStorage (`ledger:decisions`)
  so they survive page loads.
- `UndoBox.tsx` undoes through the api, with "Undoing…" and an alert if it fails.
- `DecisionPanel.tsx`: Reject or Request changes cancels a pending approve pop.
- Tests in `api.test.ts`, `UndoBox`, `DecisionPanel`, `RunReviewPage`, and an e2e test in
  `approve-flow.spec.ts`.
- DECISIONS 0064, README, `src/lib/README.md`.

**Steps, in order**
1. `git checkout -b fix/decision-outcomes` from main.
2. Rejected and requested changes on every pending run from a script: all correct on the run
   page. So the bug was elsewhere.
3. Rejected on `/`, then opened My reviews: the run was back to Pending, and its twin
   `run-messy`, with the same title, showed Approved. Cause: every link is a full page load,
   and decisions lived only in memory.
4. On `?run=run-messy`: Undo, then Reject gave "Approved". Cause: undo only changed the screen,
   so the api refused the Reject as a conflict with the old approval.
5. Read the approve button's pop: a 440 ms timer opened the approve dialog even if Reject was
   pressed meanwhile.
6. Fixed all three, then repeated steps 3–5 in Chromium: Rejected every time, also after a
   reload.
7. `npm run check` after each commit, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0064. sessionStorage keeps a decision across pages without adding a router, and
a new tab still starts the demo over.

**How to do this by hand**
Open `/?run=run-messy`, press Undo this decision, then Reject run with a reason: the page
says Rejected. Open My reviews: the run is under Declined. Reload: still Declined. Open a new
tab to start over.

### 2026-09-24 · Light and dark theme switch

**Goal**
A switch between dark and light mode at the top of the page.

**What changed**
- `components/ThemeToggle.tsx` (+ test and story) and `components/theme.ts`.
- `index.html`: applies a remembered choice before the first paint.
- The switch in `RunTopBar.tsx` and in `MyReviews.tsx`'s main and Archive headers.
- A keyboard spec test for the switch and its memory.
- DECISIONS 0063, `components/README.md`, README.

**Steps, in order**
1. `git checkout -b feat/theme-toggle` from main.
2. Wrote the component, the pre-paint script, and placed the switch.
3. In Chromium:
   - Space turned the page dark (body background `rgb(26, 26, 26)`);
   - reloading had `data-theme="dark"` before React loaded;
   - zoomed screenshots showed the knob too faint in dark, so it got a border and a violet
     active icon.
4. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0063. The tokens already supported an explicit theme, so the switch only sets
it and remembers it.

**How to do this by hand**
Click the sun and moon switch at the top right, then reload: the theme you chose stays. Clear
the site's storage to go back to the system setting.

**Verification**
`npm run check`, exit code 0:
- typecheck, lint and Prettier clean;
- 47 test files, 262 unit tests;
- 34 Playwright tests.

### 2026-09-24 · Archive and restore ask first

**Goal**
Ask before moving runs to the archive and before restoring one.

**What changed**
- `ReviewDialogs.tsx`: `ArchiveConfirmDialog` (one run or several) and
  `RestoreConfirmDialog`.
- `MyReviews.tsx`: the row Archive button, the bulk Archive button and Restore open them.
  Focus moves after the dialog closes.
- Tests: Cancel changes nothing, and confirming works, in the unit tests. The keyboard pass
  goes through both dialogs. The accessibility spec covers the archive one.
- DECISIONS 0062.

**Steps, in order**
1. `git checkout -b feat/confirm-archive-restore` from main.
2. Added the dialogs and wired them in. The keyboard spec then failed: focus went to
   `<body>` after confirming, because the table cannot take focus while the modal is still
   open. Focus now moves in an effect once the dialog has closed.
3. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0062.

**How to do this by hand**
In My reviews, Approved: press Archive on a row, then Cancel. Nothing changes. Press it again
and confirm. In the Archive, press Restore on the run that has one.

**Verification**
`npm run check`, exit code 0:
- typecheck, lint and Prettier clean;
- 46 test files, 260 unit tests;
- 33 Playwright tests.

### 2026-09-24 · My reviews: more sample runs, work in progress, archive, no scrollbars

**Goal**
Fill My reviews: more sample runs, the "still in progress" view in Pending and Requested for
change, archived runs (locked, and one restorable), and no visible scrollbars.

**What changed**
- `fixtures/sample-runs.ts` (+ test): 21 complete runs from `sampleRun`, registered in
  `fixtures/index.ts`.
- `lib/types.ts`: the `checks_running` status (label "Checks running").
- `lib/reviews.ts`: `reviewStage` knows the checks stage. `isInProgress` includes runs sent
  back for changes, and `progressOf` gives the fold its label.
- `MyReviews.tsx`: the fold in both tabs, "Sent back …" dates, the "Nothing here needs you
  yet" empty state, and hidden scrollbars on the tables.
- `Tabs.tsx`: the line variant hides its scrollbar.
- `ReviewsTable.tsx`: the Updated tip opens leftwards.
- Tests: page counts updated, and new tests for the in-progress views and the locked archive.
  The accessibility spec adds the Requested tab with its fold open.
- DECISIONS 0061, `fixtures/README.md`.

**Steps, in order**
1. `git checkout -b feat/more-sample-runs` from main.
2. Wrote the run builder and the 21 runs, then the model changes, then the page.
3. `npx vitest run`, then updated the tests that counted the old four runs.
4. `npx playwright test`, after fixing selectors that assumed a single approved run.
5. In Chromium, measured `scrollWidth` against `clientWidth` on each scrollbar-free box; that
   found the Updated tip's overflow. Also opened two of the new runs' review pages.
6. `npm run check`, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0061. Complete runs, not list rows, keep non-negotiable 3 true and make every
row open.

**How to do this by hand**
Open `/?view=reviews`: Pending shows 7 to review and "4 runs still in progress". Requested for
change shows its 3 in the fold. The Archive has one run with a Restore button and three with a
lock.

**Verification**
`npm run check`, exit code 0:
- typecheck, lint and Prettier clean;
- 46 test files, 260 unit tests;
- 31 Playwright tests.

### 2026-09-24 · My reviews, built from its Claude Design handoff

**Goal**
Build the user's new My reviews design ("My Reviews.dc.html", from the Claude Design handoff
zip). The user chose the whole design (search, filters, archive, reports, new-run requests)
and the four real fixture runs as its data.

**What changed**
- `lib/reviews.ts` (+ tests): run type and stage, open-item counts, search, calendar time
  ranges, sort, the archive rule, report records and CSV. `listRuns` returns full runs.
- Tokens: a blue status tint, a violet tint for selection, tab marks and toast colours, in
  light and both dark forms.
- Components: the `line` Tabs variant, InfoTip, Toast, and `tooltipPlacement.ts` (shared with
  Tabs). `Modal` gains an `eyebrow` line.
- `features/run/`: `MyReviews.tsx` (replaces `ReviewList.tsx`), `ReviewsTable`,
  `ArchiveTable`, `ReviewsToolbar`, `ReviewParts`, `ReviewDialogs`, `reportExport`, with tests
  and a story.
- Fixes found on the way, each in its own commit or noted in one:
  - every dialog opened in the top-left corner (a Tailwind reset; the run page too);
  - invisible tooltips still covered content;
  - the restore window was one day too long;
  - the row tick boxes had no visible keyboard focus.
- The accessibility spec covers six new states in both themes; the keyboard spec gains a
  My reviews pass.
- DECISIONS 0060. The spec's Out of scope line, the folder READMEs and the README are updated.

**Steps, in order**
1. Unzipped the handoff and read `My Reviews.dc.html` in full, script included. Asked two
   questions, scope and data, because the design contradicted the spec's out-of-scope line.
2. `git checkout -b feat/my-reviews`. Wrote the domain model and its tests first, then the
   tokens and components, then the page.
3. Screenshots at 1440 px (light and dark) and 390 px. They showed the off-centre dialogs, a
   too-narrow Run column and a wrapped dialog sentence.
4. axe over the new states. That found the separator contrast, and a "partially obscured"
   result that turned out to be axe not modelling a modal's top layer. It was narrowed down by
   hiding parts of the page one at a time; see 0060.
5. The keyboard pass found the tick boxes' missing focus outline.
6. `npm run check` after each commit, then merged only on exit code 0.

**Why it was done this way**
See DECISIONS 0060. Rules in `lib` with a `now` parameter keep the archive and time filters
testable. Reports are made in the browser because there is no server, and a PDF library would
have been a new dependency.

**How to do this by hand**
Open `/?view=reviews`. Try the tabs, search "refund", open Filters, tick the approved run,
then Create report (CSV) or archive it. Open Archive and restore it. Use the keyboard alone
for the same path.

**Verification**
`npm run check`, exit code 0:
- typecheck, lint and Prettier clean;
- theme bridge ok (59 colours across 3 themes);
- format-locale ok;
- 45 test files, 253 unit tests;
- 29 Playwright tests.

### 2026-09-24 · End-to-end spec, a time-boxed accessibility pass, docs to match

**Goal**
- Turn the approve flow, checked by hand many times this project, into a committed
  Playwright spec.
- Run a lighter, time-boxed accessibility review (automated contrast in both themes, one
  keyboard-only pass), record the scope honestly, and make AGENTS.md and the README match.
- The user also has a new My reviews design in Claude Design, to be built once its files
  arrive.

**What changed**
- `@playwright/test` and `@axe-core/playwright` added (dev only, approved by the user).
  `playwright.config.ts` starts Vite on port 5188. `tsconfig.e2e.json` added, and ESLint
  treats `e2e/` like test files.
- Three specs in `e2e/`, 18 tests. `npm run check` now runs them last (`test:e2e`):
  - `approve-flow.spec.ts`: load, follow an open item's link, tick all, give a reason,
    approve, undo.
  - `accessibility.spec.ts`: axe WCAG 2.2 A/AA with contrast, 8 states × light and dark.
  - `keyboard.spec.ts`: the whole review, keyboard only, focus visible at every stop.
- Three fixes the pass found:
  - the tab tooltips were `aria-hidden` inside the tab list (`Tabs.tsx`);
  - "Jump to the open items" now moves focus (`OpenItemsNotice.tsx`);
  - dialogs give focus back when they close (`Modal.tsx`).
  Each one has a unit test.
- DECISIONS 0059. AGENTS.md's non-negotiable 4, Stack and definition of done updated. README
  stack, commands and status updated.

**Steps, in order**
1. `npm install -D @playwright/test@1.63.0 @axe-core/playwright` (the runner pinned to the
   installed `playwright`).
2. Wrote the approve spec from the earlier ad hoc scripts. It first failed: the native tick
   box is visually hidden, so the spec clicks the label, as a person does.
3. A throwaway axe spec over 8 states × 2 themes. Contrast was clean. It found
   `aria-required-children` on every run page.
4. Fixed the tooltip, then wrote the committed accessibility spec. Checked that it bites:
   `--color-text-secondary: #d0d0d0` gave 43 contrast failures (token restored).
5. Recorded the tab order once, then wrote the keyboard spec. It found the jump link and
   the dialog focus loss. Fixed both.
6. `npm run check` after each commit; merged only when it exited 0.

**Why it was done this way**
See DECISIONS 0059. The checks are specs rather than a one-off run, so the covered states
stay checked. `Modal` records the opener on its first render because reading it in the effect
failed in the real browser.

**How to do this by hand**
`npm run test:e2e` runs the three specs. To see one fail, break a colour token in
`src/styles/tokens.css` and run `npx playwright test e2e/accessibility.spec.ts`. For the
keyboard pass: open the app, put the mouse away, and review and approve a run with Tab,
Space, Enter, the arrow keys and Escape.

**Verification**
`npm run check` exit code 0:
- typecheck, lint and Prettier clean;
- theme bridge ok (46 colours across 3 themes);
- format-locale ok;
- 42 test files, 225 unit tests;
- 18 Playwright tests passed.

### 2026-09-24 · README rewritten for the project as it stands

**Goal**
The public README still described the scaffolding stage. Rewrite it to match today: what the
app does, the real stack, real running instructions, and an honest status.

**What changed**
- `README.md` rewritten:
  - what the screen does;
  - a table of URLs for each run state;
  - the stack with today's test count (42 files, 223 tests);
  - running instructions, with the Node version Vite 8 needs;
  - where each kind of doc lives;
  - a status with what is left: publishing Storybook, the planned Playwright end-to-end
    test, and the accessibility and contrast review.
- The Vercel link, the design folder and the Storybook note stay at the top.

**Steps, in order**
1. `git checkout -b docs/readme-refresh` from main.
2. Took the facts from the repository, not from memory:
   - `package.json` for scripts and versions;
   - `node_modules/vite/package.json` for the Node range;
   - `src/app/App.tsx` for the URL parameters;
   - `src/fixtures/` for what each run shows;
   - `eslint.config.js` for the dependency rule;
   - `grep` in DECISIONS and WORKLOG, which found no accessibility review and no
     end-to-end test done yet.
3. Wrote the README, then loaded each URL in the table in Chromium and checked the page
   matched the description.
4. `npm run check`.

**Why it was done this way**
The request described the suite as "262 tests" and the page as "six built regions". Both were
true earlier: the cleanup brought the suite to 223, and the story layout replaced the regions.
The README gives today's numbers.

**How to do this by hand**
For each line of a README that states a fact, find the file that proves it. Open each URL it
lists.

**Verification**
`npm run check` was **not** green, though the entry first said it was:
- Prettier failed on `design/README.md`, after the user's GitHub edit in `182b9d2`.
- The command chain grepped the check's output instead of testing its exit code, so the
  commits and the merge went ahead anyway.
- The fix, `style: format design/README.md`, was whitespace only. The check was then green:
  typecheck, lint, Prettier, theme bridge, format-locale, 223 tests.

In Chromium:
- `/` and `?run=run-blocked` showed "3 things to solve";
- `?run=run-messy` showed Undo;
- `?view=reviews` showed "My reviews";
- `?delay=3000` showed "Loading run…" first.

### 2026-09-24 · Cleanups: orphaned code, unused packages, settings, format gate, AGENTS.md

**Goal**
The five cleanups held back from the polish pass, each in its own commit with `npm run check`
green after it. The sixth point was to keep the commit convention.

**What changed**
1. `refactor:` removed `ActionLink`, `AnchorNav`, `Checkbox`, `Disclosure`, `RegionCard`,
   `Tag` and `ToggleChip` (with tests and stories), `lib/summary.ts`, and `sortGates` and
   `filterTimeline`. `isError` and `resolveEvidence` were **kept**: the polish pass called
   them unused, but live code calls them (`timelineShape` and `explanationFor`). Comments
   and READMEs that named the removed code were updated.
2. `chore:` removed `components/ui/{button,checkbox,dialog}.tsx`, `class-variance-authority`
   and `eslint-config-prettier`. The lockfile lost only those two packages. The lint warning
   in `ui/button.tsx` is gone, and `npm run lint` is now clean.
3. `fix:` `.claude/settings.json` is valid JSON with the three allowed domains. Prettier puts
   the array on one line.
4. `chore:` `format:check` is part of `npm run check`. `README.md` and `design/README.md` are
   reformatted: whitespace and table padding, plus `*emphasis*` → `_emphasis_` in
   `design/README.md`, which renders the same.
5. `docs:` AGENTS.md no longer mentions `docs/notes.md`. There were two mentions, not three:
   "How to work" never named it. That section now says to ask the end-of-session question
   in the conversation.
6. Every commit in this batch uses a conventional prefix (`refactor:`, `chore:`, `fix:`,
   `docs:`), as AGENTS.md asks.

**Steps, in order**
1. `git checkout -b chore/cleanups` from main.
2. Checked references first:
   - `grep -rlw <name> src .storybook docs README.md design` for each component;
   - `grep -rlw` for each function;
   - read each hit before deleting.
3. `git rm` the files, then `npm uninstall class-variance-authority eslint-config-prettier`.
4. `npx prettier --write README.md design/README.md`, then `format:check` added to `check` in
   `package.json`.
5. `npm run check` after every commit.

**Why it was done this way**
- Checking references first caught `isError` and `resolveEvidence`. Removing them would have
  meant inlining them into live, tested code, the "riskier than expected" case, so they stay.
- Four motion tokens in `tokens.css` (`--motion-duration-open`, `--motion-duration-close`,
  `--motion-ease-spring`, `--motion-ease-in`) were used only by `Disclosure`. They are now
  unused, and are left for the user to decide on rather than widening this batch.

**How to do this by hand**
Before deleting a file, run `grep -rlw Name src` and read every hit. After `npm uninstall`,
run `git diff package-lock.json | grep '"node_modules/'` to confirm only the packages you
meant to remove went.

**Verification**
`npm run check` after each commit:
- typecheck clean;
- lint clean (the earlier warning is gone);
- Prettier "All matched files use Prettier code style!";
- theme bridge ok (46 colours across 3 themes);
- format-locale ok;
- 42 test files, 223 tests passed. That is 39 fewer tests than before, every one of them a
  test of deleted code.

### 2026-09-24 · Final polish pass: audit, comments, small cleanups

**Goal**
Report leftover code, inconsistencies, unexplained complexity and type gaps, then fix only
what is worth fixing. Anything that deletes tested code or changes dependencies is held for
the user.

**What changed**
- Comments explaining *why* in four places: the tab pill's forced reflow (`Tabs.tsx`),
  `StepsTab` updating state while rendering, the intro's `onDone` ref, and a sort comparator
  in `RunDetails` that exists only for type narrowing.
- Comments in `ActorName`, `DecisionDialog` (+ story) and `format.ts` now name live
  components instead of removed ones. The lib README no longer mentions the removed
  one-sentence summary.
- `spotlight.ts` (+ test) moved from `lib/` to `components/`: `lib` must not touch the DOM
  (AGENTS.md). `components/README.md` notes it.
- `formatTimeZoneLabel` removed: it had no users and no test.
- `scripts/*.mjs` formatted with Prettier (whitespace only).

**Steps, in order**
1. `npm run check` as a baseline: green, one warning in the unused `ui/button.tsx`.
2. Searches, with `grep -rnE`, for `console.*`, `debugger`, `eslint-disable`, `@ts-ignore`,
   `any`, TODOs and commented-out code. None found.
3. `npx --yes knip@5` for unused files, exports and dependencies, then a grep per module for
   code whose only users are its own tests or stories. `git log --diff-filter=D` traced each
   one to the section components deleted in `5addfbe`.
4. `npx prettier --check .` for formatting drift.
5. Five commits, one concern each, with `npm run check` after each one.

**Why it was done this way**
The brief was to report first and to stop before touching tested behaviour. So the
components left behind by the old sections, `lib/summary.ts`, and the unused `gates.ts` and
`timeline.ts` functions all have passing tests of their own. Removing them deletes those
tests, and that is held for the user. So are the unused shadcn `ui/` files and their
`class-variance-authority` package, `eslint-config-prettier` (installed but never wired in),
and the broken `.claude/settings.json`.

**How to do this by hand**
Run `npx --yes knip@5` to list unused files and exports. For each one, check `git log
--diff-filter=D --name-only` to see what used to import it before deleting anything.

**Verification**
`npm run check` after each of the five commits: typecheck and lint clean (the one warning is
in the unused `ui/button.tsx`), theme bridge ok (46 colours across 3 themes), format-locale
ok, 262 tests passed.

### 2026-09-24 · Browser title

**Goal**
The browser title says what the app is, then a thin divider, then who made it.

**What changed**
- `index.html`: the title is "Review agent runs | By Berit Alasmäki" (was "Ledger — demo").
- DECISIONS 0058 updated.

**Steps, in order**
1. `git checkout -b feat/browser-title` from main.
2. Changed the title, and checked in Chromium that it reads correctly, "ä" included.
3. `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0058. Nothing in the app sets `document.title`, so `index.html` is the one place.

**How to do this by hand**
Open the app and read the browser tab.

**Verification**
`npm run check` passed. In Chromium, `document.title` read "Review agent runs | By Berit
Alasmäki".

### 2026-09-24 · "Review agent runs" replaces "By Berit ❤︎"

**Goal**
Remove the distracting "By Berit ❤︎" mark, and name what the app does in its place.

**What changed**
- `RunTopBar.tsx`: `Byline` becomes `AppName`, "Review agent runs", shown from md up.
- The page test now checks the name, and that the mark is gone.
- DECISIONS 0058 (0057 marked as replaced).

**Steps, in order**
1. `git checkout -b feat/app-name` from main.
2. Swapped the text. A 390 px screenshot showed the run's name squeezed to one letter, so the
   name is hidden below md.
3. `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0058.

**How to do this by hand**
Open the run page on a laptop: "Review agent runs | ‹ My reviews › …" at the top left. On a
phone it starts at "‹ My reviews".

**Verification**
`npm run check` passed, and there are screenshots at 1440, 768 and 390 px.

### 2026-09-23 · "By Berit ❤︎" moves to the left

**Goal**
Move the mark from the right end of the top bar to the left, as the user asked.

**What changed**
- `RunTopBar.tsx`: `Byline` comes first, with a thin rule before the breadcrumb. What is open
  keeps the right end from md, and has its own row on narrow screens.
- DECISIONS 0057 updated.

**Steps, in order**
1. `git checkout -b feat/byline-left` from main.
2. Moved the mark, then took screenshots at 1440, 800 and 390 px, on a run with things open and
   a clean one.
3. `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0057.

**How to do this by hand**
Open the run page: "By Berit ❤︎ | ‹ My reviews › …" reads from the top left.

**Verification**
`npm run check` passed. The bar was one row high (49 px) at 1440 px and on a clean phone run,
and two rows (77 px) on a phone with things open.

### 2026-09-23 · "By Berit ❤︎" in the top bar

**Goal**
A mark at the right of the top navigation reading "By Berit ❤︎", with an orange heart.

**What changed**
- `RunTopBar.tsx`: a `Byline` at the far right, and a new order for narrow screens.
- `RunReviewPage.tsx`: one `toSolve` flag drives the favicon dot and the bar's notice. The
  notice is passed only when there is something to solve.
- A page test for the mark. DECISIONS 0057.

**Steps, in order**
1. `git checkout -b feat/byline-mark` from main.
2. Added the mark. Screenshots at four widths showed it alone on a third row on a phone, so it
   moved up to the breadcrumb row there.
3. Test, `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0057. The heart is text, not an emoji, so it takes the orange.

**How to do this by hand**
Open the run page. "By Berit ❤︎" is at the top right. On a phone it is at the end of the
breadcrumb row.

**Verification**
`npm run check` passed. The screenshots and computed colour are in DECISIONS 0057.

### 2026-09-23 · Open item links, and a spotlight on "Jump to the open items"

**Goal**
Link every open item to the problem it names, and spotlight the tick list when "Jump to the
open items" is clicked.

**What changed**
- `lib/openItems.ts`: each item has a `target` (tests updated).
- `DecisionPanel.tsx`: a "Show the … →" link under each item, outside the tick's label. The
  list is `.t-spotlight`.
- `CheckCard.tsx`, `ScoreCard.tsx`: ids and `tabIndex=-1`, with a focus ring, via the new
  `openItemTargets.ts`.
- `RunReviewPage.tsx`: `showItem` switches the view, then scrolls to and focuses the card.
- `OpenItemsNotice.tsx`: the link scrolls to the list and spotlights it.
- New `lib/spotlight.ts` (+ test), `.t-spotlight` in `transitions.css`, and the
  `--color-spotlight-scrim` token.
- Tests for the links, the page navigation and the spotlight. DECISIONS 0055 and 0056.
- Also: the "Run details" card scrolls with no visible scrollbar (`scrollbar-none` in
  `index.css`, DECISIONS 0054 updated).

**Steps, in order**
1. `git checkout -b feat/open-item-links` from main.
2. Item targets, then links, then the page navigation, then tests.
3. The spotlight: CSS, helper, and wiring into the notice link.
4. Chromium: spotlight frames at 120, 450, 1000 and 1500 ms, and all three link kinds.
5. `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0055 and 0056.

**How to do this by hand**
On the pending run, click "Show the score →" under the Side effects item: Story opens on that
card, outlined. Scroll down and click "Jump to the open items" in the top bar: the page dims
around the list for about a second.

**Verification**
`npm run check` passed, with 261 tests. The Chromium checks are in DECISIONS 0055 and 0056.

### 2026-09-23 · Run details scroll, and an amber dot on the favicon

**Goal**
Let the sticky "Run details" column scroll to its end without waiting for the rest of the
page. Show an amber dot on the favicon while a run has things to solve.

**What changed**
- `RunDetails.tsx`: accepts `className`, `tabIndex` and `ref`.
- `RunReviewPage.tsx`: from xl up the card is capped to the window and scrolls on its own,
  and is a tab stop only while it overflows. It calls `useAttentionFavicon`.
- New `useAttentionFavicon.ts` (+ test) and `public/favicon-attention.svg`.
- DECISIONS 0054.

**Steps, in order**
1. `git checkout -b fix/run-details-scroll` from main.
2. Capped the card and measured its overflow. Checked it in a short and a tall window.
3. Drew the dotted icon, wrote the hook, checked it on three pages, and rendered it at 16, 32
   and 96 px.
4. `npm run check`, then merged into main.

**Why it was done this way**
See DECISIONS 0054. The card, not a wrapper, is the scroller, so its focus is announced as
"Run details".

**How to do this by hand**
Make the window short and wide (1440 × 700). Scroll with the mouse over "Run details": it
reaches "Lowest score" while the page stays put. The tab's icon has an amber dot on the pending
run. It goes away on `?run=run-clean`, or once the run is decided.

**Verification**
`npm run check` passed. Chromium measurements are in DECISIONS 0054.

### 2026-09-23 · Open items in the top bar

**Goal**
Move the "3 things are open" card into the top navigation, as one horizontal line: a yellow
dot, "3 things to solve" and the link, with no background and no description. That moves
"Your decision" up.

**What changed**
- `OpenItemsBox.*` renamed to `OpenItemsNotice.*` (component, test and story) and rewritten
  as one inline line.
- `RunTopBar.tsx`: a new `end` slot, and the bar wraps.
- `RunReviewPage.tsx`: the notice goes in the bar before a decision, and out of the right
  column.
- `lib/openItems.ts`: `describeOpenItems` and its tests removed.
- `tokens.css`: `--color-status-waived-dot`.
- `features/run/README.md`, DECISIONS 0053.

**Steps, in order**
1. `git checkout -b feat/open-items-in-bar` from main.
2. Built the notice, moved it, removed the unused summary helper.
3. Tests, screenshots at three widths and both themes, the jump link measured, then
   `npm run check`.

**Why it was done this way**
See DECISIONS 0053.

**How to do this by hand**
Open the pending run: the bar reads "● 3 things to solve  Jump to the open items →" on the
right, and "Your decision" heads the right column. Click the link: the tick list comes into
view under the bar. Open `?run=run-clean`: no notice.

**Verification**
`npm run check` passed. In Chromium the tick list landed 16 px below the bar at 1440, 1024
and 390 px wide.

### 2026-09-23 · View tabs above the view

**Goal**
Move the Story / Evidence / All steps tabs from the top bar to just above "What happened, in
order", since only that area changes when a tab is clicked.

**What changed**
- New `RunViewTabs.tsx` (+ story). `RunTopBar.tsx` keeps only the breadcrumb, and its story
  loses the Tabs wrapper.
- `RunReviewPage.tsx`: the tabs sit at the top of the view column, sticky under the bar. The
  page measures their height into `--run-tabs-height`.
- `SectionHeading.tsx`: the scroll margin now clears the bar and the tabs.
- `features/run/README.md`, DECISIONS 0052.

**Steps, in order**
1. `git checkout -b feat/tabs-in-main`, stacked on `feat/approve-pop`.
2. Extracted the tab list and moved it into the view column.
3. Tests, `npm run check`, then screenshots and scroll measurements in Chromium.

**Why it was done this way**
See DECISIONS 0052. The tabs stay sticky, so the views are still one click away in a long
run.

**How to do this by hand**
Open the page and scroll down the story: the tabs stick under the breadcrumb bar. Click
Evidence: the page scrolls so the Evidence heading sits right under the tabs.

**Verification**
`npm run check` passed. In Chromium at 1440 px, after the smooth scroll the heading's top was
at 125 px, equal to the bottom of the tabs, and the heading had focus.

### 2026-09-23 · Approve button pop

**Goal**
Make "Approve and release" pop like the button in the user's reference video when clicked.

**What changed**
- `src/styles/transitions.css`: new "Approve pop" section with `t-pop-button` and
  `t-pop-label` keyframes, `--pop-dur` and `--pop-ease`, and a reduced-motion guard.
- `DecisionPanel.tsx`: Approve plays the pop, then opens the confirmation. The label is
  wrapped in `.t-pop-label`.
- `DecisionPanel.test.tsx`: two tests, one for pop then dialog and one for reduced motion.
- DECISIONS 0051.

**Steps, in order**
1. Read the video frame by frame (ffmpeg, 30 fps) to get the scale curve and timings.
2. Wrote the keyframes and wired them into the panel's Approve click.
3. Tests, then sampled the transform and dialog timing in Chromium.

**Why it was done this way**
See DECISIONS 0051. The dialog waits for the pop, or the modal would cover it.

**How to do this by hand**
Open `?run=run-clean` and click "Approve and release": the button pops, then the confirmation
opens. With reduced motion turned on in the OS, the confirmation opens straight away.

**Verification**
`npm run check` passed. In Chromium, the transform followed the keyframes and the dialog
opened at about 470 ms, or about 20 ms with reduced motion.
### 2026-09-23 · Loading state: thinking orb, centred

**Goal**
Replace the plain "Loading…" text with the `thinking-orbs` orb and the text under it, centred.

**What changed**
- `package.json` / lock: `thinking-orbs` 0.3.2, pinned exactly.
- New `components/LoadingState.tsx` (+ test and story), used by `RunReviewPage` and
  `ReviewList`.
- `vitest.setup.ts`: canvas stub. DECISIONS 0050, `components/README.md`.

**Steps, in order**
1. `git checkout -B feat/loading-orb origin/main`.
2. `npm view thinking-orbs` and `npm pack thinking-orbs@0.3.2` into a scratch folder. Read
   `package.json` (no install scripts), the typings and the README (accessibility, reduced
   motion, theme), and searched the code for network calls (none).
3. `npm install thinking-orbs@0.3.2 --save-exact`.
4. Built `LoadingState`, used it in both loading states, and added the jsdom canvas stub.
5. `npm run check`; Playwright with `?delay=5000` in light, dark and at 390 px.

**Why it was done this way**
A shared component keeps both loading states identical. The orb is hidden from screen readers
because the text under it is the status.

**How to do this by hand**
Open `?delay=5000` in a fresh tab (skip the intro with any key). The orb and "Loading run…"
sit in the middle of the screen for five seconds.

**Verification**
`npm run check` passed. In Playwright, the group's centre matched the window's centre at
1280 × 800 (640, 400) and at 390 px (195, 400), in both themes. The orb was 64 × 64 with the
label below it.

**Open questions / next**
None.

### 2026-09-23 · Intro: once per visit

**Goal**
Show the welcome intro every time someone comes back to the site, not only on their very first
visit.

**What changed**
- `src/app/intro.ts`: the flag moves from localStorage to sessionStorage, and the old
  localStorage flag is removed.
- `WelcomeIntro.tsx`: doc comment updated. Story note, tests and `app/README.md` updated.
- DECISIONS 0049.

**Steps, in order**
1. `git checkout -B feat/intro-every-visit origin/main`.
2. Swapped the storage and updated the tests: a new visit (empty sessionStorage) shows it
   again, and the old flag is cleared.
3. `npm run check`, then five visit cases in Playwright.

**Why it was done this way**
See DECISIONS 0049. "Every page load" would replay the intro on every in-app link, because
those links reload the page.

**How to do this by hand**
Open the site in a new tab: the intro plays. Click "My reviews", or reload: it doesn't play.
Close the tab, open the site again: it plays.

**Verification**
`npm run check` passed. In Playwright, the intro showed on a first visit, a new tab and a new
browser session. It did not show on navigating inside the visit, or on a reload.

**Open questions / next**
None.

### 2026-09-23 · Intro: signature closer to the name

**Goal**
Bring the signature mark down, closer to the name and title.

**What changed**
`SignatureMark.tsx` gains `bottomAligned`, which sets `preserveAspectRatio="xMidYMax meet"`.
`WelcomeIntro.tsx`: the block gap goes from `--space-5` to `--space-3`, and "Made by" is
placed at the drawn mark's centre. DECISIONS 0048 has a note.

**Steps, in order**
1. Anchored the artwork to the bottom of its 200×200 box, and tightened the gap.
2. `npm run check`, then measured it in Playwright.

**Why it was done this way**
The box keeps the specified 200×200 size. Only where the wide artwork sits inside it changes,
and the path is untouched.

**How to do this by hand**
Clear `ledger:intro-seen`, reload, and look at the space between the signature and the name.

**Verification**
`npm run check` passed. In the browser, the mark's bottom is 13 px above the name, and
"Made by" is centred on the mark (both at y = 412).

**Open questions / next**
None.

### 2026-09-23 · Intro: name and title aligned as one block

**Goal**
Align the intro's name and title as in the user's reference image: a shared left edge, with the
title as wide as the name.

**What changed**
`src/app/WelcomeIntro.tsx`: the two lines are one left-aligned block, and the title is regular
weight at body size, with its letter spacing fitted to the name's width. DECISIONS 0048 has a
note on the fit.

**Steps, in order**
1. Replaced the per-line centring with `items-start`. The parent still centres the block.
2. A layout effect measures both lines and sets the title's tracking to the difference over
   its character gaps, with a negative right margin for the trailing spacing. It measures again
   after `document.fonts.ready`.
3. `npm run check`, then measured the glyph edges in Playwright.

**Why it was done this way**
Fixed letter spacing only lines up for one exact font, and Raleway may load late or not at all.
Measuring makes the edges meet in every case.

**How to do this by hand**
Clear `ledger:intro-seen`, reload, and wait for "Made by". Both lines should start and end at
the same x.

**Verification**
`npm run check` passed: every test, typecheck and lint. In the browser, the name and title
glyphs run 530–750 px at 1280 px wide and 85–305 px at 390 px.

**Open questions / next**
None.

### 2026-09-23 · Motion: success check, tab tooltips, sliding tabs, and a one-time intro

**Goal**
Add three transitions.dev transitions (success check on approve, tooltips on the view tabs,
sliding tab pill) and a one-time welcome intro with the signature mark.

**What changed**
- `src/styles/transitions.css` (new): the three transitions, ported by hand (DECISIONS 0047).
- `components/Tabs.tsx`: pill variant with a sliding pill and `tooltip` per tab; Escape
  dismisses; tooltips stay inside the window. `RunTopBar` gives each view a tooltip.
- `features/run/UndoBox.tsx`: "Approved" with a check. On a fresh decision the check plays and
  focus moves there. `RunReviewPage` tracks "decided on this page".
- `src/app/WelcomeIntro.tsx`, `intro.ts`, `intro.css`, `SignatureMark.tsx` (new), and
  `App.tsx` (the intro over the page, plus a `?delay=<ms>` knob) (DECISIONS 0048).
- `styles/tokens.css`: `--signature-orange`, plus `--color-signature` and `--color-intro-*`.
- Tests: `Tabs.test.tsx`, `WelcomeIntro.test.tsx`, and additions to UndoBox, page and App
  tests. New story: `App/WelcomeIntro`.
- Docs: DECISIONS 0047–0048, and the styles, app, components and features READMEs.

**Steps, in order**
1. `npm pack transitions-dev@0.3.0` into a scratch folder, and read `free/success-check.md`,
   `free/tooltip.md` and `free/tabs-sliding.md`. Nothing was installed into the repo.
2. Ported the CSS into `transitions.css` and wired it into `Tabs` and `UndoBox`.
3. Built the intro, then tests with fake timers for the sequence, the flag, the skip and
   reduced motion.
4. `npx prettier --write src`, `npm run check`, and `npx storybook build`.
5. Playwright on `npx vite --port 5199`: measured the intro's phase times, recorded it with
   `?delay=6000`, took one frame per step, sampled the pill's position every frame, and
   measured every tooltip's box.

**Why it was done this way**
See DECISIONS 0047 and 0048. In short: the package was recipes, not a library, so porting
beat installing. The intro sits over a page that is already loading, so it never delays the
data. The name and title are real typed text, because typing needs characters.

**How to do this by hand**
Clear `ledger:intro-seen` in DevTools → Application → Local Storage and reload to see the
intro again. Add `?delay=6000` to see the handoff to "Loading run…". Hover the view tabs for
their tooltips. Approve `?run=run-clean` to see the success check.

**Verification**
- `npm run check`: 47 test files and 251 tests passing, typecheck and lint clean (the one
  existing warning), and theme checks ok for 44 colours. The Storybook build includes
  `app-welcomeintro--intro`.
- In the browser, the intro's phases ran at: draw 0 ms, resolve 864 ms, typing 1069 ms,
  "Made by" 2625 ms, fade 3315 ms, gone 3845 ms, with the flag set. The second visit showed
  no intro. With `?delay=6000`, the intro handed off to "Loading run…" and then the run.
  The signature path's bounding box is 177.3 × 100 in its 178 × 101 viewBox.
- The pill slid from 4 px to 181 px in about 250 ms. At 1280 px, the rightmost tooltip moved
  from ending at 1356 px (off screen) to 1276 px. No horizontal scroll at 1280 or 390 px.
- After approving, focus is on the "Approved" heading.

**Open questions / next**
- Raleway doesn't load in this sandbox (Google Fonts is blocked), so the screenshots show a
  fallback font. Check the typed name in a normal browser.
- Should the typed name and title use the supplied SVG outlines instead of live text? That
  would mean revealing them some other way than character by character.

### 2026-09-23 · Three columns: Run details on the left

**Goal**
Follow the user's next design: "Run details" as its own left-hand column, the overview as a
card above the story, what is open (or undo) at the top of the right column, and no "Show /
Hide details" button.

**What changed**
- New `RunDetails.tsx` and `OpenItemsBox.tsx`, each with tests and stories.
- `RunOverview.tsx` cut down to the card (status, title, why, where now); its tests and stories
  were rewritten.
- `RunReviewPage.tsx`: three-column grid (two from `md`, one on phones). The details state and
  the forced-open logic are removed. The sticky bar and the focus move stay.
- `useUndoActive.ts` (+ test) removed. `UndoBox` fills the column width. `RunTopBar` uses the
  same width as the grid.
- DECISIONS 0046 (and notes on 0044 and 0045), spec layout paragraph, `features/run/README.md`.

**Steps, in order**
1. `git fetch origin main && git checkout -B feat/run-details-column origin/main`.
2. Split `RunOverview` into three components, rebuilt the page grid, and removed the
   collapse code.
3. `npx prettier --write src/features/run`, `npm run check`, and Playwright at 1440, 1024 and
   390 px.

**Why it was done this way**
See DECISIONS 0046. The right column stopped being sticky because, before a decision, it is
taller than the screen.

**How to do this by hand**
Open the design image next to `?run=run-messy-pending` and `?run=run-messy` at 1440 px, and
compare each column.

**Verification**
- `npm run check`: 45 test files and 238 tests passing, typecheck and lint clean (the
  one existing warning), both theme checks ok.
- Playwright: no page errors and no horizontal scroll at 1440, 1024 or 390 px.

**Open questions / next**
- The top bar in design 1b also shows "run-messy · e91a4c · GMT+3". Left out, because the same
  facts are in Run details. Add it if you want it repeated there.

### 2026-09-23 · Details stay open while a decision can be undone

**Goal**
Keep the undo countdown and the Undo button on screen: the details always show while the undo
window is open.

**What changed**
- New `features/run/useUndoActive.ts` (+ test).
- `RunOverview.tsx`: forced open, with no toggle, while undo is possible.
- `RunReviewPage.tsx`: doesn't collapse on a view change while undo is possible, and opens the
  details when a decision is made.
- Tests for the page and overview, two overview stories, DECISIONS 0045, `features/run/README.md`.

**Steps, in order**
1. Checked that the previous change wasn't merged yet (`git merge-base --is-ancestor`), so
   continued on `feat/story-layout`.
2. Made the changes above, then `npx prettier --write` on the changed files and `npm run check`.

**Why it was done this way**
See DECISIONS 0045. The page keeps the details open, not just the overview, so they don't
collapse the moment the window closes.

**How to do this by hand**
Open `?run=run-messy` and click "Evidence". The header stays expanded, with the countdown and
"Undo this decision" and no "Hide details". Approve `?run=run-clean` after switching views:
the details open.

**Verification**
`npm run check`: 44 test files and 243 tests passing, typecheck and lint clean (the one
existing warning), both theme checks ok.

**Open questions / next**
None.

### 2026-09-23 · Switching views: focus, sticky top bar, collapsible details

**Goal**
Make a tab change visible and announced: move focus to the chosen view, keep the top bar in
place, and collapse the overview details once the reviewer starts switching views.

**What changed**
- `components/Tabs.tsx`: an `activationMode` prop (`manual` for this page).
- `features/run/RunTopBar.tsx`: sticky, and takes a `ref` so its height can be measured.
- `features/run/RunOverview.tsx`: `expanded` / `onExpandedChange`, a compact row, and the
  "Show details" / "Hide details" button on the bottom border.
- `features/run/SectionHeading.tsx`: `focusTarget` (focusable by script, scroll margin under
  the bar). Used by the Story, Evidence and All steps headings.
- `features/run/RunReviewPage.tsx`: details state, `--run-bar-height`, and focus moving after
  a view change. `DecisionPanel`'s tick list and the sticky right column offset by the bar height.
- Tests (page and overview) and two overview stories. DECISIONS 0044, spec, and
  `features/run/README.md`.

**Steps, in order**
1. `git fetch origin main && git checkout -B feat/story-layout origin/main` (PR #10 was merged).
2. Made the changes above, then `npx prettier --write` on the changed files.
3. `npm run check`; a Playwright pass on `npx vite --port 5199` at 1440 px and 390 px.

**Why it was done this way**
See DECISIONS 0044. In short: the focus move waits one frame because Radix selects on
mousedown, and the browser then focuses the clicked tab. Manual activation keeps arrow-key
navigation inside the tab list.

**How to do this by hand**
In the running app, scroll down and click "Evidence". The page should scroll so the
"Evidence" heading sits just under the bar, with the header collapsed. Press Tab once: focus
should go to the first thing inside Evidence, not back to the top of the page.

**Verification**
- `npm run check`: 43 test files and 238 tests passing, typecheck and lint clean (the one
  existing warning), both theme checks ok.
- Playwright: after a mouse click, focus is on `evidence-heading`, at 86 px under a bar ending at
  62 px. At 390 px, the heading is at 121 px under a bar ending at 97 px, with no horizontal
  scroll. The toggle's centre is within 1 px of the border line in both states.

**Open questions / next**
- Settled in the follow-up below: the details now always show while undo is possible (0045).

### 2026-09-23 · Story layout: the Claude Design redesign, built

**Goal**
Build the "Ledger Review Redesign" handoff from Claude Design: design 1a (before anyone
decides) and 1b (approved, undo still open) as two states of one page.

**What changed**
- Data model (`lib/types.ts`): `Run.story` and `Run.assignment` added.
  `Decision.acknowledgedGateIds` became `acknowledgedItemIds`. Spec updated to match.
- Fixtures: Finnish names everywhere, run-messy moved to 2026-09-23, story data for all three
  runs, a new `run-messy-pending` twin, and a reason on run-messy's approval.
- `lib/`: new `openItems.ts`, `story.ts`, `steps.ts`, `evidence.ts`; `confidenceLevel`, time and
  count formatters, `testsPassing`, `listRuns`; the approval-reason rule in `submitDecision`.
  `attention.ts`, `gateAcknowledgement` and `formatSignOffMessage` removed.
- `features/run/`: new `RunTopBar`, `RunOverview`, `UndoBox`, `StoryTimeline`, `ScoreCard`,
  `CheckCard`, `EvidenceTab`, `StepsTab`, `DecisionPanel`, `UnverifiedList`, `RunShape`,
  `ReviewList`, `SectionHeading`, each with a story and a test. `RunReviewPage` rewritten.
  The eleven old region components were removed with their stories and tests.
- `components/Tabs.tsx`: a `pill` variant. `lib/utils.ts`: `cn` knows the type scale.
- `styles/tokens.css`: one red tint pair and three type sizes (`lead`, `caption`, `score`).
- `App.tsx`: no wordmark; `?view=reviews` shows "My reviews".
- Docs: DECISIONS 0038–0043, spec, folder READMEs.

**Steps, in order**
1. Read the handoff bundle's README, the chat transcript and `Ledger Review Redesign.dc.html`
   in full. Listed where the design goes against a recorded decision (0032, 0033, the spec's
   sign-off rule, 0035) and asked the user about each one. All four: follow the design.
2. `git checkout -b feat/story-layout`, `npm ci`, and a baseline `npm run check` (222 tests).
3. Data first: types, then fixtures, then lib helpers with their tests (`npx vitest run src/lib
   src/fixtures`).
4. Tokens, then components from the inside out (`ScoreCard`, `CheckCard` → `StoryTimeline` →
   the tabs → `DecisionPanel` → `RunOverview` → `RunReviewPage`), then `git rm` of the old
   regions.
5. Tests and stories for every new component (the `new-component` skill); `npx prettier --write src`.
6. `npm run check`, then a Playwright pass against `npx vite --port 5199`.

**Why it was done this way**
The story's prose can't be derived from events, and AGENTS.md rule 3 forbids unsourced claims.
So the story is data with evidence ids, like the summary (0038). Pending and approved are one
layout, not two pages, so undo can move between them in place.

**How to do this by hand**
Open the `.dc.html` next to Storybook's `Features/Run/RunReviewPage` stories
(`AwaitingReview` and `Approved`), and compare region by region at 1440 px. Mockup values map
onto the nearest token: 160 px page padding → `max-w-6xl`, 28/26/10/6 px gaps → `--space-*`.

**Verification**
- `npm run check`: typecheck and lint clean (the one existing `button.tsx` warning), both theme
  checks ok, 43 test files and 233 tests passing.
- Playwright (Chromium, 1440 px and 390 px, light and dark): no console errors apart from the
  Google Fonts request, which this sandbox's proxy blocks. No horizontal scroll at 390 px.
- The keyboard-only path passed: arrow keys between tabs, then Tab to each tick → Space →
  reason → Approve and release → confirm → Undo.
- The screenshots found two real bugs, both fixed and recorded in 0043.

**Open questions / next**
- The status labels keep the spec's exact words ("Awaiting review", "Approved"). The mockup
  says "Awaiting your review" and "Approved and released". Change the spec if those are wanted.
- "Run check again" and Undo are local only. The api store keeps a decision after an on-screen
  undo (0017), so deciding the same run again in one session gives the conflict dialog.
- `Run.summary` is no longer shown anywhere. Decide whether to drop it from the model.
- The timeline type filters (0031) went with the redesign. Re-add them to the step list if
  reviewers miss them.

### 2026-09-22 · Second correction pass, plus a new wordmark

**Goal**
After the previous correction pass's PR merged, the user sent four more reference images and
asked for another round: a fast "Deselect all" action on the timeline filter, the confidence
band bleeding edge-to-edge like the mockup instead of sitting inside padding, the decided-view
actor pill no longer blending into its own card, more padding around `RegionCard` content, tab
hover as an underline instead of a background fill, and — mid-turn — a new text-only wordmark
to replace the SVG logo from the previous round.

**What changed**
- `src/features/run/TimelineFilters.tsx` — added a "Deselect all" action as a real
  `DropdownMenu.Item` (disabled when nothing is hidden), not a plain `<button>`, so it joins
  Radix's roving-focus arrow-key group like every other item in the menu.
- `src/features/run/TimelineFilters.test.tsx` — updated the one test that opens the dropdown
  to click "Deselect all" via its `menuitem` role and assert `aria-disabled`, matching the
  role change from the `<button>` → `DropdownMenu.Item` conversion.
- `src/features/run/ConfidencePanel.tsx` — restructured both row variants so the
  percentage/icon band touches the row's own edges directly (`overflow-hidden` on the row
  clips it to the card's own `rounded-md`), with content moved into a separately-padded inner
  wrapper using `Disclosure`'s `summaryClassName`/`contentClassName` props from the previous
  round.
- `src/features/run/DecisionBar.tsx` — `DecidedView`'s `ActorName` pill gets
  `className="bg-surface"` to override its default `bg-surface-raised` fill, which was the
  same colour as this one card variant's own background.
- `src/components/RegionCard.tsx` — default padding `--space-4` (16px) → `--space-5` (24px),
  app-wide.
- `src/components/Tabs.tsx` — hover changed from `hover:bg-border-subtle` to `hover:underline`;
  horizontal padding bumped to `--space-5` to match `RegionCard`'s new default.
- `src/features/run/PolicyGateList.tsx` — tab-bar bleed margin updated from `-space-4` to
  `-space-5` to match.
- `src/app/App.tsx` — `Wordmark` replaced: the SVG double-exposure logo from the previous
  round is gone, in favour of a plain two-line text lockup ("LEDGER" / "DEMO" in
  `--color-primary`), per the user's second logo image.

**Steps, in order**
1. Read all three new reference images side by side with the relevant existing component and
   the original Figma mockups, not from memory.
2. Fixed each issue in its own file, verifying visually via Playwright screenshots after each.
3. Diagnosed the "Deselect all" keyboard reachability with a Playwright keyboard trace before
   concluding a plain `<button>` was insufficient — see `docs/DECISIONS.md` 0037 for the full
   trace and the false alarm it also ruled out along the way.
4. Replaced the wordmark when the second logo image arrived mid-session.
5. Ran `npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, full
   vitest suite) after all changes were in.
6. Ran a full-page Playwright screenshot pass across all three fixtures (`run-clean`,
   `run-blocked`, `run-messy`) in both themes, plus a keyboard pass covering tab hover/
   navigation, the timeline dropdown (including "Deselect all"), and the `RunHeader`
   Disclosure.

**Why it was done this way**
See `docs/DECISIONS.md` 0037 for the four real trade-offs from this round: the
`DropdownMenu.Item` vs. plain-`<button>` choice for "Deselect all," why `RegionCard`'s padding
change is global rather than per-region, why the confidence band's bleed reuses `overflow-
hidden` + the parent's own radius rather than a hard-coded matching radius, and why the
`ActorName` pill override is scoped to one call site.

**How to do this by hand**
Not identical to the steps above — the by-hand version has no Playwright pass: open each
fixture in a browser directly, toggle both themes, and eyeball each changed region against
its mockup; test keyboard behaviour by tabbing and arrow-keying through the timeline dropdown
and the tabs by hand.

**Verification**
`npm run check` — 222/222 tests, 0 lint errors (1 pre-existing unrelated warning), typecheck,
theme-bridge and format-locale checks all green. Playwright screenshot pass across
`run-clean`/`run-blocked`/`run-messy` × light/dark — no console or page errors from the app
itself (one `ERR_CERT_AUTHORITY_INVALID` on the Google Fonts `<link>` traced to this sandbox's
own egress policy, unrelated to this round's changes). Keyboard pass confirmed: tab hover is
underline + pointer cursor, tab switching works via arrow key + Enter, the timeline dropdown
opens via Enter and "Deselect all" is reachable and functional once enabled.

**Open questions / next**
None outstanding from this round.

---

### 2026-09-22 · Correction pass on the Ledger redesign, plus a favicon

**Goal**
After the previous session's PR merged, the user compared the live result against the
original mockups directly and found real drift — alignment, spacing, and one region (Policy
gates' tabs) that didn't match the mockup's visual language at all. Fix every one of them
against the actual mockup images, not from memory. Also asked for a favicon from a supplied
image.

**What changed**
- `src/components/Disclosure.tsx` — new optional `summaryClassName`/`contentClassName` props,
  so a caller whose own container already supplies padding isn't stuck with a doubled inset.
- `src/features/run/RunHeader.tsx` — "Requested by [pill]" and "Show details" now live inside
  one `Disclosure` summary (not two independent flex siblings), so the opened detail panel
  spans the full card width instead of being squeezed under the trigger alone; this also
  fixed the pill's vertical alignment as a side effect (a flex row's `items-center` instead of
  `<p>`-inline baseline alignment).
- `src/features/run/DecisionStatusBanner.tsx` — "Approved by [pill]" and the timestamp are now
  a `justify-between` flex row (timestamp pushed to the far right), not one flowing sentence.
- `src/features/run/RunSummary.tsx`, `AttentionDigest.tsx`, `PolicyGateList.tsx`,
  `ConfidencePanel.tsx`, `Timeline.tsx` — inter-item gaps bumped from `--space-3` (12px) to
  `--space-5` (24px) where they were a plain flex `gap` (not already compounding via
  `divide-y` padding, which already totalled 24px).
- `src/components/Tabs.tsx`, `src/features/run/PolicyGateList.tsx` — tabs rebuilt as a
  full-width segmented control with per-tab icons, a visible hover fill, and `cursor-pointer`
  — the mockup's actual visual language, not the small underlined text-link tabs shipped
  before. See docs/DECISIONS.md 0036.
- `src/features/run/ConfidencePanel.tsx` — reported-area rows restructured into three columns
  (band / content / "Show details", the last vertically centered against the whole row), each
  wrapped in `<li>` (fixing an invalid-HTML `<details>`-direct-child-of-`<ul>` issue from the
  previous session).
- `src/features/run/DecisionBar.tsx` — grid labels ("Approved by"/"Time"/"Revision") changed
  from small-caps tracked uppercase to plain bold text, matching the mockup.
- `src/features/run/TimelineFilters.tsx`, `Timeline.tsx` — "Hide events" is now a plain label
  outside the dropdown trigger (the trigger itself just reads "N selected"), and the "N events
  hidden by the filters" text sits inline on the same row instead of a line below.
- `public/favicon.svg` (new), `index.html` — a favicon built from the user's supplied image
  (dark square, white "L", mint accent square), since no source SVG was given this time (see
  docs/DECISIONS.md 0035 for the precedent where one was).

**Why it was done this way**
See docs/DECISIONS.md 0036 for the two real trade-offs (Disclosure's new override props, and
Tabs' full-bleed-friendly restructure) and the two mockup details deliberately not matched
exactly (tab width ratio, Confidence's "Not checked" icon).

**Verification**
`npm run check` green (typecheck, lint — one pre-existing unrelated warning, `check:theme-bridge`
38 colours across 3 themes, `check:format-locale`, 222 tests / 40 files). Every fixed region
re-screenshotted and compared side-by-side against its actual mockup image (not memory) before
moving to the next. Real-browser pass across all three fixtures, both themes, full page,
zero console/page errors. Keyboard pass on every touched interactive element: Tabs (arrow-key
switches panel), RunHeader's and ConfidencePanel's Disclosures (Enter opens), the audit-log
dropdown (Enter opens, Escape closes with focus returned to the trigger).

**Open questions / next**
None outstanding. Pushed to the branch; a PR was opened but not auto-merged this time, since
the point of this session was closer review before shipping again.

---

### 2026-09-22 · Ledger redesign: 9 Figma mockups across every region

**Goal**
The user supplied 9 Figma mockup images (wordmark, RunHeader, DecisionStatusBanner,
AttentionDigest, RunSummary, PolicyGateList, Timeline, ConfidencePanel, DecisionBar) asking
for a visual restyle to match, then a follow-up image plus the wordmark's real SVG source
asking for the logo specifically.

**What changed**
- `src/styles/tokens.css` — new tint tokens for a filled `StatusBadge` exception (see
  docs/DECISIONS.md 0027); `check:theme-bridge` verifies 38 colours across 3 themes.
- `src/components/StatusBadge.tsx` — `success`/`warning` tones filled; `info` tone recoloured
  blue → neutral (0028).
- `src/app/App.tsx` — wordmark is now the literal Figma SVG (inlined, `currentColor`), not a
  re-typeset text lockup (0035); `index.html`'s `<title>` is "Ledger — demo".
- `src/features/run/RunHeader.tsx` — initiative name promoted to the headline; environment/
  status row unchanged; `RunStatus` colour scoped to `approved`/`changes_requested` only
  (0029); Started/Finished split onto labelled lines; "Show details" replaces "Run details".
- `src/features/run/DecisionStatusBanner.tsx`, `AttentionDigest.tsx`, `RunSummary.tsx` — each
  restyled with a right-aligned `ActionLink` (new, `src/components/ActionLink.tsx`, replacing
  the retired `EvidenceLink`) instead of an inline underlined link; `RunSummary` keeps its
  `FileText` heading icon and `AttentionDigest`'s heading becomes "Before you approve".
- `src/features/run/PolicyGateList.tsx` — the "Needs attention" list + "Show N passed"
  disclosure became two real tabs (new `src/components/Tabs.tsx`, wrapping `radix-ui`'s
  `Tabs`), still falling back to one flat list when nothing needs attention (S2).
- `src/lib/timeline.ts`, `TimelineFilters.tsx`, `Timeline.tsx`, `TimelineEventRow.tsx` — the
  `ToggleChip` row became a `radix-ui` `DropdownMenu` ("Hide events · N selected"), and the
  underlying semantics inverted from `activeTypes` (show) to `hiddenTypes` (hide), empty by
  default (0031); every event row now shows title-then-timestamp on its own line, always
  (0030).
- `src/features/run/ConfidencePanel.tsx` — restructured into a banded row (big percentage,
  neutral tone for every reported area regardless of value — 0032); the hidden/shown split
  (rationale only) is unchanged, now behind an explicit "Show details" `Disclosure`.
- `src/features/run/DecisionBar.tsx` — `DecidedView` restructured into a three-column
  labelled grid (Approved by / Time / Revision) plus a divider and an Undo row; Undo is now
  the one filled, non-brand-colour button in the app (0033).
- `vitest.setup.ts` — jsdom polyfills for `hasPointerCapture`/`scrollIntoView` (missing
  entirely in jsdom, needed by `radix-ui`'s popper-based components).
- `docs/DECISIONS.md` — nine new entries (0027–0035); `src/styles/README.md` — Usage rules
  note the filled-`StatusBadge` exception.

**Steps, in order**
1. Read all 9 images at full resolution; cross-referenced them against
   `src/styles/README.md`'s Usage/Contrast rules and found four places the mockup
   contradicted an existing, deliberate rule — asked the user directly (via clarifying
   questions) before planning, rather than guessing or silently overriding either the mockup
   or the existing rule.
2. `EnterPlanMode`, wrote a full per-region plan, got it approved.
3. Implemented region by region; after each region: `npx vitest run <file>`,
   `npx eslint <files>`, `npx tsc -b`, then a real-browser Playwright screenshot pass (light +
   dark) before moving to the next region.
4. Mid-session, the user asked for the wordmark to use the actual logo image, then supplied
   its SVG source directly — replaced the text lockup with the inlined SVG (0035).
5. Hit a jsdom-only testing issue building `TimelineFilters`' new `DropdownMenu` (couldn't be
   opened a second time by any method after a prior test's open/close, verified as jsdom-only
   against a real browser) — root-caused it and restructured the affected test files
   accordingly (0034).
6. Final pass: `npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`,
   full test suite), a real-browser pass across all three fixtures in both themes, and a
   keyboard-only pass over every new interactive element (`Tabs`, the filter `DropdownMenu`,
   `Disclosure`).

**Why it was done this way**
Every mockup choice that contradicted an existing rule got a direct question to the user
before implementation, not a silent guess either way — see docs/DECISIONS.md 0027–0032 for
the reasoning behind each answer. Three renderings that looked like unreviewed Figma leftovers
(a duplicated warning-triangle icon, a plural typo, an inconsistent timestamp layout) were
identified by cross-referencing multiple mockup instances against each other, and kept
un-replicated with the reasoning recorded (0030) rather than either blindly copying them or
silently "fixing" them with no note.

**How to do this by hand**
For a new `radix-ui`-based component (`Tabs`, `DropdownMenu`): style it with this repo's own
tokens (`--space-*`, `--color-*`), not the `shadcn`-default classes already present in
`src/components/ui/` (those are unused scaffolding from an earlier `shadcn` init, not wired
into the real app — don't copy their token usage). For a filled/coloured treatment that
reverses an existing "never a fill" rule: verify contrast with the WCAG relative-luminance
formula (docs/DECISIONS.md 0005's method) before picking a hex value, never by eye.

**Verification**
`npm run check` green: typecheck clean, lint clean (one pre-existing, unrelated warning in
`src/components/ui/button.tsx`), `check:theme-bridge` (38 colours verified across 3 themes),
`check:format-locale` clean, `vitest run` (222 tests, 40 files, all passing). Real-browser
Playwright pass across `run-clean`/`run-blocked`/`run-messy`, both themes: S2's flat-list
fallback confirmed on `run-clean` (0 gates need attention → no tabs); filled green/amber
badges, the neutral "Not run"/"Not checked" grey, and the neutral confidence bands all
confirmed regardless of value. Keyboard pass: `Tabs` (arrow-key switches panel), the audit-log
`DropdownMenu` (Enter opens, arrow+Space toggles a type, Escape closes and returns focus to
the trigger), and `ConfidencePanel`'s `Disclosure` (Enter on the `<summary>` opens it) all
confirmed working without a mouse.

**Open questions / next**
None outstanding — every task in this batch (`AskUserQuestion`-confirmed scope, all nine
regions, verification) is complete. `--color-status-unknown` (the blue token `StatusBadge`'s
`info` tone no longer uses) is still used by `RunSummary.tsx`'s own `unknown`-kind sentence
styling — left unchanged since no mockup showed that specific case, so the two are now
deliberately inconsistent (badge: neutral, inline sentence: blue) until there's real evidence
either way.

---

### 2026-09-22 · RunHeader's requester gets the actor pill too

**Goal**
The user pointed out `RunHeader`'s "requested by X" was still plain text — the human-actor
pill from an earlier session (docs/DECISIONS.md 0023) never made it to this one place.

**What changed**
`src/features/run/RunHeader.tsx` — `run.requestedBy` now renders via `ActorName`, on its own
line ("Requested by [pill]") rather than folded into the initiative name's sentence. The
initiative name's own line no longer carries the em dash + requester text, so its `md:truncate`
(docs/DECISIONS.md 0025) now only ever clips the initiative name itself.

**Why it was done this way**
A pill has real shape (border, padding, icon) — truncating it mid-shape with the initiative
name's ellipsis would look broken. See docs/DECISIONS.md 0026.

**Verification**
`npm run check` (220 tests) green. Manual check, desktop + mobile, both themes: pill renders
correctly, matches the existing `ActorName` treatment used everywhere else.

**Open questions / next**
None.

---

### 2026-09-22 · Mobile region pass: icon alignment on wrap, initiative name truncation

**Goal**
Follow up on the previous session's page-shell mobile fix with the "full per-region mobile
pass" it left as an open gap — audit every region at 375px in a real browser, then fix
whatever's actually broken, rather than guess at generic "mobile polish."

**What changed**
- `src/features/run/TimelineEventRow.tsx`, `src/features/run/RunSummary.tsx` — the `IconText`
  usage for an event title / summary sentence gets `className="items-start"`, overriding
  `IconText`'s own default `items-center` (via `cn()`'s `tailwind-merge`, no change to the
  shared component). Fixes the icon floating down to a middle line when the text wraps to
  several lines at narrow widths.
- `src/features/run/RunHeader.tsx` — the initiative name's `truncate` class becomes
  `md:truncate`: wraps freely below `md`, truncates to one line (as before) at `md` and up.
- `src/features/run/RunHeader.test.tsx` — the existing "never hides the environment or status
  behind a long initiative name" test now asserts `md:truncate`, not a bare `truncate`.

**Steps, in order**
1. Audited every region in a real browser at 375px (Playwright, this sandbox's Chromium)
   before proposing anything — screenshotted each region, measured a few tap-target heights
   programmatically, and opened the confirm dialog and a policy-gate disclosure on a phone
   viewport to check they actually work, not just look plausible in a static screenshot.
2. Found two concrete bugs (icon alignment on wrap; the initiative name's `title`-tooltip
   fallback being unreachable on a touchscreen) and one thing that looked like a problem but
   wasn't: nav links/filter chips read small against the common "44px" mobile guideline, but
   checked against WCAG 2.5.8 (AA)'s actual 24×24px minimum, both already clear it — 44px is a
   *comfortable* recommendation, not a compliance gap, so left alone and named rather than
   silently skipped or silently "fixed" with no real problem behind it.
3. Scoped both real fixes to exactly where the problem is rather than the shared component or
   removing the desktop behaviour entirely — see docs/DECISIONS.md 0025 for the specific
   reasoning each time.
4. `npm run check` green; updated the one test whose assertion named the now-conditional class.
5. Re-verified in a real browser at 375px (both fixes visibly correct, in both themes) and at
   1280px (confirmed unchanged from before this session).

**Why it was done this way**
See docs/DECISIONS.md 0025 — in particular, why the icon-alignment fix touches two call sites
instead of `IconText` itself (avoiding an app-wide pixel shift on every heading icon for a
problem that only exists where text can wrap), and why touch-target sizing was checked against
the real WCAG minimum rather than the more popular 44px guideline before deciding not to
touch it.

**How to do this by hand**
Same as the steps above — no separate manual procedure beyond the file list under "What
changed."

**Verification**
`npm run check` (40 test files, 220 tests, typecheck, lint, both custom browser-based checks)
green. Manual Playwright pass at 375px and 1280px, both themes: icon alignment and initiative
name both confirmed fixed on mobile, both confirmed unchanged on desktop.

**Open questions / next**
None outstanding — the "full per-region mobile pass" asked for is complete for what an audit
actually turned up; nothing further was found broken.

---

### 2026-09-22 · Mobile: nav to the top, and bringing mobile into scope

**Goal**
Fix a real bug on phone-width screens (the review page overflowed horizontally, clipping
text) by moving `AnchorNav` above the content instead of squeezing it into a fixed side
column — the user's specific ask — and, since that reverses a standing "mobile layouts are
out of scope" line, confirm with the user first whether to bring mobile into scope generally.

**What changed**
- `docs/spec-review-screen.md` — "mobile layouts" dropped from "Out of scope"; one line added
  naming what's actually responsive now (the page shell and nav) versus what still isn't (a
  full per-region mobile pass — density, touch targets).
- `src/components/AnchorNav.tsx` — below Tailwind's `md` breakpoint (768px): a horizontal,
  scrollable, non-sticky strip instead of the sticky vertical column. `md` and up: unchanged.
  Doc comment corrected (the old one mis-cited `AGENTS.md`; the real "out of scope" line was
  only ever in `spec-review-screen.md`).
- `src/features/run/RunReviewPage.tsx` — outer container is `flex-col` below `md`, `md:flex-row
  md:items-start` at and above it. Nav was already first in DOM order, so stacking it above
  the content is the entire "put navigation to the top" fix.
- `src/app/App.tsx` — page padding scales down below `md` (`px-4 py-8` vs `md:px-6 md:py-12`).

**Steps, in order**
1. Audited the actual breakage in a real browser at 375px before proposing anything: measured
   the page forced to 459px inside a 375px viewport, traced it to `RunReviewPage.tsx`'s
   `flex items-start` never stacking `AnchorNav`'s fixed-width column.
2. Asked the user directly whether to formally bring mobile into scope (updating the docs) or
   treat this as a narrow one-off nav fix, since the request reversed a standing scope line
   rather than being a pure style tweak. User chose to bring mobile into scope.
3. Used `EnterPlanMode`: named the scope boundary explicitly — page shell and nav fixed now
   (what was asked for and measurably broken); a full per-region mobile design pass named as
   a real, separate, still-open gap, not silently claimed as done.
4. Implemented the three files, using Tailwind's existing default `md` breakpoint rather than
   inventing a custom one.
5. `npm run check` green; verified in a real browser at 375px, at the `md` boundary, and at
   1280px (desktop, confirming pixel-identical to before), across all three fixtures, both
   themes: zero horizontal scroll, all seven nav links keyboard-reachable (focus auto-scrolls
   the strip) and keyboard-activatable, every existing `flex-wrap` group elsewhere on the page
   reflowed cleanly once given real width back.

**Why it was done this way**
Scoped to the page shell and nav, not a full mobile redesign, because that's what was both
asked for and actually broken — see docs/DECISIONS.md 0024 for the full reasoning, including
why the "Out of scope" line now says exactly what is and isn't responsive rather than a bare
"mobile is in scope" that would overstate what this session built.

**How to do this by hand**
Same as the steps above — no separate manual procedure beyond the file list under "What
changed."

**Verification**
`npm run check` (40 test files, 220 tests, typecheck, lint, both custom browser-based checks)
green throughout — no test needed updating, since the change is layout-only, not behavior.
Manual Playwright pass at 375px/768px/1280px across all three fixtures, both themes: no
horizontal scroll, keyboard operability of the nav strip confirmed, desktop confirmed
unchanged by screenshot comparison.

**Open questions / next**
A full per-region mobile pass (Timeline's dense rows, touch-target sizing) is still open —
named in docs/spec-review-screen.md and docs/DECISIONS.md 0024 as a real gap, not implied
done by "mobile is in scope."

---

### 2026-09-22 · Friendlier UI, inspired by a reference mockup

**Goal**
The user shared a dark-theme mockup of this same screen and asked to take styling
inspiration from it to make the UI more user-friendly, keeping `tokens.css`'s values
unchanged. Adopt its real information-architecture ideas — a synthesized pre-flight digest,
an already-decided banner, decluttering settled policy gates, a plainer sidebar — without
copying colours or colour *usage* the app's own token rules don't allow.

**What changed**
- `src/lib/attention.ts` (new) — `buildAttentionItems`, synthesizing the "Before you rely on
  this" digest from real `gates`/`confidence`/`timeline` data only (no invented thresholds).
- `src/lib/gates.ts` — `gateAttentionGroups` (fail/unknown/waived, non-empty groups only),
  shared by the digest and by `PolicyGateList`'s own collapse logic.
- `src/lib/format.ts` — `formatConfidenceAreaLabel`/`formatDecisionOutcomeLabel`, lifted out
  of `ConfidencePanel.tsx`/`DecisionBar.tsx` (both now import them) since `lib/attention.ts`
  needed the same labels and `lib/` can't import from `features/`.
- `src/features/run/AttentionDigest.tsx` (new) — the digest card itself. Colour-neutral
  chrome, not a status colour (docs/DECISIONS.md 0020); renders nothing when there's nothing
  to flag.
- `src/features/run/DecisionStatusBanner.tsx` (new) — "Approved by X · 4 minutes ago" right
  under the run header on an already-decided run, linking to the Decision region.
- `src/features/run/PolicyGateList.tsx` — gates needing attention (fail/waived/unknown) stay
  always visible with a "Needs attention · N" eyebrow; settled gates (pass/not_applicable)
  collapse behind "Show N passed checks" — but only when something actually needs attention,
  never on an all-pass run (docs/DECISIONS.md 0021 — Scenario S2 compliance).
- `src/components/AnchorNav.tsx` — dropped the card border/background for a plain sticky
  list.
- `src/features/run/RunReviewPage.tsx` — wires all of the above in; nav gains a conditional
  "Needs attention" entry that only appears when the digest renders.
- `src/features/run/ActorName.tsx` (new) — pulled out of a duplicated local function
  (`PolicyGateRow.tsx`) and inlined JSX (`DecisionBar.tsx`); a person's name now renders in a
  pill (border, filled background, `ActorIcon`), a system's name-and-version stays plain icon
  + text — a follow-up request, mid-session, to visually set a human decision/evaluation apart
  from an automated one, not only via the small icon next to it (docs/DECISIONS.md 0023). Now
  also used by `DecisionStatusBanner.tsx`.

**Steps, in order**
1. Read the shared PDF mockup (rendered to PNG via `pymupdf`, since this sandbox had no
   `pdftoppm`/poppler-utils and no network access to install it — `pip install pymupdf`
   worked instead). Read `AGENTS.md` and `docs/spec-review-screen.md` fresh before planning.
2. Used `EnterPlanMode`. Asked the user one clarifying question first: the mockup's
   "Before you rely on this" digest is real new content architecture, not a style change —
   include it this round, or stay to visual refinements of the existing six regions? User
   chose to include it.
3. Verified the plan's data rules against all three real fixtures by hand before writing any
   code (not just after): confirmed `run-clean` → 1 digest item, `run-blocked` → 3,
   `run-messy` → 3 (matching the reference mockup's own three bullets), and confirmed the
   token-usage question (status colour reserved for one `GateResult`, never a multi-kind
   summary card) against `src/styles/README.md`'s actual usage rules before deciding the
   digest's chrome stays neutral.
4. Built bottom-up: `lib/format.ts` extractions → `lib/gates.ts` → `lib/attention.ts` (+
   tests, verified against real fixtures) → `AttentionDigest`/`DecisionStatusBanner` (new-
   component workflow: states, tokens, a11y, Storybook stories, both themes) →
   `PolicyGateList`'s collapse logic → `AnchorNav` → `RunReviewPage` wiring.
5. `npm run check` (typecheck, lint, theme-bridge, locale, full suite) green throughout —
   ran after each file, not only at the end.
6. Verified in a real running browser across all three fixtures, both themes: digest content
   matches the hand-verification from step 3; policy gates collapse only when something
   needs attention, never on `run-clean`'s all-pass case; "Show N passed checks" opens by
   keyboard (native `<summary>` focus + Enter, `Disclosure`'s existing behaviour, unchanged);
   the digest's own links scroll (and, per the earlier smooth-scroll work, animate) to their
   region; "Needs attention" appears in the nav only when the digest renders.

**Why it was done this way**
- The mockup's dark gradient header band and solid amber "needs attention" card fills were
  deliberately not copied: both need either new colour values or a colour *usage*
  (`--color-status-*` as a background fill, or on a card that isn't reporting one specific
  `GateResult`) that `src/styles/README.md`'s existing rules already rule out — see
  docs/DECISIONS.md 0020.
- Policy gates only collapse once something needs attention, never on an all-pass run,
  because Scenario S2 in docs/spec-review-screen.md explicitly fails a design that "hides
  what was checked behind a single green summary" for that case — see docs/DECISIONS.md 0021.
- The digest's confidence bullet triggers on "there is something concrete this area could not
  verify," never on a "confidence below X%" threshold — docs/spec-review-screen.md: "low
  confidence is normal and should look normal, not alarming." See docs/DECISIONS.md 0022.

**How to do this by hand**
Same as the steps above — no separate manual procedure beyond the file list under "What
changed."

**Verification**
`npm run check` — 40 test files, 220 tests, typecheck, lint, both custom browser-based
checks, all green. Manual Playwright pass across `run-clean`/`run-blocked`/`run-messy`, light
and dark: digest content, gate collapsing, keyboard operability of the new disclosure, the
conditional nav entry, and the human/system pill contrast all confirmed in a real browser,
not just from source.

**Open questions / next**
None outstanding.

---

### 2026-09-21 · Undo button layout, smooth section-nav scroll, Confidence heading badge

**Goal**
Three small, independently-specified UI fixes: separate the Undo button from the countdown
sentence in `DecisionBar`; smooth-scroll `AnchorNav`'s section-jump links; move each
`ConfidencePanel` area's percentage onto its heading row as a neutral pill.

**What changed**
- `src/features/run/DecisionBar.tsx` — `DecidedView`'s undo row changed from a single
  `flex-wrap` row (text and button as adjacent inline siblings) to a `flex-col` stack:
  countdown text on its own line, `Undo` below it, left-aligned (`items-start`). No change to
  `BUTTON_CLASSNAME` — same neutral border/background as `DecisionBar`'s other buttons.
- `src/styles/index.css` — added `scroll-behavior: smooth` on `html`, scoped inside
  `@media (prefers-reduced-motion: no-preference)`. No JS: AnchorNav's links are plain
  `<a href="#id">`, and native anchor navigation already honours this property. No
  `scroll-margin-top` added — see `docs/DECISIONS.md` 0019 for why the conditional in the
  request ("if any nav/header element is sticky/fixed...") doesn't apply to this layout.
- `src/features/run/ConfidencePanel.tsx` — each non-missing area's `Disclosure` summary now
  opens with a `flex justify-between` row: the area name left, a `rounded-full
  border-border-subtle bg-surface-raised` pill with the percentage right. The full "Confidence
  X% — basis" sentence still renders below, unchanged — the pill is an at-a-glance addition,
  not a replacement. "Not checked" (missing) areas render no badge, unchanged.

**Steps, in order**
1. Read the three requests against the current source (`DecisionBar.tsx`, `AnchorNav.tsx`,
   `RunReviewPage.tsx`, `ConfidencePanel.tsx`, `index.css`) before changing anything, to check
   which parts of each request already held true. Found the smooth-scroll request's own
   sticky-header conditional didn't apply: `AnchorNav` is a side rail (`flex items-start`),
   never stacked above the content column, so no heading ever ends up underneath it.
2. Made the three edits directly — each was a small, precisely-specified change to a single
   component, not new component surface, so this skipped formal Plan Mode.
3. `npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, tests) — all
   green; `DecisionBar.test.tsx`/`ConfidencePanel.test.tsx` query by role/text, not DOM
   structure, so neither needed updating.
4. Verified in a real, running browser (Playwright, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pointed
   at this sandbox's installed Chromium): `getComputedStyle(html).scrollBehavior` reads
   `smooth` under default emulation and `auto` under `reducedMotion: 'reduce'`; a
   keyboard-activated (Enter) nav link scrolls the page under both; screenshots of the
   Confidence and Decision regions in light and dark confirm the badge and the stacked undo
   layout render as intended.

**Why it was done this way**
- Undo layout: stacked (button below text, left-aligned) rather than right-aligned on the
  same row, to stay consistent with the rest of the decided-panel's block layout (outcome,
  revision are all left-aligned, block-stacked) rather than introducing the only
  right-edge-aligned element in that panel. This was the one real judgment call across the
  three fixes — the request explicitly offered either layout.
- Smooth scroll: CSS `scroll-behavior`, not a `scrollIntoView` click handler — see
  `docs/DECISIONS.md` 0019 for the full reasoning (no other programmatic scroll in the app for
  a site-wide property to affect unintentionally, and reduced-motion falls out of the media
  query for free).
- Confidence badge: reused `Tag`'s exact token combination
  (`border-border-subtle`/`bg-surface-raised`/`rounded-full`) for the pill rather than
  inventing a new visual treatment, but didn't reuse the `Tag` component itself — `Tag`
  requires an icon, and a bare percentage pill doesn't want one.

**How to do this by hand**
Same as the steps above — no separate manual procedure; these are direct Tailwind class and
JSX structure edits.

**Verification**
`npm run check` (36 test files / 198 tests, typecheck, lint, both custom browser-based
checks) — all green. Manual Playwright pass: computed `scroll-behavior` under both motion
preferences, keyboard-triggered nav scroll, and before/after screenshots of the Confidence
and Decision regions in light and dark (not committed — screenshots aren't checked in, per
AGENTS.md).

**Open questions / next**
None outstanding.

---

### 2026-09-21 · Disclosure open/close animation

**Goal**
Add a real open/close animation to `Disclosure` (policy gate rows, "Run details", timeline
event rows): a springy overshoot on open, a quick plain close, reduced-motion respected,
scoped to disclosure/accordion interactions only.

**What changed**
- `src/styles/tokens.css` — four new Motion tokens: `--motion-duration-open` (220ms),
  `--motion-duration-close` (160ms), `--motion-ease-spring`
  (`cubic-bezier(0.34, 1.56, 0.64, 1)`), `--motion-ease-in` (`cubic-bezier(0.4, 0, 1, 1)`,
  same value as the already-declared, still-unused `--motion-ease-exit` — added under its own
  name rather than repurposing that one). Both new durations collapse to `1ms` under
  `prefers-reduced-motion: reduce`, same pattern as the existing three.
- `src/components/Disclosure.tsx` — the body wrapper is now a single-track CSS Grid
  (`grid-template-rows: 0fr` ↔ `1fr`, keyed off the existing `details[open] &` selector — the
  same selector the chevron rotation already used), with an `overflow-hidden` inner div doing
  the actual clipping. No React state added.

**Steps, in order**
1. Read the request fresh — precise values already given (durations, exact
   `cubic-bezier(...)` curves, which property combination, the reduced-motion requirement,
   and an explicit scope exclusion: not `DecisionBar` or anything status/decision-related).
   Read `Disclosure.tsx` and the existing Motion block in `tokens.css` before planning:
   confirmed `Disclosure` is currently fully uncontrolled (native `<details>`, zero JS state,
   even the chevron rotation is pure CSS via a `details[open] &` selector) and that
   `--motion-ease-exit`/`--motion-ease-standard`/`--motion-duration-base` are all declared but
   currently unused anywhere in the app.
2. Used `EnterPlanMode`: native `<details>` can't be animated by adding `transition` alone —
   the browser hides its children instantly on close, before any transition runs. Weighed two
   real techniques (a CSS-only `grid-template-rows` trick that keeps `Disclosure` free of JS
   state vs. a JS-measured explicit-height animation) and chose the CSS-only one, named as the
   plan's one real judgment call, since it keeps the component's own "no custom JS"
   design intact and doesn't add a browser-support gamble. Got the plan approved via
   `ExitPlanMode`.
3. Added the four tokens (+ reduced-motion overrides), then the grid wrapper in
   `Disclosure.tsx`.
4. `npm run check` green, including `Disclosure`'s own existing tests, unchanged — nothing
   about open/close semantics or focus changed, only how the height gets there.
5. Verified against the real running app, not just the CSS source: read
   `getComputedStyle` mid-transition in a real browser and confirmed the open state's
   `transition-duration`/`transition-timing-function` matched the spring token exactly, the
   close state matched the ease-in token, and a real intermediate `grid-template-rows` pixel
   value was captured (not stuck at the start or end value) — then repeated with Playwright's
   `reducedMotion: 'reduce'` emulation and confirmed both durations collapsed to `1ms`.
6. While verifying visually, worked through whether the overshoot would actually be
   *perceptible*: a single `fr`-unit grid track can't be pushed past the space its content
   needs, so there's no pixel value for the row to overshoot into and settle back from, the
   way `scale` could — and `scale`/`transform` were explicitly ruled out by the request. The
   easing curve and timing are genuinely correct and verified; a literally visible bounce in
   height is not achievable within the "no scale" constraint using this technique. Wrote this
   up as `docs/DECISIONS.md` 0018 rather than silently shipping something that might not match
   what "settles with a small overshoot" was picturing, with the concrete alternative (a
   measured-height, small-JS-state version) named if that turns out to matter more than
   keeping `Disclosure` free of JS/transform.

**Why it was done this way**
The CSS grid-rows technique was chosen specifically to avoid adding React state and a
browser-support gamble (the newer `@starting-style`/`allow-discrete` CSS, purpose-built for
animating `<details>` directly, is too recent to trust for a check this app already treats as
load-bearing — `scripts/check-theme-bridge.mjs` renders real CSS in a real browser and
asserts on computed values). The trade-off that technique carries (no literal overshoot
possible without `scale`) was worth surfacing rather than guessing whether it matters more
than the constraints that ruled out the alternative — see docs/DECISIONS.md 0018.

**How to do this by hand**
For any future `<details>`-based reveal, don't reach for `transition: height` directly — it
won't run, because the browser un-renders the content before a transition on a `display:
none` change ever fires. Use the `grid-template-rows: 0fr` ↔ `1fr` pattern with an
`overflow-hidden` inner wrapper instead, keyed off `details[open] &` the same way this
component's chevron rotation already was. If a literally visible overshoot bounce is wanted
on the way open, that specifically requires measuring a real pixel height (or using
`transform: scale`) — a single flexible grid track cannot produce one on its own.

**Verification**
`npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, 36 files / 198
tests) green. Computed-style verification in a real browser (open state's timing-function and
duration, close state's, a genuine mid-transition height sample, and reduced-motion collapsing
both durations to `1ms`) as described above. Screenshots of a gate row closed and settled-open,
light and dark.

**Open questions / next**
- docs/DECISIONS.md 0018: if the springy *feel* (not just the correct easing curve) turns out
  to matter, the concrete next step is a measured-height version of `Disclosure`, not a
  redesign — everything else about the component stays the same.

---

### 2026-09-21 · Confidence region (all six built), real local undo, summary hierarchy, and five design fixes

**Goal**
Build Confidence (Region 5) — the last unbuilt region — and add real local-only undo, a
visual headline for the first summary sentence with per-sentence icons, and five smaller
design fixes: a circular person/system icon, an icon/text alignment audit, region
descriptions, an in-page anchor nav, and a restyled filter-chips label.

**What changed**
- `src/lib/confidence.ts` (+ test) — `resolveConfidenceAreas`: `Run.confidence`'s four fixed
  areas, always all four, "missing" (no invented reason) for one the model didn't report.
- `src/lib/format.ts` — `formatConfidencePercent` (whole percentage, no decimals).
- `src/features/run/ConfidencePanel.tsx` (+ stories, + test) — one `Disclosure` row per area:
  what couldn't be verified and the value+basis always visible, the longer rationale behind
  the disclosure, "Not checked" (status-unknown tone) for a missing area. Composed into
  `RunReviewPage.tsx` between Audit log and Decision.
- `DecisionBar.tsx`'s `DecidedView` — a real "Undo" button while the window is active
  (`onRunUpdated({ ...run, decision: undefined, status: 'awaiting_review' })`, the same
  mechanism the page already uses for a live decision or an S5 conflict); a
  previously-nonexistent "The undo window for this decision has closed." message once it
  expires. `docs/DECISIONS.md` 0017.
- `src/lib/summary.ts` (+ test) — `classifySummarySentence`: a sentence naming a specific
  gate outcome (failed/exception/not run/does not apply) is classified as that exact
  `GateResult`; a count/all-clear sentence as `'outcome'`; anything else as `'change'`.
  `RunSummary.tsx` — the first rendered sentence gets `text-item-title font-semibold` as the
  card's headline; every sentence gets an icon, reusing `PolicyGateRow.tsx`'s own
  icon/colour per `GateResult` for the four gate-outcome kinds, a neutral icon otherwise.
- `src/components/ActorIcon.tsx` (+ story, + test) — a small circular badge around the
  existing person/system icon; wired into `PolicyGateRow.tsx` and `DecisionBar.tsx` in place
  of the bare icon.
- `src/components/AnchorNav.tsx` (+ story, + test) — a sticky, generic list of in-page anchor
  links; `RunReviewPage.tsx` supplies the six region entries (`RunHeader.tsx` gained a fixed
  `id="run-header-heading"` to match every other region) and composes it alongside the region
  stack. `App.tsx`'s container widened `max-w-4xl` → `max-w-5xl` to fit it.
- `PolicyGateList.tsx`, `DecisionBar.tsx` — one description line each under the heading, same
  pattern `Timeline.tsx` already used.
- `TimelineFilters.tsx` — the "Filter logs" label restyled uppercase with a `Filter` icon,
  distinct from the paragraph text around it.
- `features/run/README.md`, `lib/README.md` — updated for every new file above.

**Steps, in order**
1. Read `AGENTS.md` and `docs/spec-review-screen.md` fresh. The request combined a
   spec-completeness item (Confidence, undo, summary hierarchy) with five follow-up design
   fixes from a screenshot review — used `EnterPlanMode`: read every file the plan would
   touch (all five existing regions, `lib/summary.ts`, `lib/types.ts`'s `ConfidenceArea`,
   both fixtures' real `confidence` arrays, `PolicyGateRow.tsx`'s `TONE_BY_RESULT`,
   `IconText`/`RegionCard`/`ToggleChip`), verified every candidate lucide icon name exists,
   and read every real summary sentence across all three fixtures before proposing the
   sentence classifier. Named ten judgment calls explicitly in the plan (confidence area
   order, undo's target status, the "window closed" message not actually existing yet, the
   summary classifier's exact keyword rules, the person icon's circular treatment, nav as a
   generic component, etc.) and flagged the nav panel up front as the one real structural
   change here, not just a polish pass. Got the plan approved via `ExitPlanMode` before
   writing code.
2. Built the Confidence region first, in isolation, verified with its own tests (including a
   keyboard-opened-disclosure test) before touching anything else.
3. Wired real undo through `DecisionBar`'s existing `onRunUpdated` callback — no new prop, no
   new state mechanism. Fixed the two existing undo tests to match the new DOM (a real
   button now present) rather than leaving them passing against stale behaviour.
4. Built `classifySummarySentence` and verified it against literally every summary sentence
   in `run-clean`, `run-blocked` and `run-messy` — not a representative sample — before
   wiring it into `RunSummary.tsx`.
5. Built `ActorIcon` and swapped it into both existing call sites, then ran the full test
   suite (not just the two touched files) — a DOM-structure change like this broke an
   existing assertion in a similar spot two sessions ago, so checked broadly rather than
   assuming only the obviously-related tests would notice.
6. Added the two region descriptions and the filter-label restyle — small, independent
   changes, each `npm run typecheck`ed immediately rather than batched.
7. Built `AnchorNav`, added the missing heading id to `RunHeader.tsx`, composed the nav into
   `RunReviewPage.tsx`, widened `App.tsx`. Deliberately left out a scroll-spy highlight and a
   responsive collapse — the plan named both as complexity beyond what was asked, and mobile
   layouts are already out of scope (AGENTS.md).
8. `npm run check` green, then a full visual pass on the real dev server at a wide viewport,
   specifically to alignment-audit the new icon-heavy layout rather than assume `IconText`'s
   existing `items-center` handled every new case: found one real bug this way —
   `ActorIcon`'s circle used `bg-surface-raised` as its fill, which is the exact background
   of two of its three actual usage sites (the waiver callout, the decided-decision panel),
   so the circle was nearly invisible, only a faint border showing. Fixed by dropping the
   fill entirely and using the stronger `border-border` for the ring, verified by
   re-screenshotting the same spot.
9. Full keyboard pass on the real running app: tab order starts with the six nav links (all
   six `href`s correct), flows continuous into the page content with nothing skipped; a nav
   link click changes the URL hash to the right section; the new Undo button is reachable
   and activatable by Enter, and correctly puts `DecisionBar` back into its undecided view.
10. Before/after screenshots of the full composed `RunReviewPage` (`run-messy` — exercises
    the missing-confidence-area case and an active undo window), light and dark, at the same
    viewport as the "before" shots for a direct comparison.

**Why it was done this way**
- **Confidence always shows all four areas, never just what's in the array.** Matches how
  Policy gates already shows its fixed result vocabulary, and is exactly what Acceptance
  criteria asks for ("An area with no value shows 'Not checked'") — the alternative (render
  only what's present) would silently drop `run-messy`'s missing `security` area instead of
  surfacing it, the opposite of "Never hidden: an area with no confidence value at all."
- **Undo reuses `onRunUpdated` rather than adding a new mechanism**, and stays explicitly
  local-only (docs/DECISIONS.md 0017) rather than inventing backend semantics (an audit
  trail entry for the undo itself, who's allowed to undo someone else's decision) this
  fixture-backed demo has no real answer for.
- **The summary-sentence classifier reuses `PolicyGateRow`'s own `GateResult` icons/colours**
  for a sentence naming a gate outcome, rather than inventing a second visual language for
  the same claim — a failed-check sentence and a failed-check gate row should look like the
  same kind of fact, because they are.
- **Alignment audit was a real screenshot check, not a documentation-only claim.** The plan
  named this as a judgment call precisely so it wouldn't be skipped, and it caught a real bug
  (`ActorIcon`'s invisible-on-its-own-background circle) that reading the source would not
  have shown — the same lesson this codebase's own probe-build discipline keeps re-teaching.

**How to do this by hand**
For a new component whose icon or badge sits on a variable background (a row, a callout, a
decided-state panel — anywhere the same piece renders in more than one place), don't assume a
background-based fill will read correctly everywhere it's used — check by screenshotting each
real usage site, or prefer a border-only treatment that doesn't depend on contrasting with
whatever's behind it. For any new sentence-classification or actor-classification heuristic
(this session added a second one, `classifySummarySentence`, alongside the existing
`isSystemActor`), verify it against every real value the fixtures actually contain, not a
plausible-looking sample — and say so in the code comment, so the next person knows exactly
what it's been checked against.

**Verification**
`npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, 36 files / 198
tests) green. Keyboard pass and before/after screenshots (light + dark) as described above.

**Open questions / next**
- All six spec regions are now built. `AnchorNav` has no scroll-spy and no responsive
  collapse, both deliberately out of scope this session (see judgment call 8 in the session's
  plan) — worth reconsidering if this app's audience ever includes a narrow viewport.
- The summary-sentence classifier (`classifySummarySentence`) and the actor heuristic
  (`isSystemActor`) are both string-pattern guesses, verified against everything the fixtures
  contain today but not proven correct for sentences or names this app has never generated —
  same open question as docs/DECISIONS.md 0016 already raises for the older heuristic.

---

### 2026-09-21 · Region boundaries, heading icons, content clarity, locale fix, filter clarity, demo label

**Goal**
Fix a real locale bug in `lib/format.ts` (relative-time strings rendering in Finnish) for the
second time, this time with a regression check. Give every region on `RunReviewPage` a
visible container and a heading icon (currently spacing-only). Add several small
content-clarity fixes surfaced by a plain-state report and a shared screenshot earlier this
session: a "Target:" clarification in the run header, an audit-log subtitle, person-vs-system
icons on actor names, a "Filter logs" label with stronger active/inactive filter contrast, and
a "Demo" label on the page identity. Confidence (Region 5) and a real undo action stayed
explicitly out of scope.

**What changed**
- `src/lib/format.ts` — pinned `LOCALE = 'en'`, used everywhere an `Intl`/`toLocale*` call
  previously passed `undefined`.
- `scripts/check-format-locale.mjs` (new) — fails `npm run check` if `format.ts` has a
  locale-sensitive call with no explicit locale again; wired in via `check:format-locale`.
- `src/components/RegionCard.tsx` (+ story + test) — the shared visible container
  (`border-border-subtle`/`bg-surface`/`rounded-md`/`p-[space-4]`) every region now sits in,
  applied to every return branch (loading/empty/happy-path) of `RunHeader`, `RunSummary`,
  `PolicyGateList`, `Timeline`, `DecisionBar`.
- Each region's `<h2>` wrapped in `IconText` with a matching lucide icon: `Target` (Run
  header), `FileText` (Summary), `ShieldCheck` (Policy gates), `History` (Audit log),
  `CheckSquare` (Decision).
- `RunHeader.tsx` — the system-name heading now reads "Target: `<system>`", the label
  de-emphasized ahead of the name.
- `Timeline.tsx` — "What the agent did during this run." under the heading.
- `src/lib/actors.ts` (new, + test) — `isSystemActor`, a string heuristic distinguishing a
  person's name from a system's name-and-version (docs/DECISIONS.md 0016). Wired into
  `PolicyGateRow.tsx` (`evaluatedBy`, the waiver callout) and `DecisionBar.tsx`'s
  `DecidedView` (`decision.by`) via `IconText` with `User`/`Bot`.
- `TimelineFilters.tsx` — a visible "Filter logs" label, wired to the chip group via
  `aria-labelledby` (replacing the invisible `aria-label` it had instead). `ToggleChip.tsx` —
  `font-semibold` added to the pressed state, so active/inactive isn't colour-only.
- `index.html`'s `<title>` and `App.tsx`'s `<h1>` both get a de-emphasized "— Demo" suffix.
- `docs/DECISIONS.md` — 0015 (the locale-check pattern) and 0016 (the actor-icon heuristic).

**Steps, in order**
1. Read `AGENTS.md` and `docs/spec-review-screen.md` fresh, per the task. Since the request
   named six distinct areas of change across five region components plus shared components,
   used `EnterPlanMode`: explored every file that would be touched (all five region
   components, `format.ts` + its existing tests, `IconText`/`ToggleChip`/`TimelineFilters`,
   `tokens.css`), enumerated every real `evaluatedBy`/`waiver.by`/`decision.by` value across
   all three fixtures to validate the person/system heuristic before proposing it, and
   verified every candidate lucide icon name actually exists in the installed version.
   Wrote the plan to name every judgment call explicitly (heading icon choices, where
   "Target:" goes, actor-icon scope, `RegionCard` as a new shared component vs. a repeated
   class string) and got it approved via `ExitPlanMode` before writing any code.
2. Fixed the locale bug first, in isolation: pinned `LOCALE = 'en'` in `format.ts`, wrote
   `scripts/check-format-locale.mjs` (a narrow regex check, the same shape as
   `scripts/check-theme-bridge.mjs`), and proved it against failure before moving on —
   temporarily reverted one call back to `undefined`, confirmed the check failed and named
   the exact call, restored, confirmed a clean pass.
3. Built `RegionCard` (component + story + test, per the `new-component` skill) before
   touching any region, then applied it to all five region components' root elements, in
   every return branch each one has — not just the populated state.
4. Added each region's heading icon and the content-clarity changes together, file by file
   (same lines were already being touched for the region-card wrap), then `npm run
   typecheck` after every file to catch JSX/import mistakes immediately rather than at the
   end.
5. Built `lib/actors.ts`'s `isSystemActor` and its test against the real fixture values
   already enumerated in step 1, then wired the icon into the three named call sites.
6. Filter clarity: swapped the filter group's `aria-label` for a visible label + `aria-
   labelledby` (matching the `<h2>`/`aria-labelledby` pattern already used elsewhere on the
   page), and added `font-semibold` to `ToggleChip`'s pressed state — confirmed the existing
   fill/outline treatment already did most of what was asked, so didn't invent a new colour.
7. `npm run test` — one real failure: `PolicyGateRow.test.tsx` asserted the waiver line as
   one contiguous text node (`/Exception granted by Owen Baptiste/`), which no longer holds
   now that the name is wrapped in its own `IconText` element. Fixed by checking the
   surrounding `<p>`'s full `textContent` instead of a single text-node match, and added a
   new test asserting the right icon (`.lucide-user` vs. `.lucide-bot`) renders for a person
   vs. a system `evaluatedBy`.
8. `npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, tests)
   green.
9. Keyboard pass and before/after screenshots against the real dev server (same
   Playwright-via-environment technique used earlier this session): tabbed through the whole
   page (32 stops, nothing skipped or trapped), confirmed a filter chip still toggles via
   Enter, and confirmed the filter group's accessible name resolves to "Filter logs" through
   the new `aria-labelledby`. Screenshotted `run-messy`, light and dark, before any change and
   after everything landed.

**Why it was done this way**
- **Fixed the locale bug with a mechanical check this time, not just a fix.** The 12-hour
  clock fix (2026-09-19) addressed one call in this file; the same file still had four more
  calls with the identical unset-locale problem, which is exactly how a second, related bug
  surfaced from the same root cause. A check that fails the build is what actually stops a
  third occurrence — see docs/DECISIONS.md 0015.
- **`RegionCard` as a real component, not a repeated class string.** Four of the five regions
  have multiple return branches that all need the identical container — writing the class
  string 3–4 times per file across 5 files is exactly the kind of duplication this codebase's
  own `Disclosure`/`StatusBadge`/`Tag` precedent avoids. One component, one place to change
  the container later.
- **Person/system icon is a heuristic, named as one.** No field in the data model says which
  kind of actor a given string is, and adding one was out of scope tonight. Verified against
  every real value rather than assumed correct from the pattern alone — see
  docs/DECISIONS.md 0016 for the trade-off this leaves open.
- **Kept `ToggleChip`'s existing fill/outline treatment.** Reading the actual source before
  changing it showed the filled-vs-outline distinction the request described was already
  built; screenshotted to confirm it reads clearly, and added `font-semibold` rather than
  inventing a new colour pairing for a distinction that was already mostly there.

**How to do this by hand**
For any new top-level region on this screen, reach for `RegionCard` (`src/components/
RegionCard.tsx`) as the outer container rather than writing `rounded-md border
border-border-subtle bg-surface p-[var(--space-4)]` again — and apply it in every state a
region can render (loading, empty, populated), not only the happy path, or the boundary will
flicker in and out depending on what's on screen. For a new actor-name field, reuse
`lib/actors.ts`'s `isSystemActor` rather than re-deriving the person/system distinction by
eye — and if it ever misclassifies a real value, that's the signal to replace it with a real
data-model field (docs/DECISIONS.md 0016), not to add another pattern case.

**Verification**
`npm run check` (typecheck, lint, `check:theme-bridge`, `check:format-locale`, 32 files / 178
tests) green. `check-format-locale.mjs` verified against both failure and success, the same
way `check-theme-bridge.mjs` was. Keyboard pass on the real running app: full tab sweep with
nothing skipped or trapped, a filter chip toggles via Enter, the filter group's accessible
name resolves to "Filter logs". Before/after screenshots of the full composed `RunReviewPage`
(`run-messy`), light and dark, via the real dev server.

**Open questions / next**
- The person/system actor icon is a string heuristic (docs/DECISIONS.md 0016), not backed by
  a real field — worth revisiting if a real `evaluatedByKind`-style field is ever added to the
  data model for other reasons.
- Confidence (Region 5) and a real undo action remain unbuilt, unchanged from before this
  session — both were explicitly out of scope tonight.

---

### 2026-09-21 · First real shadcn components (Button, Checkbox, Dialog); a self-referencing bridge bug that broke every focus ring in light theme

**Goal**
Add real shadcn/ui components (`npx shadcn@latest init` was blocked — see below) and, once
building them surfaced a real bug in the existing shadcn bridge, fix it properly: audit for
the same pattern elsewhere, fix the check that should have caught it, and correct the record.

**What changed**
- `src/components/ui/button.tsx`, `checkbox.tsx`, `dialog.tsx` (new) — fetched from
  shadcn-ui/ui on GitHub, import paths rewritten to this project's aliases, `accent`/
  `accent-foreground` hover states patched to `surface-raised`/`foreground` per 0007.
- `package.json`/`package-lock.json` — `radix-ui` (the three components' primitive backend)
  and `playwright` (devDependency, for `check-theme-bridge.mjs`'s runtime check below) added.
- `src/styles/index.css` — added the global `border-color` preflight reset shadcn's own
  components assume and this project didn't have (0013); removed the self-referencing
  `--color-primary`/`--color-primary-foreground` bridge lines (0014); bridge comment
  rewritten to record both.
- `scripts/check-theme-bridge.mjs` — rewritten: the "safe if the bridge value mirrors the
  token's name" exception is gone (any colliding name is now an unconditional error), and a
  new runtime check builds the real CSS and verifies every semantic colour's `bg-*`/`text-*`
  utility actually paints its own colour, in a real browser, across light and both dark paths.
- `eslint.config.js` — `scripts/check-theme-bridge.mjs` given combined browser+node globals
  (its `page.evaluate()` callbacks run in a real browser, not Node).
- `README.md` — the one-time `npx playwright install chromium` the check now needs.
- `docs/DECISIONS.md` — 0013 (the border-color reset), 0014 (the primary/focus-ring bug and
  fix, correcting 0008), plus in-place correction notes appended to 0008 and 0009 themselves.
- Commits: `c922fad` (the three components + border-color fix), `240b999` (the primary/
  focus-ring fix + check rewrite).

**Steps, in order**
1. `npx shadcn@latest init` — blocked: `ui.shadcn.com` returns a 403 through this session's
   egress proxy (confirmed with `curl`, then via the proxy's own `/__agentproxy/status`).
   `raw.githubusercontent.com` is reachable, so fetched `dialog.tsx` and `checkbox.tsx`
   directly from `shadcn-ui/ui`'s GitHub source instead, at the exact paths the CLI itself
   would pull from (`apps/v4/registry/new-york-v4/ui/*.tsx`).
2. Both fetched files import `cn` from a registry-internal alias (`"cn"`, not a real package)
   and `dialog.tsx` additionally imports `Button` from a path (`@/registry/new-york-v4/ui/
   button`) that only exists inside shadcn's own monorepo. Fetched `button.tsx` the same way
   rather than stripping the dependency, and rewrote all three files' imports to this
   project's real aliases (`@/lib/utils`, `@/components/ui/button`).
3. `npm install`, `npm install radix-ui`, `npm run typecheck`/`build` — all green.
4. Rendered the three components side by side in a throwaway harness (a temp file swapped
   into `main.tsx`, reverted after) and screenshotted light/dark with the environment's
   global Playwright: `bg-primary` (Button's `default` variant) painted nothing at all in
   light theme, the default theme.
5. Traced it to the compiled CSS, not assumed: `--color-primary` and `--color-primary-
   foreground` in the bridge were self-referencing (`var(--color-primary)`), reasoned safe by
   0008 as "mirrors the token." Tailwind merges an `@theme` name and a same-named `@theme
   inline` one into one entry, the bridge's winning outright — so this was a genuine CSS
   custom-property cycle, computing to nothing. `--color-focus-ring` (tokens.css: `var(--
   color-primary)`) rode the same cycle, breaking `:focus-visible`'s outline colour site-wide
   in light theme — confirmed with `getComputedStyle(...).getPropertyValue('--color-focus-
   ring')` returning `""`.
6. Reported the bug and stopped for a decision before touching shared, non-shadcn code — see
   "Why" below.
7. Fix: removed both self-referencing lines; re-audited every remaining bridge name against
   every tokens.css name for the identical pattern (name collides, regardless of what value
   it's given) — none of the rest do.
8. Rewrote `check-theme-bridge.mjs`'s static rule to have no "mirrors the token" exception.
   Tried a first runtime-verification design (raw `getComputedStyle(:root)` per custom-
   property name) and it produced dozens of false positives: `@theme inline` bakes
   non-colliding bridge names directly into each utility's own rule at build time
   (`.bg-background{background-color:var(--color-bg)}`) rather than emitting a real
   `--color-background` custom property at all, so checking for that property directly
   flagged every one of them as "broken" when nothing was wrong. Redesigned around applying
   the actual `bg-*`/`text-*` utility to a real element and reading what painted instead —
   the same test that caught the original bug, generalized to every semantic colour.
9. That redesign hit a second false-positive class: Tailwind's content scanner only
   generates a utility class if it finds that literal class name as text somewhere in the
   project, so colours nothing in the app currently uses (every status colour, `bg-card`, …)
   simply weren't in the build output. Added a throwaway probe file (written before the
   build, deleted in a `finally` right after) containing every `bg-<name> text-<name>` as
   literal text, giving the scanner a real reason to generate each one.
10. Verified the finished check against failure, not just success: reintroduced the exact
    primary self-reference and confirmed the static check catches it immediately; separately
    injected a synthetic mutual cycle between two *non-colliding* bridge names and confirmed
    the runtime check catches that (the case the static rule structurally cannot see); then
    restored the clean file and confirmed a clean pass both times.
11. Lint failed on the rewritten script (`document`/`getComputedStyle` "not defined" inside
    `page.evaluate()` callbacks — those run in the browser, not Node). Gave the script
    combined browser+node globals in `eslint.config.js`, the same pattern test files already
    use.
12. Confirmed the actual fix, not just the check: tabbed into the real running app in light
    theme and read the focused element's computed `outline-color` — `rgb(91, 79, 199)`,
    exactly `--violet-light`/`--color-focus-ring`'s correct value — plus a screenshot showing
    the visible violet ring.
13. `npm run check` (with `PLAYWRIGHT_CHROMIUM_EXECUTABLE` set for this sandboxed session's
    non-default browser path) green end to end. Corrected 0008 and 0009 in place (their
    original reasoning is left as written, with a correction paragraph appended) and wrote
    0014.

**Why it was done this way**
- **Stopped and asked before fixing the focus-ring bug.** It's a real, serious, pre-existing
  bug, but it's in shared, non-shadcn code, unrelated to the two components actually asked
  for — exactly the kind of thing AGENTS.md's "ask before... restructuring" is for. Reporting
  it precisely (root cause, blast radius, a proposed fix) and waiting for a decision, rather
  than unilaterally patching shared token/bridge files, matched how this repository's other
  cross-cutting decisions (0007, 0008) were made — deliberately, not silently.
- **No safe way to redeclare a colliding name in the bridge, mirrored or not.** 0008's
  "primary is fine, it mirrors itself" reasoning read the *source* and judged the value
  looked right; it never checked whether the property *resolved* to anything at runtime, which
  is the only way a self-reference cycle shows up. There is no version of redeclaring a
  colliding name that's provably safe — the fix, same as 0007/0008, is to not redeclare it.
- **Corrected 0008/0009 in place rather than silently superseding them.** A wrong decision
  quietly replaced by a later one looks, in hindsight, like nobody ever got it wrong — which
  makes the same mistake easier to repeat. Leaving 0008's original paragraph intact with a
  correction appended, and pointing to 0014 from both 0008 and 0009, keeps the actual history
  legible.
- **Utility-class checks, not raw custom-property checks.** Two rounds of false positives
  (steps 8–9) taught the same lesson twice: Tailwind v4's `@theme inline` emission and its
  content-scanning are both real mechanics that a naive "read `:root`'s computed value" check
  doesn't model. Testing the thing that actually matters — does this Tailwind class, applied
  to a real element, paint the colour it's supposed to — sidesteps needing to model either
  mechanic correctly, and is exactly what the original bug looked like when it was found.

**How to do this by hand**
When a design-system bridge maps your own token names onto a third-party vocabulary (here,
shadcn's `primary`/`border`/`accent`/…), a name that exists on *both* sides is never safe to
redeclare in the bridge, no matter what value you give it — not a different value (silently
wrong, 0007/0008's failure mode) and not the name's own value either (silently invalid, this
session's failure mode). Drop it from the bridge and let the one real declaration through.
To check any of this by hand: build the app, apply the exact utility class to a throwaway
element, and read `getComputedStyle` — not `:root`'s custom property directly (a name can be
real and correct without ever appearing there), and not by reading the CSS source and
reasoning about what it should do.

**Verification**
`npm run check` (typecheck, lint, `check:theme-bridge`, 30 files / 170 tests) green after
both commits. The rewritten `check-theme-bridge.mjs` verified against both failure and
success: the real historical bug reintroduced and caught, a synthetic non-colliding mutual
cycle reintroduced and caught, a clean pass confirmed after restoring. The actual fix verified
independently of the check: `bg-primary`/`text-primary-foreground` screenshotted correctly in
light and dark on the three new components; a real focusable element in the running app
tabbed to and its computed `outline-color` read directly, plus a screenshot of the visible
focus ring, in light theme.

**Open questions / next**
- `npm run check` now depends on a Chromium build Playwright can launch. Works with `npx
  playwright install chromium` on an ordinary machine; this session's sandboxed browser cache
  needed `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pointed at its own non-default path instead. No CI
  workflow exists yet in this repo to also wire this into — worth checking when one is added.
- `Button`, `Checkbox`, `Dialog` are added and verified rendering correctly, but not yet used
  anywhere in the actual product (`RunReviewPage` and friends), and have no stories or tests
  of their own yet — `src/components/README.md`'s "every state gets a Storybook story" rule
  wasn't applied to them this session, since the task was explicitly to verify them side by
  side with the hand-written components first, not to adopt them yet.
- This session pushed to a dedicated branch (`claude/serene-carson-7obhu8`) rather than
  `main`, per this session's own environment configuration — see the reply in conversation for
  what merging it requires.

---

### 2026-09-21 · Explicit type scale and spacing scale, applied across RunReviewPage

**Goal**
Replace the earlier vague "establish a type scale" / "consistent spacing rhythm" instructions
with exact values, and apply them across every region `RunReviewPage` composes.

**What changed**
- `src/styles/tokens.css` — six `--text-*` tokens (page-title/section-heading/item-title/
  body/meta/badge-label; font-size only, each documented with the weight and font it always
  pairs with) inside `@theme`, so each is also a real Tailwind utility. Eight `--space-1`
  through `--space-8` (4px base) as plain custom properties outside `@theme`, consumed via
  arbitrary-value syntax — the same reasoning as the existing motion tokens.
- `src/styles/README.md` — both scales documented with their values and the three named
  spacing relationships (between regions, heading-to-content/between-list-items,
  inside-one-item).
- `src/app/App.tsx` — a literal `<h1>Agent run review</h1>` at `--text-page-title`, the page's
  own constant identity (not data about a specific run, so it lives here, not in
  `RunReviewPage`).
- A `<h2 className="text-section-heading">` added to every region that didn't have one:
  `RunSummary` ("Summary"), `PolicyGateList` ("Policy gates"), `Timeline` ("Audit log"),
  `DecisionBar` ("Decision", in both its pre- and post-decision views). `RunHeader`'s system
  name is now a real `<h2>` too, at the same size it already was. `RunReviewPage`'s `<section>`
  wrappers use `aria-labelledby` pointing at these headings instead of a separate `aria-label`
  — one place for each region's name, not two.
- Every spacing value in every component `RunReviewPage` composes (including the shared
  `components/` atoms it renders) — `gap`, `padding`, `margin` — replaced with a
  `var(--space-N)` reference: `--space-7` between regions, `--space-3` for heading-to-content
  and between list items, `--space-2` inside one item between its parts.
- Every content text node in that same tree given one of the six type-scale roles, per the
  mapping in `src/styles/README.md`. `StatusBadge` alone gets `--text-badge-label`; `Tag` and
  `ToggleChip` keep their existing sizing (docs/DECISIONS.md, 0010 already treats them as a
  different role from a status claim). Button and link labels are left alone too — none of
  the six roles is "interactive control," and the closest, `--text-body`, is 400 weight
  against every button's existing 500.

**Steps, in order**
1. Read `AGENTS.md`, `docs/spec-review-screen.md`, `src/styles/README.md`, `tokens.css`, and
   every component under `RunReviewPage`'s tree. Presented a plan (which headings, which
   spacing rule applies where, the two flagged judgment calls) and got it approved before
   writing code.
2. Added both token blocks to `tokens.css`, then verified Tailwind actually generates the six
   `text-*` utilities and resolves the arbitrary-value `--space-*` references, the same
   probe-build technique used for the shadcn-bridge work: a throwaway `src/tw-probe.tsx`
   temporarily imported into `main.tsx`, `vite build`, grep the built CSS for
   `.text-item-title{font-size:var(--text-item-title)}` and `gap:var(--space-3)`, then
   deleted the probe and reverted `main.tsx`.
3. Documented both scales in `src/styles/README.md`.
4. Worked bottom-up through the composed tree: `App.tsx` (page title), then each region
   component (heading + its own internal spacing/type), then the shared `components/` atoms
   each region depends on (`Disclosure`, `IconText`, `Tag`, `StatusBadge`, `ToggleChip`,
   `Checkbox`, `EvidenceLink`, `Modal`).
5. `npm run check` — one real test failure: `RunReviewPage.test.tsx` queried
   `getByRole('region', { name: 'Timeline' })`, which no longer matches now that the region's
   accessible name comes from its own heading ("Audit log") instead of the old `aria-label`.
   Updated the test to the new name.
6. `npx prettier --write` on every touched file; `npm run check` green again.
7. Screenshotted the composed `RunReviewPage` (`run-messy`) before and after, light and dark,
   against the real dev server — plus `run-blocked` with a gate's disclosure open, to check
   the evidence bullet list still renders correctly now that its `<ul>` is `flex flex-col`
   (needed for the `--space-2` item gap; bullets are a property of each `<li>`'s own
   `list-item` display, unaffected by the parent's `display: flex`, confirmed by looking, not
   assumed).

**Why it was done this way**
- **Type tokens inside `@theme`, spacing tokens outside it.** `--text-*` is Tailwind's own
  real font-size namespace, so putting the six sizes there gets clean utility classes
  (`text-item-title`) for free. `--space-*` is not a namespace Tailwind recognizes (that one
  is `--spacing-*`) — inventing a different prefix just to get auto-generated utilities would
  have meant not using the exact names given ("use these, not your own judgment"), so these
  stay plain custom properties consumed via arbitrary-value syntax, exactly like the existing
  motion tokens already do for the identical reason.
- **A token can't carry a weight or a font, only a component's class list can.** Every one of
  the six sizes is documented with the weight/font it always pairs with, and every use in code
  applies the full combination — never the size alone — so "decided once" actually holds
  instead of silently drifting per instance.
- **Pill padding rounded, not left alone.** `StatusBadge`/`Tag`/`ToggleChip`'s `px-2.5 py-1`
  didn't match any of the eight values. The task states "no literal px values anywhere in
  components" as a blanket rule, not scoped to just the four named relationships, so this was
  rounded to `space-3`/`space-1` rather than left as a Tailwind number — a real, if small
  (2px), visual change to three already-shipped, previously-screenshotted components, flagged
  in the plan before making it.
- **`Disclosure`'s evidence/artefact lists became `flex flex-col`.** They needed a
  `--space-2` gap between items, which `gap` can't provide on a plain block list — verified
  the bullet markers still render (a `display: flex` container doesn't affect its children's
  own `list-item` display) by actually opening a gate's disclosure and looking, not by
  assuming the CSS behaves as expected.

**How to do this by hand**
Read `src/styles/README.md`'s two new tables. For any new text, pick the role by what the
words *are* (a region name → section-heading, a row's own title → item-title, a sentence →
body, incidental detail → meta), not by what looks visually close to an existing size. For any
new gap, pick by the *relationship* (between regions, region-to-content/list-to-list,
part-to-part within one item), not by eyeballing a pixel value.

**Verification**
`npm run check` (30 files, 170 tests) green; `prettier --check .` clean except the
pre-existing, unrelated `README.md` warning (not touched this session). Tailwind's utility
generation verified with a probe build, not assumed. Before/after screenshots of the full
composed `RunReviewPage`, light and dark, plus a gate's open disclosure to confirm the
evidence bullet list survived becoming a flex container.

**Open questions / next**
- Confidence (Region 5) is still the only region left unbuilt — it will need its own
  `--text-section-heading` from the start rather than retrofitted.
- The type scale has no explicit role for interactive controls (buttons, links); they were
  deliberately left on Tailwind's ordinary sizing this session. Worth a seventh named token if
  a future session finds itself inventing ad hoc button sizes again.

---

### 2026-09-21 · Decision: DecisionBar, DecisionDialog

**Goal**
Build Region 6 — the three actions, the sign-off tick, submit validation, a failed submit, and
Scenario S5's conflict — composed into `RunReviewPage`.

**What changed**
- `src/features/run/DecisionBar.tsx` (+ stories + test) — the three actions (equal visual
  weight, no brand colour), the sign-off checkbox, and the post-decision view with a live
  undo countdown.
- `src/features/run/DecisionDialog.tsx` (+ stories + test) — the confirm/reason modal:
  approve's confirmation text, the reason prompt and its validation for the other two,
  submit's error state, and the conflict state.
- `src/components/Modal.tsx`, `src/components/Checkbox.tsx` (+ stories + tests) — generic
  pieces `DecisionBar`/`DecisionDialog` are built from.
- `src/lib/decision.ts` (+ test) — `undoWindow`, the fixed 10-minute policy from
  docs/DECISIONS.md 0003, finally given code.
- `src/lib/gates.ts` — `gateAcknowledgement`; `src/lib/format.ts` — `formatDuration`,
  `formatSignOffMessage`.
- `src/lib/types.ts`, the three fixtures — `Run.revision` (docs/DECISIONS.md, 0011).
- `src/lib/api.ts` — unchanged; `submitDecision`'s existing `simulateNetworkError`/
  `simulateConflict` options were exactly what this needed.
- `src/features/run/RunReviewPage.tsx` — composes `DecisionBar`; holds the run in local state
  so a decision or a conflict updates the screen immediately, without a refetch.
- `docs/DECISIONS.md` 0011 (the revision field) and 0012 (S5 scoping, as asked).

**Steps, in order**
1. Read `AGENTS.md`, `docs/spec-review-screen.md`, `lib/api.ts`, `lib/types.ts`, `lib/gates.ts`
   and the fixtures fresh; found `Run` had no `revision` field to show in the confirmation
   text, and no existing helper for the undo window or the sign-off counts. Presented a plan
   naming these as judgment calls and got it approved before writing code.
2. Built the `lib` layer first: `Run.revision` (+ fixture values), `gateAcknowledgement`,
   `formatDuration`, `formatSignOffMessage`, `lib/decision.ts`'s `undoWindow` — each with its
   own test before touching any component.
3. Built `Modal` and `Checkbox` in `components/`. `Modal`'s tests needed a rewrite mid-way:
   jsdom has no `HTMLDialogElement` methods at all (`showModal`/`close`/`show` are all
   `undefined` — confirmed directly with a throwaway jsdom script), so `Modal` feature-detects
   them and sets the `open` attribute directly as a fallback (otherwise a closed `<dialog>` has
   no accessible role in jsdom, and every test render would throw before that even mattered).
4. Built `DecisionDialog`, then `DecisionBar`, then composed `DecisionBar` into
   `RunReviewPage`, each with tests written against real `lib/api.ts` calls (`delayMs: 0`,
   `simulateNetworkError`, `simulateConflict`) rather than a mocked module — the same choice
   `RunReviewPage`'s own tests already made.
5. `npm run check` — fixed two `react-hooks` lint errors in `useRun.ts`-adjacent code:
   `react-hooks/set-state-in-effect` on a synchronous `setState` inside `handleSubmit`'s
   effect-adjacent code, and a misused-promise warning from passing an `async` function
   straight to `onClick` (wrapped in `() => void handleSubmit()`).
6. Storybook stories for every listed state (`DecisionBar`: no/unticked/ticked
   acknowledgement, decided; `DecisionDialog`: approve, request-changes and reject each empty
   and filled, network failure, conflict) — screenshotted via a built Storybook served
   locally, light and dark. The failure/conflict states use a new `initialState` prop
   (and `initialReason` for the filled ones) so they render declaratively, the same "mainly
   for stories and tests" pattern as `Timeline.defaultActiveTypes`.
7. Ran the real app (`npm run dev`) and drove it with Playwright/Node scripts — and this is
   where it stopped being a formality. See "Why" below: two real bugs, invisible to every test
   and every story so far, only showed up here.
8. Fixed both (see below), re-ran `npm run check` (still green — neither fix changed any
   test-observable behavior, since RTL's `render` doesn't use `StrictMode` and jsdom's
   `<dialog>` never really closes itself), then re-ran the full click-through verification
   clean: sign-off gate, approve, request changes (empty blocked, then filled), the
   already-decided view, Escape-to-close, and focus moving into the dialog on open.

**Why it was done this way**
- **Two bugs only a real, `StrictMode`-wrapped browser could catch.** `src/main.tsx` wraps the
  app in `<StrictMode>`, which double-invokes every effect's mount/cleanup/mount in
  development — something React Testing Library's `render` does not do, and something jsdom's
  nonexistent `HTMLDialogElement` couldn't have exercised even if it did. Both bugs were real,
  not test artifacts:
  1. `Modal`'s cleanup called `dialog.close()` to reset state before `StrictMode`'s replayed
     mount. `close()` fires its own `'close'` event as a separately queued task, confirmed by
     patching `HTMLDialogElement.prototype` before load and logging every call: the queued
     event from the *first* mount's cleanup arrived *after* the second mount had already
     attached a fresh listener, so the teardown's own artificial close was mistaken for a real
     one — every dialog closed itself immediately after opening. Fixed by setting the `open`
     attribute directly in cleanup instead, which resets the same state without dispatching
     the event.
  2. `DecisionDialog` tracked "am I still mounted" with `mountedRef.current = false` set only
     in an effect's cleanup. Under `StrictMode`'s replay, that cleanup fires once right after
     the first mount and is never undone, leaving the flag permanently `false` — so every real
     `submitDecision` result was silently discarded by the `if (!mountedRef.current) return`
     guard meant to protect against exactly the opposite situation (a real unmount). Confirmed
     by watching the submit button reach its disabled "submitting" state and then simply never
     leave it. Fixed by also setting the ref back to `true` at the start of the same effect.
  Neither bug could have been caught by the unit tests, the Storybook screenshots, or even a
  careful code review — both needed an actual click, in an actual browser, with `StrictMode`
  actually on. This is the same lesson `--color-border`'s probe-build and the shadcn-bridge
  check already taught twice: verify by actually running it, not by reading the source and
  reasoning that it should work.
- **`Tag`/`StatusBadge` precedent extended without change.** Neither action button nor the
  decided-view text needed a new token — everything here is neutral (`border-border`,
  `surface-raised`, `text-primary`), same reasoning as 0010.
- **Real `lib/api.ts` calls in stories and tests, not a mock.** Consistent with every prior
  session's choice for this codebase; see `DecisionDialog.stories.tsx`'s own comment for why
  the plain success path isn't one of the committed stories.

**How to do this by hand**
Same shape as prior sessions: read the spec section, list every state, build bottom-up
(`lib` → `components` → `features/run`), a story per state. The one genuinely new step this
session: after everything passes in isolation, actually run the real app in a real browser
with React's Strict Mode on (the default for `npm run dev`) and click every path end to end —
don't stop at "the tests pass and the screenshots look right."

**Verification**
`npm run check` (30 files, 170 tests) green throughout; `prettier --check .` clean except the
pre-existing, unrelated `README.md` warning (not touched this session). Storybook screenshots
for every listed state, light and dark. Real dev-server + Playwright verification, after fixing
the two bugs above: sign-off tick correctly blocks and unblocks Approve on `run-blocked`'s real
gates; a full approve round trip on `run-blocked` and a full request-changes round trip
(empty-blocked, then filled) on `run-clean` both actually complete and show the decided view;
`run-messy`'s pre-existing decision shows its live countdown; Escape closes the dialog and
focus moves into it on open (both native `<dialog>` behaviors no jsdom test could confirm).

**Open questions / next**
- Confidence (Region 5) is the only region left unbuilt.
- The full (passive) form of Scenario S5 is deliberately out of scope — see
  docs/DECISIONS.md, 0012.
- `Run.revision` is currently fixed per fixture; nothing yet models it changing after a
  decision (the deeper staleness question 0012 also scopes out).

---

### 2026-09-21 · Page composition: RunReviewPage, RunHeader, RunSummary, useRun

**Goal**
Compose the review screen for real: `RunReviewPage`, `RunHeader`, `RunSummary`, and the
`useRun` hook wiring them to `lib/api`'s `getRun`, with `PolicyGateList` and `Timeline`
composed into the same page — closing the open item from the Timeline session (its scroll
bound was only proven in isolation, never against a real header above it).

**What changed**
- `src/features/run/useRun.ts` (+ test) — loading/not-found/error/success states over
  `getRun`, with a `refetch` for the Content-rules "Retry" action.
- `src/features/run/RunHeader.tsx` (+ stories + test) — system, environment and status always
  visible; initiative and requester below that; agent, model, run id and time zone behind a
  disclosure.
- `src/features/run/RunSummary.tsx` (+ stories + test) — three to five sourced sentences,
  each linking into the Timeline.
- `src/features/run/RunReviewPage.tsx` (+ test) — composes all four regions, handling
  loading/not-found/error once instead of in each region.
- `src/components/Tag.tsx`, `src/components/EvidenceLink.tsx` (+ stories + tests) — see "Why"
  below and `docs/DECISIONS.md`, 0010.
- `src/lib/summary.ts` (+ test) — resolves summary sentences against the timeline, dropping
  any with no real evidence; `src/lib/timeline.ts` gained `resolveEvidenceIds`, shared with
  `lib/gates.ts`'s `resolveEvidence` rather than duplicated.
- `src/lib/format.ts` — `formatRunStatusLabel`, `formatTimeZoneLabel`.
- `src/lib/api.ts` — `GetRunOptions.simulateNetworkError`, mirroring the option
  `submitDecision` already had; without it, "Could not load this run" was unreachable.
- `src/features/run/TimelineEventRow.tsx` — each row now carries a stable
  `id="timeline-event-<id>"`, so `RunSummary`'s evidence links have something real to point at.
- `src/app/App.tsx` (+ test) — renders `RunReviewPage`, run selectable via `?run=<id>`
  (defaults to `run-messy`), so all three fixtures and a bad id are reachable in a real
  browser without adding a router.
- READMEs: `src/lib/`, `src/features/run/`.

**Steps, in order**
1. Read `AGENTS.md`, `docs/spec-review-screen.md`, `lib/api.ts`, `lib/types.ts`,
   `lib/format.ts`, `lib/gates.ts`, `lib/timeline.ts`, the three fixtures, `PolicyGateList`/
   `PolicyGateRow`, `StatusBadge`/`IconText`/`Disclosure`/`ToggleChip`, `App.tsx`, and both
   `.claude/skills/`. Presented a plan (files, judgment calls) and got it approved before
   writing any code.
2. Built the `lib` layer first: moved evidence-id resolution out of `gates.ts` into
   `timeline.ts`'s `resolveEvidenceIds` (shared with the new `summary.ts`), added the two
   `format.ts` helpers, added `simulateNetworkError` to `getRun`.
3. Built `Tag` and `EvidenceLink` in `components/`, each with stories and tests.
4. Added the anchor id to `TimelineEventRow`.
5. Built `useRun`, `RunHeader`, `RunSummary`, `RunReviewPage` in that order, each with tests;
   stories for `RunHeader` (all six statuses, all three environments, long-initiative
   truncation) and `RunSummary` (three/five sentences, a dropped no-evidence sentence,
   loading, all-dropped).
6. Wired `App.tsx` to `RunReviewPage` with the `?run=` switch; rewrote `App.test.tsx`
   (the old placeholder-shell test no longer applied).
7. `npm run check` — one real failure: `useRun`'s effect called `setState({status:'loading'})`
   synchronously on every run, which `react-hooks/set-state-in-effect` correctly flags as a
   cascading-render risk. Fixed by moving the loading reset to render time, guarded by a
   second `useState` holding the last-handled `runId:attempt` key (react.dev's own "adjusting
   state when a prop changes" pattern) — a first attempt using a `useRef` for that guard was
   also rejected by lint (`react-hooks/refs`: refs can't be read or written during render),
   which is why it's plain state instead.
8. `npx prettier --write` on every new/changed file; `npm run check` green again.
9. `npx storybook build`, served it locally, and used `playwright screenshot` against the
   built iframe URLs for every `RunHeader` and `RunSummary` story, light and dark.
10. Ran the real app (`npm run dev`) against `?run=run-messy` and drove it with a short
    Playwright/Node script (not just the CLI) to actually test the scroll composition: scrolled
    the outer page to bring the Timeline's event list into view, then scrolled *inside* that
    list via `el.scrollTop = ...` and read back `scrollTop`/`scrollHeight`/`clientHeight`, and
    separately clicked a `RunSummary` evidence link and confirmed its target event scrolled
    into the viewport. Killed both local servers afterward.
11. Wrote `docs/DECISIONS.md` 0010 and this entry.

**Why it was done this way**
- **`Tag`, not `StatusBadge`, for run status and environment.** `StatusBadge`'s five tones are
  `--color-status-*`, and both `tokens.css` and `src/styles/README.md` scope those tokens to
  "a claim about a policy check" specifically — the same distinction the design system
  already draws between accent and status colours. A run's workflow phase (running, approved,
  ...) and its deployment environment are neither of those; reusing status colours for them
  would visually conflate "this gate passed" with "this run was approved," which are
  different claims made by different parties. `Tag` carries no colour semantics at all —
  distinctness comes from the icon and the exact label — so nothing new needed adding to
  `tokens.css` either. See `docs/DECISIONS.md`, 0010.
- **Evidence links point into the Timeline for real**, not a restatement of ids. This was only
  possible once the page actually composed `RunSummary` next to `Timeline` — before this
  session, neither region had a reason to expose a stable DOM anchor.
- **`getRun` needed a way to fail on purpose.** It could previously only ever succeed or throw
  `NotFoundError`; there was no way to reach "Could not load this run. The connection timed
  out. Retry." at all. `simulateNetworkError` mirrors the shape `submitDecision` already uses,
  rather than inventing a different one.
- **No stale-while-revalidating.** `getRun` has nothing like `submitDecision`'s
  `DecisionConflictError` to signal a run moved on during a read. That's a Decision-region
  (Scenario S5) concern, not built yet — `useRun` exposes `refetch` for Retry and nothing more,
  rather than half-building a state nothing can trigger.
- **`?run=` on `App.tsx`, not a hard-coded fixture.** Without it, only one of the three
  fixtures would ever be reachable outside Storybook and tests, which would have made the
  scroll-composition verification (the actual point of this task) impossible to do against
  the real app rather than an isolated story.

**How to do this by hand**
Same shape as any other region: read the spec section, list every state, build with tokens,
write the Storybook story per state, check both themes. The one part specific to this task —
proving a scroll region behaves inside a real page, not just in isolation — has no by-hand
equivalent beyond opening the real app in a browser, scrolling to the region, and watching
whether the right part of the page moves.

**Verification**
`npm run check` (25 test files, 133 tests) green; `npx prettier --check .` clean except the
pre-existing, unrelated `README.md` warning (not touched this session). Storybook stories for
`RunHeader` and `RunSummary` screenshotted via a built Storybook served locally, light and
dark. The Timeline scroll question was answered directly, not assumed: with `run-messy`
composed under the real header/summary/gates, the timeline list's own bounding box stayed
exactly `384px` tall (`max-h-96`) with independent internal scroll
(`scrollHeight: 11736, clientHeight: 384`) regardless of the page's own scroll position or the
real header above it — **the earlier assumption held; no fix was needed.** Also confirmed:
clicking a `RunSummary` evidence link scrolls its target timeline event into view.

**Open questions / next**
- Confidence and Decision (Regions 5 and 6) are still not built — `RunReviewPage` composes
  everything that exists so far and nothing more.
- `useRun` has no stale-while-revalidating; when Decision is built and `submitDecision`'s
  `DecisionConflictError` (Scenario S5) enters the page, `useRun` likely needs to grow a way
  to react to a run changing under a reviewer who is still reading it.
- `App.tsx`'s `?run=` switch is a stand-in for real routing, explicitly out of scope
  (AGENTS.md); it should be replaced, not extended, once routing is actually added.

---

### 2026-09-20 · Automated check for shadcn-bridge/token collisions

**Goal**
Stop finding shadcn-bridge/token collisions (0007 `--color-accent`, 0008 `--color-border`) by
hand, one at a time, after something already used the colliding name. Add a check that fails
`npm run check` if it happens a third time.

**What changed**
- `scripts/check-theme-bridge.mjs` (new) — reads `src/styles/tokens.css`'s `@theme` block and
  `src/styles/index.css`'s `@theme inline` block, and fails if any bridge declaration shares a
  token's name without mirroring its value exactly (`var(--that-name)`).
- `package.json` — new `check:theme-bridge` script, added into the `check` chain between
  `lint` and `test`.
- `eslint.config.js` — `scripts/*.mjs` added alongside `eslint.config.js` to the
  type-checked-rules exemption and `allowDefaultProject`, the same way the config file itself
  already was; scripts aren't part of any `tsconfig` project.
- `src/styles/index.css` — one line added to the bridge's existing comment, pointing at the
  new check and DECISIONS 0009.
- `docs/DECISIONS.md` — 0009, generalizing 0007 and 0008 as one class of bug instead of two
  unrelated fixes.

**Steps, in order**
1. Read `src/styles/index.css` and `src/styles/tokens.css` fresh to confirm the exact current
   shape of both `@theme` blocks (no assumptions from memory).
2. Wrote `scripts/check-theme-bridge.mjs`: extract each `@theme` block's text by brace-matching
   after the at-rule keyword, parse flat `--name: value;` declarations with a regex, then for
   every bridge name that also exists in tokens.css, require the bridge's value to be exactly
   `var(--that-name)` — anything else is reported as a collision.
3. `node scripts/check-theme-bridge.mjs` against the current (already-fixed) files — passed.
4. Temporarily reintroduced the exact 0008 bug (`--color-border: var(--color-border-subtle);`
   back in the bridge) and re-ran the script — failed, naming `--color-border` and both values.
5. Restored the clean file, then temporarily reintroduced the exact 0007 bug
   (`--color-accent: var(--color-surface-raised);`) and re-ran — failed the same way. Restored
   the clean file again and confirmed `git status` showed no diff from either experiment.
6. Added `check:theme-bridge` to `package.json` and wired it into `check`.
7. `npm run lint` failed on the new script: it isn't covered by any `tsconfig`, so
   `typescript-eslint`'s type-aware rules couldn't parse it. Fixed the same way
   `eslint.config.js` itself is already handled — added `scripts/*.mjs` to the
   `disableTypeChecked` files list and `scripts/check-theme-bridge.mjs` to
   `allowDefaultProject` (a `scripts/**/*.mjs` glob is rejected by `typescript-eslint` itself
   as too wide, so it's listed by exact filename instead).
8. `npm run check` green end to end.
9. Wrote `docs/DECISIONS.md` 0009 and this entry.

**Why it was done this way**
Two instances of the identical bug, six commits apart, each found only because a component
happened to be the first thing to use that specific Tailwind class, is a pattern, not a
coincidence. Writing it down in DECISIONS.md the first two times documented it; it didn't stop
it from happening again. The check is deliberately narrow — a text-level regex over two known
blocks, not a general CSS correctness tool — because that's exactly the shape of the two bugs
that actually occurred, and a narrower, obviously-correct check beats a broader one that's
harder to trust. It was proven against both real historical bugs, not just the passing case,
the same discipline the probe-build technique already established for this kind of problem.

**How to do this by hand**
Read both `@theme` blocks side by side. For every custom property name in the bridge that also
appears in `tokens.css`, check that its value is literally `var(--that-same-name)` — anything
else means the bridge is quietly deciding what that name means for the whole app, not just for
shadcn.

**Verification**
`npm run check` (typecheck, lint, the new `check:theme-bridge` step, then the full test suite)
green. The new check itself verified against failure, not just success: manually reintroduced
both the 0007 and 0008 bugs one at a time and confirmed `node scripts/check-theme-bridge.mjs`
exits non-zero and names the right property and both values each time; confirmed a clean exit
0 on the real files after each restore, and that neither experiment left a git diff.

**Open questions / next**
- The check only understands `--name: value;` declarations with no fallback or nesting,
  matching how the bridge is written today. If it ever needs `var(--x, fallback)` or similar,
  the parser will need to grow with it rather than silently mis-parsing.
- No shadcn component has ever actually been generated against this bridge (the registry is
  still blocked from this session's egress policy) — this check guards the mapping's internal
  consistency, not whether the mapping is what a real generated component would expect.

---

### 2026-09-20 · Timeline (audit log): Timeline, TimelineEventRow, TimelineFilters

**Goal**
Build the audit log region against `run-messy` for length and `run-blocked` for the
error/retry case, following `docs/spec-review-screen.md`'s Region 4 and its Hierarchy
exactly: the shape of the run first, never a flat list; errors and retries never hidden by
filters.

**What changed**
- `src/fixtures/run-messy.ts` (+ test) — extended the timeline from 20 to 200+ events.
- `src/styles/index.css`, `docs/DECISIONS.md` — a real bug fix, unrelated to Timeline itself
  but found while building it (see below).
- `src/components/IconText.tsx`, `src/components/ToggleChip.tsx` (+ stories, tests).
- `src/lib/timeline.ts` (+ test).
- `src/features/run/TimelineEventRow.tsx`, `TimelineFilters.tsx`, `Timeline.tsx` (+ stories,
  tests).
- `src/features/run/README.md`, `src/lib/README.md` — corrected/extended file listings.
- Commits: `fb1e481` (fixture), `5b53ae2` (border fix), `2bf3308` (IconText/ToggleChip),
  `50a3faa` (lib/timeline.ts), `a711eaf` (TimelineEventRow), `eb1f104` (TimelineFilters),
  `5a033d7` (Timeline), `a8f1c08` (README corrections).

**Steps, in order**
1. Read `AGENTS.md` and `docs/spec-review-screen.md` fresh, then checked `run-messy.ts`'s
   actual timeline length before planning — 20 events, not 200+. Flagged it and extended the
   fixture for real, per the task's own instruction not to fake the scale test in stories
   only: the narrative reason (verifying a refund path against every shard in a sharded
   payments system) came before the generation code, not after — 180 near-identical events
   needed a real reason to be believable, not just a reason to exist.
2. Wrote `lib/timeline.ts` before any component: `isRetry`/`isError`, `timelineShape`, and
   `filterTimeline` — the last of these is where "never hidden by filters" actually lives,
   not in row styling, so it could be tested in isolation before any UI existed to hide the
   bug behind.
3. Verified every new lucide-react icon name (7 event types) actually exists before writing
   `TimelineEventRow`, same as the icon check from the previous PolicyGateRow session.
4. Building `ToggleChip`, tried `border-border` for the first time anywhere in this codebase
   and it silently resolved to the wrong colour. Traced it with a probe build (not assumed):
   the shadcn bridge in `index.css` had been redeclaring `--color-border` to equal
   `--color-border-subtle` since the design-system session, two sessions ago — the exact same
   class of collision already caught and fixed for `--color-accent`, just missed for
   `border` because nothing had used it directly until now. Fixed it, then deliberately
   audited the rest of shadcn's bridge vocabulary (`primary`, `secondary`, `muted`,
   `destructive`, `ring`, `input`) the same way — probe-built and checked the resolved value
   — rather than assume `border` was the only one. It was; `primary` is the one other
   exact-name overlap, and it isn't a collision, since both sides already agree on the value.
5. Built `TimelineEventRow`. Deliberately did *not* wrap a detail-less event in a `Disclosure`
   with an empty body — most of the 200 shard-check events have no detail at all, and an
   expand arrow leading to nothing would be a small invented interaction with no real content
   behind it. Gave the plain and the expandable row the same visual "card" treatment instead,
   so a 200-event list reads as one consistent sequence.
6. Built `TimelineFilters`, then `Timeline`, wiring `filterTimeline`'s forced-visible ids
   through to a "Shown despite the active filters" note on the row, so an event surviving an
   unchecked filter reads as intentional, not as a bug.
7. Built a static Storybook bundle, served it locally, and screenshotted the `Messy`
   (all 200 real events), `Filtered`, `Empty` and `Blocked` stories in both themes with the
   environment's global Playwright CLI, the same verification pattern as the previous two
   sessions. This is what confirmed the bounded scroll region actually clips the list rather
   than just having the CSS class present, that the empty state matches Content rules'
   example wording exactly, and that a severity-flagged failed `gate_eval` correctly counts
   as an "error" in the shape summary alongside the one literal `error`-type event.
8. Updated `features/run/README.md` (still said `TimelineEvent.tsx`; the real file is
   `TimelineEventRow.tsx`, to avoid colliding with `lib/types.ts`'s own `TimelineEvent`) and
   `lib/README.md` (didn't mention `timeline.ts` at all) — the `new-component` skill's "update
   the folder README if the rule changed" step, done as its own small commit rather than
   folded silently into the component commits.

**Why it was done this way**
- The `--color-border` bug is worth naming plainly: it is not a Timeline bug, and it existed
  in already-shipped, already-tested code for two full sessions before anything happened to
  use the one Tailwind utility name that triggered it. Nothing in `npm run check` — not
  `tsc`, not `eslint`, not a single existing unit test — could have caught it, because none
  of them render actual computed CSS and compare it to an expectation. Only trying to use the
  token directly, and checking the *build output* rather than the *source*, surfaced it. This
  is the same lesson as the 24-hour clock bug from the PolicyGateRow session, generalised:
  reading tokens.css and index.css correctly, twice, was not enough.
- Auditing the rest of the shadcn bridge immediately, rather than filing it as "worth doing
  later," was a deliberate choice: the previous session's own `DECISIONS.md` entry for the
  accent collision speculated that other collisions might exist without checking, and this
  session found one it hadn't predicted (`border`, not one of the ones that seemed obviously
  risky). A speculative "should audit sometime" note has a way of never actually happening.

**How to do this by hand**
Before trusting that a design-system token bridge is correct, don't just read both files side
by side — build the app, add the exact Tailwind utility class you're about to rely on to a
throwaway element, build again, and grep the *output* CSS for what it actually resolved to.
Do this for every semantic token name your product happens to share with whatever
third-party component vocabulary you're bridging to (here, shadcn's `background`, `border`,
`ring`, `primary`, …), not just the one you're about to use — a silent override in a shared
bridge file affects every future consumer of that name, not only the one that happens to
reveal it first.

**Verification**
`npm run check` green after every commit (101 tests by the end, up from 90). `npx storybook
build` succeeded and was actually rendered in both themes for the primary states, via a
static build served locally and screenshotted with the environment's global Playwright.
Confirmed the `--color-border` bug and its fix with before/after probe builds, not by reading
the CSS source and assuming it was right.

**Open questions / next**
- No `RunReviewPage.tsx` exists yet, so "the run header" the acceptance criteria say must
  stay visible alongside a scrolling Timeline is not a real, composed layout yet — this
  session's `max-h-96` bound is Timeline's own internal scroll, not yet proven against an
  actual page with a real header above it.
- The `border`/`accent` shadcn-bridge collision pattern is now caught twice. Worth deciding,
  before a real shadcn component is ever added, whether to rename our tokens away from
  shadcn's exact vocabulary preemptively, or keep resolving collisions as they're found —
  currently the latter, by default, not by an explicit decision.


### 2026-09-19 · PolicyGateList and PolicyGateRow, plus the lib helpers they need

**Goal**
Build the first two real product components — `PolicyGateList` and `PolicyGateRow` — against
`run-messy` as the primary fixture, following `docs/spec-review-screen.md` for the five
results, sort order, and content rules exactly.

**What changed**
- `src/lib/gates.ts`, `src/lib/format.ts` (+ tests) — documented in `lib/README.md` as
  planned, built now, scoped to exactly what these two components need.
- `src/components/StatusBadge.tsx`, `src/components/Disclosure.tsx` (+ stories, tests) —
  reusable, product-agnostic pieces.
- `src/features/run/PolicyGateRow.tsx`, `src/features/run/PolicyGateList.tsx` (+ stories,
  tests).
- Commits: `9e43f56` (gates.ts/format.ts), `30761df` (StatusBadge/Disclosure), `c200b1c`
  (PolicyGateRow), `07b0abd` (a fix found during verification, see below), `709a4b4`
  (PolicyGateList).

**Steps, in order**
1. Read `AGENTS.md` and `docs/spec-review-screen.md` fresh, per the task, plus
   `src/lib/types.ts` and `src/fixtures/run-messy.ts` (the assigned primary fixture) before
   planning anything.
2. Checked `run-messy.ts` against the task's claim that it "has the widest range of gate
   results" — it doesn't: only `pass` and `unknown`, no `fail` or `waived` at all.
   `run-blocked.ts` actually has the wider range. Flagged this in the plan rather than
   silently building fewer stories than asked, and used `run-blocked`'s gates to cover what
   `run-messy` can't.
3. Wrote `gates.ts` and `format.ts` first, since both components need them.
   `resolveEvidence`/`explanationFor` came from re-reading the fixtures closely: "what broke
   it", the "not run" reason, and the evidence list turn out to be the same lookup — the
   `detail` of whichever timeline event a gate's `evidenceIds` point to. There is no separate
   field for any of the three anywhere in the data model.
4. Verified every lucide-react icon name I planned to use actually exists in the installed
   version (`node -e "require('lucide-react')"`) before writing `StatusBadge`, rather than
   guessing and finding out at typecheck time.
5. Built `Disclosure` on native `<details>`/`<summary>` rather than custom JS. Confirmed, not
   assumed, that jsdom does not implement native keyboard activation for `<summary>`: a
   dispatched `keydown` does nothing, only `.click()` toggles it. Wrote the keyboard test
   around what jsdom can actually verify (reachable by Tab) and left a comment saying
   explicitly what it can't (Enter/Space activation, which every real browser does via
   `<summary>`'s implicit button role) rather than asserting something that would be a false
   negative.
6. Built `PolicyGateRow`, then `PolicyGateList`, running `tsc -b` and `eslint` after each file
   rather than saving verification for the end.
7. Built a static Storybook bundle and served it locally, then used the environment's global
   `playwright` CLI (not a project dependency — checked `which playwright` first, found it
   pre-installed) to screenshot the `AllResults` and `Exception` stories in both light and
   dark and actually looked at them, rather than trusting that a successful build meant
   correct rendering.
8. That screenshot caught a real bug: `formatDateTime` rendered "03:40 PM", 12-hour with
   locale-default AM/PM, against the spec's own 24-hour example ("14:32 today"). Fixed with
   `hour12: false`, added a test pinning it, rebuilt, re-screenshotted, confirmed "15:40".

**Why it was done this way**
- Checking `run-messy`'s actual gate variety against the task's description before building
  anything is the same instinct as checking a spec against reality generally: a claim about
  the data is itself a claim that needs a source, the same as anything that ends up on
  screen.
- The Disclosure keyboard test is deliberately honest about a tooling limitation instead of
  either skipping keyboard coverage entirely or writing an assertion that happens to pass for
  the wrong reason. A test that can't prove what it claims to prove is worse than no test,
  because it looks like coverage that isn't there.
- Screenshotting mattered more than usual here: the 24-hour bug was invisible to `tsc`,
  `eslint`, and every unit test, because none of them rendered the actual formatted string
  next to the spec's own example — they only checked internal logic in isolation. Reading
  the code again would not have caught it either; the code was doing exactly what it said,
  in a locale that happened not to be UTC/24-hour-default in this environment.

**How to do this by hand**
Read the fixture(s) a task names before trusting a claim about what they contain. When a
component needs to derive text that isn't a distinct field in the data model (a "reason", an
"explanation"), look for how the *existing* fixtures actually encode that information before
inventing a new field — in this codebase that meant re-reading `run-blocked.ts` and
`run-messy.ts`'s timeline `detail` strings. For any component built on a native HTML element
with implicit behaviour (here, `<details>`/`<summary>`'s keyboard activation), check what the
test environment actually simulates before writing the test, the same way you'd check a
browser's real behaviour — `jsdom`'s DOM implementation is not the same thing as a browser's
default-action handling. After a Storybook build succeeds, actually render at least one story
of anything with computed/formatted text and look at it — a passing build only proves the
code ran, not that what it produced is correct.

**Verification**
`npm run check` green after every commit (68 tests by the end, up from 27). `npx storybook
build` succeeded and was actually rendered: a static build served locally, screenshotted with
the environment's pre-installed global Playwright (no new project dependency) in both themes,
which is what surfaced the 24-hour clock bug — not the build succeeding, not `tsc`, not a
unit test. Contrast was not recomputed from scratch: every text usage in these components
uses `text-text-primary`/`text-text-secondary` (already verified in the design-system
session), and every status colour is used only as an icon or a border, never as text, per
`docs/DECISIONS.md` 0006 — so no new colour/text pairing was introduced that the earlier
computation doesn't already cover.

**Open questions / next**
- No automated accessibility check runs yet (`@storybook/addon-a11y`'s `test: 'error'` only
  takes effect through Storybook's own test runner or interactive mode, neither of which is
  wired into `npm run check`). Verification here was a real screenshot plus the structural
  guarantee that status colour never touches text — worth an actual `axe`-driven check once
  more components exist to justify the tooling.
- `PolicyGateList`/`PolicyGateRow` are presentational only, as asked — nothing composes them
  into a page yet, and there is no `RunReviewPage.tsx` to give the region its `<h2>Policy
  checks</h2>` heading. Next per `AGENTS.md`: plan that composition, or the next region
  (Timeline, which can reuse `Disclosure`).


### 2026-09-19 · Design system foundation: fonts, full colour palette, usage rules

**Goal**
Replace the scaffold session's placeholder colour tokens with the real palette (exact hex
values given, both themes), add the two typefaces, encode the three brand/status usage rules,
document all of it in Storybook, and verify contrast before finishing. No components.

**What changed**
- `src/styles/tokens.css` — full replacement of the primitive and semantic colour layers,
  plus `--font-heading` / `--font-body`. `--radius-*` and `--motion-*` untouched.
- `index.html` and `.storybook/preview-head.html` — Google Fonts, requesting exactly the
  weights used (Raleway 500/600/700, Montserrat 400/500).
- `src/styles/index.css` — shadcn bridge updated for the new token names; `accent`/
  `accent-foreground` dropped from it entirely (see below).
- `src/styles/README.md` — the three usage rules, plus the contrast numbers and what they
  mean for how status/accent colours can be used.
- `src/styles/tokens.stories.tsx` — rewritten: full palette, a typography specimen, the
  spacing scale, and the usage rules, in both themes.
- `docs/DECISIONS.md` — four new entries (0007 down to 0005) for the judgment calls below.
- `src/lib/types.ts` — one unrelated Prettier reformat (a union type's line wrap) picked up
  by `prettier --write .` before committing; not otherwise touched.

**Steps, in order**
1. Computed the actual WCAG contrast ratio for every realistic pairing before writing
   anything — a small Node script (`docs/DECISIONS.md`, 0005), not left as scratch work
   claimed but not shown. This is what the rest of the session's colour decisions are built on.
2. Rewrote `tokens.css`: a 14-step neutral ramp (the exact greys given, several reused between
   themes on purpose — e.g. light `bg` and dark `text-primary` are the same hex), then brand
   and status primitives, then the semantic layer.
3. `index.html`: added the Google Fonts `<link>`, requesting only the weights specified.
4. `npx vite build`, then a throwaway probe component (`bg-primary`, `text-status-fail`,
   `font-heading`, etc.), to confirm every new utility actually resolves to its token rather
   than trusting the source. Deleted the probe immediately after.
5. Rewrote the shadcn bridge in `index.css`. Two decisions here, both logged: `accent`/
   `accent-foreground` dropped rather than repointed (0007), and `destructive-foreground`
   reuses `--color-primary-foreground` rather than a duplicate pair, since the fail colour
   needs the identical white-in-light/near-black-in-dark flip (checked, not assumed).
6. Wrote the usage rules and contrast findings into `src/styles/README.md`, then
   `docs/DECISIONS.md` for the two that are real trade-offs rather than just findings: status/
   accent colours are icon-and-border only, never literal text colour (0006) — several fail
   4.5:1 as text in light theme otherwise — and the contrast-by-computation method itself
   (0005), since it caught a real bug (see below).
7. Rewrote `tokens.stories.tsx`. Built the status swatches to match the usage rule as-built
   (icon + border in the status colour, label in `text-primary`) rather than just describing
   the rule in prose next to a swatch that violates it.
8. `npx storybook build` to a scratch directory; grepped the output for the new token values
   and confirmed the story registered. Fonts were missing from the built iframe on the first
   pass — Storybook's preview iframe is a separate document from `index.html`, so the app's
   `<link>` tags never reach it. Added `.storybook/preview-head.html` with the same tags,
   rebuilt, confirmed both font families now appear in the built `iframe.html`.
9. `npm run check`, then `npx prettier --check .` — flagged one unrelated file
   (`src/lib/types.ts`, a union type Prettier now wants unwrapped); `--write` on it since it
   was a no-content, mechanical fix, not something to leave failing `format:check`.

**Why it was done this way**
- The contrast numbers are what actually drove the design decisions, not the other way
  around: the usage rule that status/accent colours are icon-and-border-only exists *because*
  several of them measured under 4.5:1 as text, not as a rule decided first and checked after.
- The reference mockup already showed this resolved (status labels in the ordinary text
  colour, not the status colour) — the rule was implicit in the source material; writing it
  down in `DECISIONS.md` makes it a rule a future component can be checked against, not just
  a pattern to notice by looking at a picture.
- Dropping the shadcn `accent` bridge slot rather than quietly repointing it to a neutral
  surface: repointing it would make `bg-accent` resolve to *something* without anyone having
  decided that was right for the specific component using it — the same failure mode
  `AGENTS.md` already warns against for one-off values, just hidden behind an existing name.

**How to do this by hand**
Compute contrast with the standard WCAG formula (linearize each sRGB channel, luminance-
weighted sum, `(L_lighter + 0.05) / (L_darker + 0.05)`) for every text/background pairing that
will actually occur, not a full cross-product of every token against every other — check
`--color-bg` against text tokens, `--color-surface-raised` against text tokens, each status
colour against the neutral surfaces it will sit on, and a candidate foreground against any
brand colour meant to be used as a filled background. Where a value fails, decide whether the
right fix is a different value, a restriction on how it's used (this session's choice for
status/accent), or an accepted exception (disabled text, borders) — and write down which, and
why, rather than silently picking one.

**Verification**
`npm run check` green. `npx vite build` + a throwaway probe component confirmed every new
Tailwind utility resolves to its token (deleted after). `npx storybook build` confirmed the
rewritten tokens story registers and both fonts load in the built preview. Contrast: every
pairing computed exactly (not estimated) via the WCAG formula; results and the resulting
usage rule are in `src/styles/README.md`, "Contrast".

**Open questions / next**
- No component yet actually uses a status chip or an accent pill — the tokens story is the
  first real check that the icon-only-colour rule is buildable, not a component enforcing it.
  Worth a lint rule or a shared component (once one exists) rather than relying on review.
- `src/lib/format.ts` (still not built — see the previous entry) is where `RunStatus`/
  `GateResult` values will eventually need the exact labels from Content rules; nothing in
  this session's token work required it yet.


### 2026-09-19 · Data layer: src/lib/types.ts, the three fixtures, src/lib/api.ts

**Goal**
Implement the data model from `docs/spec-review-screen.md` as `src/lib/types.ts`, build the
three fixtures it calls for, and add `src/lib/api.ts` as the seam in front of them. No UI.

**What changed**
- `src/lib/types.ts` — `RunStatus`, `GateResult`, `PolicyGate`, `TimelineEvent`,
  `ConfidenceArea`, `Decision`, `Run` from the spec's Data model, plus `DecisionInput` (not in
  the spec, needed for `submitDecision`). Doc comments tie each `RunStatus`/`GateResult` value
  to its exact Content rules label.
- `docs/DECISIONS.md` — two new entries (0003, 0004) for the two places this work departed
  from copying the spec's interfaces literally.
- `src/fixtures/run-messy.ts`, `run-blocked.ts`, `run-clean.ts` (+ a test file each) and
  `src/fixtures/index.ts` (the `runs` barrel).
- `src/lib/api.ts` (+ test) — `getRun`, `submitDecision`, and four error classes.
- Commits: `8883d8d` (types), `a7991ea` (run-messy), `0b79baa` (run-blocked), `9a94cb2`
  (run-clean + barrel + a wording fix that landed across all three fixtures), `e99e204` (api).

**Steps, in order**
1. Read `docs/spec-review-screen.md` in full before writing anything, including the sections
   Berit had added since the last session (Scenarios, Content rules, Hierarchy, Acceptance
   criteria) — the task asked to align with Content rules specifically, so I needed the
   current file, not the one from the scaffold session.
2. Wrote `types.ts`. Two places the literal Data model section wasn't enough on its own:
   `submitDecision`'s input shape (not defined anywhere in the spec), and the undo window
   (described in three other sections of the same document, with no field for it anywhere).
   Wrote both up as `docs/DECISIONS.md` entries rather than silently extending the interface
   or silently ignoring the gap.
3. Built the fixtures in the requested order (messy, blocked, clean), each as one
   self-contained file — no shared gate-catalog module, since `fixtures/README.md` frames each
   one as a standalone example a reader might open on its own.
4. For each fixture, wrote a small test asserting every `evidenceIds` value resolves to a real
   timeline event id. Nothing else in the toolchain would catch a typo'd id, and the whole
   point of the evidence field is that it is trustworthy.
5. Caught two inconsistencies by re-reading my own fixtures against the rules I'd just applied,
   before running out the clock on the task: `run-clean`'s summary said "Two files changed"
   against three actual `file_change` events (fixed to three, then to "3" — see next point);
   and separately, realized "Two files changed" itself was copying Region 2's illustrative
   sentence rather than following Content rules' own explicit later instruction — "'3 files
   changed', not '3'" — which says digits, not words. Fixed all three fixtures' file/test-count
   sentences to digits in the same pass (`9a94cb2`), leaving "One check failed: `<name>`"-style
   sentences as word-form since those directly mirror Region 2's own phrasing rather than being
   a bare count.
6. Wrote `src/lib/api.ts` matching the sketch already in `lib/README.md` almost exactly
   (including its exact class name, `NotFoundError`, rather than one I'd have picked myself),
   plus what this task additionally asked for: `NetworkError`, `DecisionConflictError`,
   `ValidationError`, and the `delayMs`/`simulateNetworkError`/`simulateConflict` options.
7. Wrote `api.test.ts`. Found a real bug in the test design, not the code, while writing it: a
   test asserting "approving needs no written reason" would have been the only test in the file
   to leave `run-clean` with a recorded decision, which would have made two *other* tests
   (expecting `ValidationError` for a missing reason) get `DecisionConflictError` instead if
   vitest ever ran them in a different order than written. Deleted that test — the same
   assertion is already covered by the "records who and when" test on `run-blocked`, which
   never needed a reason in the first place — rather than leave a passing-but-order-dependent
   test in the suite.
8. `npm run check` after every file; `npx prettier --write` on each new/changed file before the
   final check in that step.

**Why it was done this way**
- Two deviations from the literal spec (`DecisionInput`, and no field for the undo window) are
  both logged in `DECISIONS.md` rather than either bolted on silently or left unresolved. This
  is exactly the situation `AGENTS.md`'s "If something in this file turns out to be wrong or
  unhelpful, say so and propose a change" line is for, just applied to the spec document
  instead of `AGENTS.md` itself — the right move for a genuine gap is to name it, not route
  around it.
- The Content rules "digit, not word" fix is a small thing that would have been easy to miss
  entirely (Region 2's own worked example uses the word form, and I had been treating it as the
  canonical phrasing to reuse). It only surfaced because a test's assertion depended on an exact
  digit substring match — a case where writing the test first, not after, caught a content bug
  the checklist-reading pass alone had missed.
- `run-messy`'s `acknowledgedGateIds` is empty despite approving a production release over two
  unresolved checks. This is not an oversight — Content rules' sign-off rule is written to
  cover only failed and waived gates — but it reads like a gap in the spec itself, and I did
  not feel it was mine to close by inventing an unknown-gate acknowledgment rule that isn't
  written down anywhere. Flagged in the run-messy commit message and again here.

**How to do this by hand**
Read the spec's Data model section and transcribe each interface as-is first; only then read
the rest of the document (Scenarios, Content rules, Hierarchy, Acceptance criteria) looking
specifically for anything the Data model section doesn't have a place for — an undo window, a
sign-off tick, a specific display label — and decide, for each one, whether it is a type-level
gap (needs a field or a whole new interface) or a display-level concern (belongs in a comment
or in `format.ts` later, not in the type itself). Build the fixtures in whatever order gives
the most awkward one first; writing the boring one (`run-clean`) first tends to hide exactly
the layout and content problems the awkward ones are supposed to expose. For each fixture,
manually walk every `evidenceIds` array against the `timeline` array and check that each id
resolves — this is exactly what the per-fixture tests now do automatically.

**Verification**
`npm run check` green after every one of the five commits (27 tests passing by the end, up
from 5). Each fixture has a test asserting internal consistency (evidence ids resolve, a
waiver names who and why, the one error is followed by its retry, gate results are what the
fixture claims). `api.test.ts` covers: not-found for an unknown id; a controllable delay via
fake timers, so the "slow response" path is proven without an actual multi-second test;
`getRun` returning a copy rather than a live reference; a successful decision persisting
across a subsequent `getRun`; a simulated network failure; a real conflict (via `run-messy`,
with no flag needed) and a simulated one (via `run-clean`); and the written-reason requirement
for `changes_requested` and `rejected` but not `approved`.

**Open questions / next**
- Whether `run-messy`'s empty `acknowledgedGateIds` (approving into production over two
  `unknown` gates with nothing to tick) should stay that way, or whether the sign-off rule in
  Content rules should be widened to cover `unknown` gates too — this is Berit's call, not
  mine to make unilaterally.
- `src/lib/format.ts` is documented in `lib/README.md` but still does not exist. The
  `RunStatus`/`GateResult` display labels this task added as doc comments in `types.ts` are
  the natural seed for it, once UI work actually needs them turned into runtime strings.
- No component, fixture consumer, or screen exists yet. Next task per `AGENTS.md`: plan the
  first piece of `src/features/run/` against this data layer.



**Goal**
Turn the empty repository plus its instructions and spec into a runnable toolchain: Vite,
React 19, TypeScript strict, Tailwind with tokens, shadcn/ui (init only), lucide-react,
Vitest + React Testing Library, Storybook, ESLint + Prettier, an `npm run check` script, and
the dependency-direction rule from `AGENTS.md` enforced as a lint rule rather than left as a
convention to remember. No screen was built; `src/app/App.tsx` is a placeholder shell.

**What changed**
- `package.json`, `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` +
  `tsconfig.storybook.json`, `vite.config.ts`, `vitest.setup.ts`, `index.html` — the toolchain.
- `src/main.tsx`, `src/app/App.tsx` (+ `App.test.tsx`) — the smallest real shell the toolchain
  could typecheck, lint and test against.
- `src/styles/tokens.css` — primitives and semantic tokens in two layers, light default, dark
  via `prefers-color-scheme` or `data-theme`, motion tokens respecting `prefers-reduced-motion`.
- `src/styles/index.css` — Tailwind entry, plus a bridge mapping shadcn's fixed names
  (`background`, `card`, `muted-foreground`, `border`, `ring`, …) onto the semantic tokens, so
  there is one palette rather than two.
- `components.json`, `src/lib/utils.ts` (+ test) — shadcn/ui wiring by hand (see below).
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore` — lint and format, with
  `import/no-restricted-paths` encoding `fixtures → lib → components → features → app`.
- `.storybook/main.ts`, `.storybook/preview.tsx`, `src/styles/tokens.stories.tsx` — Storybook,
  trimmed down from what its installer proposed (see below), plus a live tokens story.
- `README.md` — what this project is, how to run it, links to `STORY.md`,
  `docs/spec-review-screen.md` and `AGENTS.md`.
- Commits: `c96152b` (Vite/React/TS/Tailwind), `2964082` (shadcn/lucide wiring),
  `5fe9348` (ESLint/Prettier/check), `22deae7` (Storybook).

**Steps, in order**
1. `npm create vite@latest viteseed -- --template react-ts` in the scratchpad, to see the
   current template's defaults before committing to any of them by hand.
2. Wrote `package.json` and the three tsconfigs by hand rather than copying the template,
   setting `"strict": true` explicitly — the current Vite template does not set it, and
   `AGENTS.md` requires it.
3. Wrote `vite.config.ts` (with `@tailwindcss/vite` and the `@` alias), `vitest.setup.ts`
   (`@testing-library/jest-dom` + `cleanup()`), `index.html`, `src/main.tsx`,
   `src/app/App.tsx`, `src/app/App.test.tsx`.
4. `npm install react react-dom lucide-react`, then
   `npm install -D vite @vitejs/plugin-react typescript @types/node @types/react
   @types/react-dom tailwindcss @tailwindcss/vite`, then
   `npm install -D vitest jsdom @testing-library/react @testing-library/dom
   @testing-library/jest-dom @testing-library/user-event`.
5. `npm run typecheck` failed: TypeScript 7 removed `baseUrl` (`paths` now resolves relative
   to the tsconfig itself) — removed it from `tsconfig.app.json`.
6. Wrote `src/styles/tokens.css` and `src/styles/index.css`, `npm run build`, then grepped the
   built CSS for `color-status-pass-fg` and the dark-mode media query to confirm the tokens
   actually reached the output rather than trusting the source alone.
7. `npx shadcn@latest init` failed: `ui.shadcn.com` is blocked by this session's egress
   policy (403 on CONNECT, confirmed via the proxy status endpoint). Did the equivalent by
   hand: `npm install -D class-variance-authority clsx tailwind-merge tw-animate-css`, moved
   the three that ship in component code from `devDependencies` to `dependencies`, wrote
   `components.json` and `src/lib/utils.ts` (`cn()`) plus a unit test for it, and added the
   shadcn-name bridge to `src/styles/index.css`. Renamed our accent token to `--color-action`
   first — shadcn's "accent" means a quiet hover surface, ours meant brand blue, and one name
   cannot mean both. Verified the bridge with a throwaway probe component using
   `bg-background`, `text-muted-foreground`, etc., grepped the built CSS to confirm each
   resolved to our token, then deleted the probe. Left a note in `index.css` that the mapping
   is unverified against a real shadcn-generated component, since none could be added.
8. `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
   eslint-plugin-react-refresh eslint-plugin-import eslint-import-resolver-typescript
   prettier eslint-config-prettier globals` failed on peer conflicts twice: `typescript-eslint`
   does not yet support TypeScript 7 (peer range `>=4.8.4 <6.1.0`), and `eslint-plugin-import`
   does not yet support ESLint 10. Pinned `typescript@~5.9.0` and `eslint@^9` and reinstalled.
9. Wrote `eslint.config.js`: typescript-eslint's `recommendedTypeChecked`, react-hooks,
   react-refresh, `eslint-plugin-import`'s recommended config, and
   `import/no-restricted-paths` with one zone per rule in `AGENTS.md`'s dependency direction.
   Worked through three real errors along the way: `eslint.config.js` itself needed
   `disableTypeChecked` (it is plain JS with no tsconfig of its own); the `import/resolver`
   settings had to live in a global block, not one scoped to `**/*.{ts,tsx}`, because
   `import/no-unresolved` from the recommended config applies to every file including that
   same `eslint.config.js`; and the multiple-tsconfig performance warning needed
   `noWarnOnMultipleProjects: true` on the resolver, not a typescript-eslint option.
10. Proved the dependency-direction rule actually fires, rather than trusting the config:
    added a throwaway `src/lib/_violation-check.ts` importing from `src/components/`, ran
    `npx eslint` on it, watched `import/no-restricted-paths` catch it with the exact message
    from `AGENTS.md`, then deleted both temporary files immediately.
11. `.prettierrc.json`, `.prettierignore`, `npx prettier --check .` — flagged
    `docs/spec-review-screen.md` and `src/features/run/README.md` from the earlier commit.
    Diffed what `--write` would do to them (quote style, and reflowing the TypeScript inside
    their code fences) and confirmed it would break "byte for byte, do not reformat" from that
    commit, so added every hand-authored spec/instruction file to `.prettierignore` by name
    instead of running Prettier over them.
12. Added `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `check` scripts;
    `npm run check` green.
13. `npx storybook@latest init --type react --builder vite` — it also proposed
    `@chromatic-com/storybook`, `@storybook/addon-mcp`, and `@storybook/addon-vitest` (which
    pulled in Playwright, `@vitest/browser-playwright`, `@vitest/coverage-v8`, and rewrote
    `vite.config.ts` into a projects workspace). None of that was asked for, and the vitest
    addon duplicates work `AGENTS.md` reserves for a separate Playwright end-to-end setup.
    `npm uninstall` the four packages plus `playwright`, restored `vite.config.ts` and
    `eslint.config.js` to hand-written form, deleted the canned demo stories in `src/stories/`.
14. `.storybook/main.ts` down to `addon-a11y` and `addon-docs`; set `a11y.test = 'error'` in
    `.storybook/preview.tsx` so a violation fails the story rather than only flagging it.
15. `.storybook/preview.tsx` and `.storybook/main.ts` needed a real tsconfig — the
    `allowDefaultProject` fallback used for `eslint.config.js` only covers plain JS, and these
    are typed against `@storybook/react-vite`. Added `tsconfig.storybook.json`, referenced it
    from the root `tsconfig.json`, and added it to the ESLint import resolver's project list.
16. Wrote `src/styles/tokens.stories.tsx`: not a component, a live rendering of the status and
    surface tokens, with a `theme` toolbar global and a decorator that sets
    `document.documentElement.dataset.theme`, so Light and Dark are two real story variants
    rather than a screenshot of the CSS.
17. `npm run check` and `npx storybook build` to a scratch directory; grepped the built CSS
    for `color-status-pass-fg` and the built `index.json` for the story's title to confirm the
    tokens and the story both actually landed, not just that the build exited zero.
18. Wrote the root `README.md`.

**Why it was done this way**
- TypeScript strict, ESLint's dependency-direction rule, and the shadcn/token bridge are all
  cases of turning a sentence in `AGENTS.md` into something a tool checks, rather than
  something to remember. That is the whole point of `import/no-restricted-paths`: a future
  session (agent or human) importing the wrong way gets a lint error naming the exact rule in
  `AGENTS.md`, not a silent architectural drift discovered months later.
- Every one of the version pins (TypeScript 5.9, ESLint 9) and the by-hand shadcn init came
  from a real, reproduced failure — not a guess at what might be safest. Each is logged above
  with what broke and what the fix was, so a future upgrade attempt has something concrete to
  retry against instead of rediscovering the same peer conflict.
- Storybook's installer proposing a hosted SaaS integration, an MCP addon, and a second test
  runner by default is worth knowing about, not just quietly working around: `AGENTS.md` says
  "ask before adding a dependency," and a generator adding six is the same decision made for
  you. Trimming it back to the three tools actually asked for was the judgment call; the
  removal is recorded here rather than left to be discovered later as an unexplained gap
  between what a fresh `storybook init` would produce and what this repo has.

**How to do this by hand**
Run `npm create vite@latest -- --template react-ts` for the shape of a Vite + React + TS
project, then rewrite `tsconfig.app.json` to add `"strict": true` and the `@/*` path alias.
Add Tailwind via `npm install tailwindcss @tailwindcss/vite`, add the plugin to
`vite.config.ts`, and write `tokens.css` as two layers (primitives as plain custom
properties, semantic tokens inside `@theme`) rather than reaching for arbitrary Tailwind
colors. For shadcn/ui without network access to its registry: install
`class-variance-authority`, `clsx`, `tailwind-merge` as real dependencies, write a `cn()`
helper, and write `components.json` by hand referencing the same file paths. For the
dependency-direction rule, read `eslint-plugin-import`'s `no-restricted-paths` docs and write
one `zones` entry per arrow in `AGENTS.md`'s "Dependencies point one way" sentence, then
prove each one by writing a small file that violates it and confirming the linter refuses it,
the same way tests prove code by trying to break it.

**Verification**
`npm run check` (typecheck + lint + test) green at every commit in this session.
`npm run build` and `npx storybook build` both succeed. Grepped built output (not just source)
to confirm design tokens and the dependency-direction rule are real: the built app CSS
contains the status tokens and the dark-theme media query; a deliberately-violating import was
caught by name and message; the Storybook build's CSS and `index.json` contain the tokens and
the new story respectively. `npx prettier --check .` and `npx eslint .` both clean.

**Open questions / next**
- `ui.shadcn.com` is blocked by this session's network policy, so the shadcn/ui → token bridge
  in `src/styles/index.css` has never been checked against an actual generated component —
  only against a throwaway probe using the same class names. Worth a real check (e.g. adding
  `button` or `badge`) the first time network access allows it, or by hand-porting one
  component's source from the shadcn docs.
- TypeScript is pinned to `~5.9.0` (not 7) because `typescript-eslint` doesn't support 7 yet;
  ESLint is pinned to `^9` (not 10) because `eslint-plugin-import` doesn't support 10 yet.
  Worth revisiting both pins once upstream catches up.
- `PROJECT-SETUP.md`, which this task's instructions said to delete, does not exist anywhere
  in the repository or its git history — nothing was deleted, since there was nothing to
  delete.
- No real component, fixture, or screen exists yet. Next task per `AGENTS.md`: plan the first
  piece of `src/features/run/` (or the fixtures it depends on) and get it accepted before
  building.

