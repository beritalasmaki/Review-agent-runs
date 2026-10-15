import { expect, test } from './fixtures'

/**
 * The onboarding tour (docs/DECISIONS.md, 0078): Leg 1 over My reviews, Leg 2 continuing onto
 * a run page once the visitor opens one, both once per visit. Every other spec bypasses it
 * (e2e/fixtures.ts); this one clears just that bypass to exercise the tour itself. The
 * accessibility/contrast check for its first step lives in e2e/accessibility.spec.ts, beside
 * every other page state.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('ledger:tour-seen'))
})

test('Leg 1 walks My reviews, and clicking the spotlighted row continues Leg 2 on the run it opens', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'What needs you' })).toBeVisible()
  await expect(page.getByText('Step 1 of 5')).toBeVisible()

  for (const title of [
    'Pending, decided, or all of them',
    'Find a specific run',
    'Open a run to review it',
  ]) {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Step 4 of 5')).toBeVisible()

  // The spotlighted row stays genuinely clickable through the cutout — the whole point of
  // this step. The tour overlay does not block the click.
  await page
    .getByRole('link', { name: /^Review / })
    .first()
    .click()
  await expect(page).toHaveURL(/\?run=/)

  // Leg 2 continues automatically on the run page.
  await expect(page.getByRole('heading', { name: 'What this run is' })).toBeVisible()
  await expect(page.getByText('Step 1 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByText(/Step \d of 3/)).toHaveCount(0)

  // The whole tour is seen now: reloading the run page does not replay Leg 2.
  await page.reload()
  await expect(page.getByText(/Step \d of 3/)).toHaveCount(0)
})

test('Skip tour on Leg 1 ends the tour outright, without continuing onto a run', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Step 1 of 5')).toBeVisible()
  await page.getByRole('button', { name: 'Skip tour' }).click()
  await expect(page.getByText(/Step \d of 5/)).toHaveCount(0)

  await page
    .getByRole('link', { name: /^Review / })
    .first()
    .click()
  await expect(page).toHaveURL(/\?run=/)
  await expect(page.getByText(/Step \d of 3/)).toHaveCount(0)
})

test('Escape dismisses the tour from any step, and it does not return on reload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Step 1 of 5')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText(/Step \d of 5/)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(/Step \d of 5/)).toHaveCount(0)
})

test("Tab stays within the step bubble's own Back, Skip and Next controls", async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Next' }).click() // step 2: Back, Skip tour, Next
  await page.getByRole('button', { name: 'Next' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Back' })).toBeFocused()
})
