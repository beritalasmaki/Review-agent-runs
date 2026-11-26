import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/**
 * The onboarding tour (docs/DECISIONS.md, 0078, 0079): the welcome modal, right after the
 * intro, offers it; only "Take the tour" opens Leg 1 over My reviews, continuing onto a run
 * page (Leg 2) once the visitor opens one, both once per visit. Every other spec bypasses all
 * of this (e2e/fixtures.ts); this one clears just that bypass to exercise it. The
 * accessibility/contrast check for the welcome modal and the tour's first step lives in
 * e2e/accessibility.spec.ts, beside every other page state.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('ledger:tour-seen'))
})

/** Loads the home page and clicks through the welcome modal's "Take the tour", landing on
 * Leg 1's first step. */
async function startTour(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Take the tour' }).click()
  await expect(page.getByText('Step 1 of 10')).toBeVisible()
}

test('the welcome modal offers the tour, and Skip closes it without opening the tour', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome to Review agent runs' })).toBeVisible()
  await page.getByRole('button', { name: /^Skip/ }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to Review agent runs' })).toHaveCount(0)
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)
  // Remembering the choice across a reload is the same sessionStorage write the "Leg 1 ->
  // Leg 2" test below already proves survives one — not re-checked here, since this spec's own
  // beforeEach clears the bypass flag before every navigation, reload included, which would
  // undo a real "seen" write and falsely fail this one specific gate.
})

test('Leg 1 walks My reviews, "Open a run" carries on to Leg 2, and the tour ends on a closing card', async ({
  page,
}) => {
  await startTour(page)
  await expect(page.getByRole('heading', { name: 'Your review list' })).toBeVisible()

  for (const title of [
    'What needs you',
    'Pending, decided, or all of them',
    'Find a specific run',
    'Open a run to review it',
    'Nothing is ever deleted',
  ]) {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Step 6 of 10')).toBeVisible()

  // The last stop on this page opens the first pending run, where the tour goes on.
  await page.getByRole('button', { name: 'Open a run' }).click()
  await expect(page).toHaveURL(/\?run=/)

  // Leg 2 continues automatically on the run page — no welcome modal here, it already asked.
  await expect(page.getByRole('heading', { name: 'One run on one page' })).toBeVisible()
  await expect(page.getByText('Step 7 of 10')).toBeVisible()
  for (const title of ['What this run is', 'Three ways to read it', 'Your decision']) {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Step 10 of 10')).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('heading', { name: 'You are ready to review' })).toBeVisible()
  await page.getByRole('button', { name: 'Start reviewing' }).click()
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)

  // The whole tour is seen now: reloading the run page does not replay it.
  await page.reload()
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)
})

test('"Replay tour" on the closing card starts the tour again from My reviews', async ({
  page,
}) => {
  await startTour(page)
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Open a run' }).click()
  await expect(page.getByText('Step 7 of 10')).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByRole('button', { name: 'Replay tour' }).click()
  await expect(page).not.toHaveURL(/\?run=/)
  await expect(page.getByText('Step 1 of 10')).toBeVisible()
})

test('Skip tour on Leg 1 ends the tour outright, without continuing onto a run', async ({
  page,
}) => {
  await startTour(page)
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)

  await page
    .getByRole('link', { name: /^Review / })
    .first()
    .click()
  await expect(page).toHaveURL(/\?run=/)
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)
})

test('Escape dismisses the tour from any step, and it does not return on reload', async ({
  page,
}) => {
  await startTour(page)
  await page.keyboard.press('Escape')
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(/Step \d+ of 10/)).toHaveCount(0)
})

test("Tab stays within the step bubble's own Back, Skip and Next controls", async ({ page }) => {
  await startTour(page)
  await page.getByRole('button', { name: 'Next' }).click() // step 2: Back, Skip tour, Next
  await page.getByRole('button', { name: 'Next' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Skip tour' })).toBeFocused()
})
