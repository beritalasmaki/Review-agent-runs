import type { TourFinish, TourStep } from '../../components/OnboardingTour'

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
    id: 'list-overview',
    selector: '[data-tour="list-page"]',
    title: 'Your review list',
    body: 'This is the review preview page. Here you see the list of agent runs that need your review.',
    side: 'bottom',
    overview: true,
  },
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
    body: 'Search by name or reference, or filter by who requested it.',
    side: 'bottom',
  },
  {
    id: 'first-run-row',
    selector: '[data-tour="first-run-row"]',
    title: 'Open a run to review it',
    body: 'Select Review on a pending run to see what the agent did, what was checked, and to make your decision.',
    side: 'top',
  },
  {
    id: 'archive-button',
    selector: '[data-tour="archive-button"]',
    title: 'Nothing is ever deleted',
    body: 'Approved and declined runs move to the archive automatically. The record there never changes.',
    side: 'bottom',
    // The last stop on this page: carry on to a run, where the tour goes on.
    nextLabel: 'Open a run',
    onNext: () =>
      document.querySelector<HTMLAnchorElement>('[data-tour="first-run-row"] a[href]')?.click(),
  },
]

/** Leg 2, shown on a run's review page — only reached by continuing from Leg 1. */
export const RUN_TOUR_STEPS: TourStep[] = [
  {
    id: 'run-page-overview',
    selector: '[data-tour="run-page"]',
    title: 'One run on one page',
    body: 'This is the review page for a single run. It shows what the agent did and lets you decide. First a quick look at the whole page, then the details.',
    side: 'bottom',
    overview: true,
  },
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

/** The whole tour's length, so each leg can say "Step 7 of 10". */
export const TOUR_TOTAL_STEPS = LIST_TOUR_STEPS.length + RUN_TOUR_STEPS.length

/** The card after the last step. */
export const TOUR_FINISH: TourFinish = {
  label: 'Tour complete',
  title: 'You are ready to review',
  body: 'Pick a pending run, read what the agent did, then decide. Every decision is recorded with your name, and it can be undone for a short time.',
  startLabel: 'Start reviewing',
  replayLabel: 'Replay tour',
}
