import { expect, test } from './fixtures'

/**
 * The one end-to-end path AGENTS.md plans for: a reviewer loads a run, looks at a check that
 * did not run, ticks every open item, gives a reason, approves, sees the undo window, and
 * undoes. Written from the ad hoc browser checks this project ran by hand along the way.
 */
test('review a run, approve it, and undo inside the window', async ({ page }) => {
  await page.goto('/?run=run-messy-pending')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Move refund processing to the new payment gateway',
    }),
  ).toBeVisible()
  await expect(page.getByText('3 things to solve')).toBeVisible()

  // Approving is blocked until every open item is ticked and a reason is written (0040).
  const approve = page.getByRole('button', { name: 'Approve and release' })
  await expect(approve).toBeDisabled()

  // Review a check: its link opens the Story on that check's card, focused (0055).
  await page.getByRole('button', { name: 'Show the checks →' }).click()
  const licensing = page.locator('#check-licensing')
  await expect(licensing).toBeFocused()
  await expect(licensing).toContainText('Open-source licensing — did not run.')

  // Sign off every open item, then give the required reason.
  // The native checkbox is visually hidden behind its styled box, so tick by clicking the
  // label, as a person does.
  const openItems = page.getByRole('group', { name: /Confirm each open item/ })
  await expect(openItems.getByRole('checkbox')).toHaveCount(3)
  for (const label of await openItems.locator('label').all()) await label.click()
  for (const box of await openItems.getByRole('checkbox').all()) await expect(box).toBeChecked()
  await expect(page.getByText('3 of 3')).toBeVisible()
  await page
    .getByRole('textbox', { name: /Reason for approving/ })
    .fill('Licensing and accessibility do not apply: no new dependencies or screens.')
  await expect(approve).toBeEnabled()

  // Approve: the button pops, then the confirmation opens (0051).
  await approve.click()
  const dialog = page.getByRole('dialog', { name: 'Approve and release' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Approve and release' }).click()

  // The decision is recorded, attributable and reversible (AGENTS.md, non-negotiable 2).
  await expect(dialog).toBeHidden()
  const outcome = page.getByRole('heading', { level: 2, name: 'Approved' })
  await expect(outcome).toBeFocused()
  await expect(page.getByText('Undo window open')).toBeVisible()
  await expect(page.getByLabel(/left to undo$/)).toBeVisible()
  await expect(page.getByText('3 things to solve')).toBeHidden()

  await page.getByRole('button', { name: 'Undo this decision' }).click()
  await expect(page.getByRole('region', { name: 'Your decision' })).toBeVisible()
  await expect(page.getByText('3 things to solve')).toBeVisible()
})

/**
 * DECISIONS 0064: a decline used to come back as "Approved". Undo only changed the screen,
 * and every link is a full page load, so the api's decisions did not survive the trip to My
 * reviews.
 */
test('a decline made after undoing an approval stays declined, in My reviews too', async ({
  page,
}) => {
  await page.goto('/?run=run-messy')
  await page.getByRole('button', { name: 'Undo this decision' }).click()

  await page.getByRole('button', { name: 'Reject run', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('The refund rounding is wrong.')
  await dialog.getByRole('button', { name: 'Reject run' }).click()
  await expect(page.getByRole('heading', { name: 'Rejected' })).toBeVisible()

  await page.getByRole('link', { name: 'Back to the reviews list' }).click()
  await page.getByRole('tab', { name: /Declined/ }).click()
  await page.getByRole('button', { name: /^Decision details: Move refund processing/ }).click()
  await expect(page.getByRole('dialog')).toContainText('The refund rounding is wrong.')

  await page.reload()
  await page.getByRole('tab', { name: /Approved/ }).click()
  await expect(
    page.getByRole('button', { name: /^Decision details: Move refund processing/ }),
  ).toHaveCount(0)
})
