👀 View the screen: https://demo-t-example.vercel.app/

☝️ See the [design folder](./design) for the mockups and how the page got here.

☝️ A published Storybook is coming soon.

# Review agent runs

An AI agent has made a change to a customer's software. Before that change is released, a
person has to understand what the agent did, see which checks passed or failed, judge how sure
the agent was and why, and then approve, ask for changes, or reject. This repository
(`demo-t-example`) is that one review screen.

It is a portfolio piece built to the standard of a real product surface, not a mockup. It is
not affiliated with any company, and every run in it is fictional.

## What the screen does

- **Top bar:** "Review agent runs", a breadcrumb back to _My reviews_, and, before a decision,
  how many things are left to solve, with a link that jumps to them and briefly spotlights
  them. The browser tab's icon gets an amber dot while there are things to solve.
- **Three columns:**
  - **Run details** on the left: where the change would go, what would be released, who
    asked, which agent, when, the check results and the lowest score. Every id has a plain
    line under it.
  - **The run itself** in the middle, under an overview card. It has three views:
    - **Story:** what the agent did, in order, in plain sentences, with the checks and
      scores where they happened.
    - **Evidence:** every file, test and check the page's claims rest on.
    - **All steps:** the full record, one row per step.
  - **The decision** on the right.
- **The decision:**
  - Tick each open item to say you have seen it. Each one links to where it is shown in
    full.
  - A reason is required to approve when a check failed or did not run.
  - Then _Approve and release_, _Request changes_ or _Reject run_, each confirmed in a
    dialog.
  - A run the agent or the checks are still working on offers no decision yet, only a note
    on what happens next.
  - A decision can be undone for 10 minutes. The page then shows what the approval accepted
    as unverified.
- **My reviews:** every run assigned to the reviewer, in tabs by run type:
  - search, filters and sortable columns;
  - the runs still in progress, folded below the table;
  - a Decision details dialog on every row;
  - selected runs can go into a report (CSV, or PDF through the browser's print dialog) or
    to the Archive, where they can be restored for seven days;
  - a finished run can ask for a new run to fix a mistake. The old record never changes.
- **Around it:** a short welcome intro once per visit (skipped for reduced motion, or on any
  key or click), a loading state, and "not found" and error states.

Nothing on the page is decided by the interface. Every number and status comes from the run's
data and links to its evidence, and anything unknown says "unknown". The rules behind this are
in [`AGENTS.md`](./AGENTS.md).

Light and dark themes both work, switched from the top of the page (or following the system
setting until you choose), the whole page works from the keyboard, status is never shown
by colour alone, and motion respects `prefers-reduced-motion`.

## Try it

The app opens on a run awaiting review. Other states are one URL away:

| URL                 | What it shows                                                           |
| ------------------- | ----------------------------------------------------------------------- |
| `/`                 | `run-messy-pending`: checks that did not run, a low score, an open note |
| `/?run=run-clean`   | everything passed; nothing to solve                                     |
| `/?run=run-blocked` | a failed check, an exception, and an error and retry in the steps       |
| `/?run=run-messy`   | the same run as `/`, already approved, inside its undo window           |
| `/?view=reviews`    | _My reviews_: tabs, search, filters, archive and reports                |
| `/?delay=3000`      | any of the above, with the load slowed down to show the loading state   |

There is no backend. Runs are typed fixtures in `src/fixtures/`, served through `getRun()` in
`src/lib/api.ts`, so a real API can replace them without touching the interface. Decisions and
undos last for the browser tab: they hold across pages and reloads, and a new tab starts
every run over.

## Stack

- React 19 and TypeScript (strict), built with Vite
- Tailwind CSS 4, with every colour, space, size and motion value from design tokens in
  `src/styles/tokens.css`
- shadcn/ui for every control (on Radix UI, with Sonner for the toast), restyled onto the
  design tokens; lucide-react (icons), `thinking-orbs` (the loading orb)
- Vitest and React Testing Library: 47 test files, 274 tests
- Storybook 10, with the accessibility add-on, for components and tokens
- Playwright: three end-to-end specs in `e2e/` (the approve flow and a decline after an
  undo, keyboard-only runs of the review and of My reviews, and axe WCAG A/AA and contrast
  checks in both themes; 35 tests in all), and the theme-colour check

Dependencies point one way, `fixtures → lib → components → features → app`, and a lint rule
(`import/no-restricted-paths`) enforces it. `components/` and `styles/` are the design system
and know nothing about agent runs.

## Running it

Needs Node.js 20.19 or newer (22.12 or newer on the 22 line).

```bash
npm install
npx playwright install chromium   # once: npm run check uses it for the end-to-end and theme checks

npm run dev              # start the app
npm run storybook        # start Storybook, on components and design tokens

npm run check            # the gate for any change: typecheck, lint, format, theme and locale checks, tests, end-to-end
npm run test:e2e         # the Playwright specs alone (starts the app itself)
npm run test:watch       # tests, watching
npm run lint:fix         # eslint --fix
npm run format           # prettier --write

npm run build             # production build of the app
npm run build-storybook   # static Storybook build
```

## Where things are written down

- **Why this exists:** [`STORY.md`](./STORY.md)
- **What is being built:** [`docs/spec-review-screen.md`](./docs/spec-review-screen.md)
- **The rules the repository is built to** (stack, structure, dependency direction, design
  system, definition of done): [`AGENTS.md`](./AGENTS.md)
- **Every choice with a trade-off**, 70 so far: [`docs/DECISIONS.md`](./docs/DECISIONS.md)
- **What was done in each work session:** [`docs/WORKLOG.md`](./docs/WORKLOG.md)
- **What belongs in each folder:** the `README.md` in each folder under `src/`

## Status

The review screen is built. It follows the redesign from Claude Design, with its later
iterations: the three-column layout, the Story, Evidence and All steps views, the decision
panel with undo, the welcome intro and the loading state. My reviews is built to its own
Claude Design handoff (DECISIONS 0060). A polish pass and a cleanup have removed the code the
redesign left behind.

The end-to-end approve flow is a committed Playwright spec. The end-of-project accessibility
review was done as a lighter, time-boxed pass, not a full audit: automated WCAG A/AA and
contrast checks in both themes, and a keyboard-only pass of the whole review. Both now run on
every `npm run check`. What that pass did not cover is listed in
[DECISIONS 0059](./docs/DECISIONS.md).

Still to do:

- publish Storybook
