# Review profile: React + TypeScript + Vite (demo-t-example)

Checks the `code-reviewer` agent applies on top of its universal categories, for this
repository's stack: React 19, TypeScript strict, Vite, Tailwind CSS 4, shadcn/ui on Radix,
Vitest + React Testing Library, Playwright, Storybook. Each check points at the rule it
comes from, so a finding can cite it.

## React

- Hooks follow the rules of hooks; effect dependency arrays are complete and not silenced
  with `eslint-disable`.
- Effects that add listeners, timers or animations clean them up on unmount.
- No state derived from props that could be computed during render instead.
- Lists have stable keys (an id, not the index) when items can move or change.
- Focus moves on purpose after a view change or dialog close, and returns where it was
  (AGENTS.md, DECISIONS 0044).

## TypeScript

- No `any`, `as unknown as`, non-null `!` on values that can really be missing, or
  `@ts-ignore` / `@ts-expect-error` added to get a build through.
- Types for runs, gates, timeline and decisions come from `src/lib/types.ts`; no parallel
  copies.

## Structure and design system

- Imports respect the dependency direction (AGENTS.md, Structure).
- New files sit in the folder their README says they belong in, and that README is updated
  if the rule changed.
- Colours, spacing, radius, type and motion only from tokens; no raw hex, no arbitrary
  Tailwind values like `p-[13px]` or `text-[#333]` (AGENTS.md, Design system rules).
- Controls use `src/components/ui/` (shadcn); a new control is added as a shadcn component
  first (DECISIONS 0070).

## Accessibility (non-negotiable 4)

- Every interactive element is reachable and usable by keyboard, with a visible focus ring.
- Status always has icon + text, never colour alone.
- Motion respects `prefers-reduced-motion`; motion is functional, not decorative.
- A new page state is added to `e2e/accessibility.spec.ts` so axe runs on it in both themes.

## Content and data

- Labels match the spec's content rules exactly (status names, button labels, "Not run").
- No invented numbers or statuses: every value on screen traces to fixture data, and
  unknown values render as unknown.
- Sample data stays fictional: no real companies, people or products.

## Tests

- Changed `lib/` functions have Vitest tests, including the empty, missing and failing cases.
- Component tests query by role and accessible name, not by class or test id where a role
  exists.
- New components have a Storybook story covering their states.

## Checks to run

`npm run check` runs typecheck, lint, format check, the theme-bridge and locale checks,
unit tests and the Playwright specs. If Playwright's browser is missing, run the steps
before `test:e2e` on their own and say the end-to-end specs were not run.
