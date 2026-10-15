# app

Page level: routing, layout, and anything that applies to the whole application — theme,
providers, top-level error handling.

Few files, all short. If you find yourself writing view logic here, it belongs in
`features/`. If you find yourself writing a reusable UI element here, it belongs in
`components/`.

## Files

- `App.tsx` — reads `?run=` and `?delay=<ms>`. No `?run=` is the home page, "My reviews"; `?run=
  <id>` is that run's review. Lays the welcome intro over the home page only, once per visit;
  once the intro is done, the welcome modal asks directly whether to take the onboarding tour;
  only "Take the tour" opens Leg 1 over the home page, continuing as Leg 2 over a run page if
  the visitor opens one.
- `WelcomeIntro.tsx`, `intro.ts`, `intro.css`, `SignatureMark.tsx` — the welcome intro, once per
  visit, over the home page only (docs/DECISIONS.md, 0048, 0049, 0071). `intro.ts` holds the
  visit flag (`ledger:intro-seen`, in sessionStorage) and the
  timings. `SignatureMark.tsx` holds the supplied signature path, unchanged.
- `WelcomeModal.tsx` — what the product is and why it exists, and the explicit choice to take
  the onboarding tour or skip it (docs/DECISIONS.md, 0079). Built on `components/Modal.tsx`,
  the same as any other confirmation dialog in the app; lives here, not `components/`, because
  its copy is specific to this product.
- `tour.ts` — the onboarding tour's sequencing (docs/DECISIONS.md, 0078, 0079; the tour
  component itself is `components/OnboardingTour.tsx`, its copy `features/run/tourSteps.ts`).
  Once per visit, the same way `intro.ts` is: `ledger:tour-seen` in sessionStorage, gating both
  the welcome modal and the tour together — skipping the modal marks the tour seen outright, the
  same as skipping the tour itself. `ledger:tour-leg` carries "Leg 1 finished, show Leg 2 next"
  across a run page's full page load — there is no client router, so React state alone cannot
  survive that navigation.
