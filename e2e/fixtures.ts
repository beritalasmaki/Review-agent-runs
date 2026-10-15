import { test as base } from '@playwright/test'

/**
 * Every spec starts past the welcome intro and the onboarding tour: both play once per visit
 * (docs/DECISIONS.md, 0049, 0078) and would sit over the page otherwise. Same flags the app
 * sets. `e2e/onboarding-tour.spec.ts` is the one spec that clears these to test the tour
 * itself.
 */
export const test = base.extend({
  // The second argument is Playwright's `use`, renamed: the React hooks lint rule reads any
  // call to `use` as a React hook.
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('ledger:intro-seen', '1')
      sessionStorage.setItem('ledger:tour-seen', '1')
    })
    await provide(page)
  },
})

export { expect } from '@playwright/test'
