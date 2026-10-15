# app

Page level: routing, layout, and anything that applies to the whole application — theme,
providers, top-level error handling.

Few files, all short. If you find yourself writing view logic here, it belongs in
`features/`. If you find yourself writing a reusable UI element here, it belongs in
`components/`.

## Files

- `App.tsx` — reads `?run=` and `?delay=<ms>`. No `?run=` is the home page, "My reviews"; `?run=
  <id>` is that run's review. Lays the welcome intro over the home page only, once per visit,
  then the onboarding tour: Leg 1 over the home page once the intro is done, Leg 2 over a run
  page if the visitor continues into one.
- `WelcomeIntro.tsx`, `intro.ts`, `intro.css`, `SignatureMark.tsx` — the welcome intro, once per
  visit, over the home page only (docs/DECISIONS.md, 0048, 0049, 0071). `intro.ts` holds the
  visit flag (`ledger:intro-seen`, in sessionStorage) and the
  timings. `SignatureMark.tsx` holds the supplied signature path, unchanged.
- `tour.ts` — the onboarding tour's sequencing (docs/DECISIONS.md, 0078; the tour component
  itself is `components/OnboardingTour.tsx`, its copy `features/run/tourSteps.ts`). Once per
  visit, the same way `intro.ts` is: `ledger:tour-seen` in sessionStorage. `ledger:tour-leg`
  carries "Leg 1 finished, show Leg 2 next" across a run page's full page load — there is no
  client router, so React state alone cannot survive that navigation.
