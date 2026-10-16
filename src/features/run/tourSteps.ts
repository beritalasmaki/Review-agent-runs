import type { TourStep } from '../../components/OnboardingTour'

/**
 * The onboarding tour's two legs (docs/DECISIONS.md, 0078): what each step points at, and its
 * copy, written to `docs/spec-review-screen.md`'s voice rules — short sentences, plain words,
 * no exclamation marks. The targets are `data-tour="…"` attributes on `MyReviews.tsx` and
 * `RunReviewPage.tsx`, kept apart from this file's product-specific copy so the tour engine
 * itself (`components/OnboardingTour.tsx`) stays product-agnostic.
 */

/** Leg 1, shown on My reviews (the home page), in page order. */
export const LIST_TOUR_STEPS: TourStep[] = [
  {
    id: 'needs-review-badge',
    selector: '[data-tour="needs-review-badge"]',
    title: 'What needs you',
    body: 'This counts the runs waiting on your decision. Everything else can wait.',
    side: 'bottom',
  },
  {
    id: 'run-tabs',
    selector: '[data-tour="run-tabs"]',
    title: 'Pending, decided, or all of them',
    body: 'Switch between runs by status. Pending is what needs a decision; the rest is your history.',
    side: 'bottom',
  },
  {
    id: 'search-filters',
    selector: '[data-tour="search-filters"]',
    title: 'Find a specific run',
    body: 'Search by name or reference, or filter by time range and who requested it.',
    side: 'bottom',
  },
  {
    id: 'first-run-row',
    selector: '[data-tour="first-run-row"]',
    title: 'Open a run to review it',
    body: 'Click any row to see the full review: what the agent did, what was checked, and your decision.',
    side: 'top',
  },
  {
    id: 'archive-button',
    selector: '[data-tour="archive-button"]',
    title: 'Nothing is ever deleted',
    body: 'Approved and declined runs move to the archive automatically. The record there never changes.',
    side: 'bottom',
  },
]

/** Leg 2, shown on a run's review page — only reached by continuing from Leg 1. */
export const RUN_TOUR_STEPS: TourStep[] = [
  {
    id: 'run-overview',
    selector: '[data-tour="run-overview"]',
    title: 'What this run is',
    body: 'The status, what changed, why the agent was asked, and where things stand now.',
    side: 'bottom',
  },
  {
    id: 'run-tabs-view',
    selector: '[data-tour="run-tabs-view"]',
    title: 'Three ways to read it',
    body: 'Story is the plain-language version. Evidence is what it is based on. All steps is the full audit log.',
    side: 'bottom',
  },
  {
    id: 'decision-panel',
    selector: '[data-tour="decision-panel"]',
    title: 'Your decision',
    body: 'Confirm each open item, then approve, request changes, or reject. Every decision is recorded and reversible for a short window.',
    side: 'left',
  },
]
