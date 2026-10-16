import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { MyReviews } from './MyReviews'

const runHref = (id: string) => `?run=${id}`

async function renderLoaded() {
  const user = userEvent.setup()
  render(<MyReviews runHref={runHref} options={{ delayMs: 0 }} />)
  await screen.findByRole('tablist', { name: 'Run types' })
  return user
}

const rows = () =>
  within(screen.getByRole('table', { name: /runs$/ }))
    .getAllByRole('row')
    .slice(1)

describe('MyReviews', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // Sonner keeps its toasts at module level; start each test with none.
    toast.dismiss()
  })

  it('opens on pending runs, with a count on every tab and a link to each review', async () => {
    await renderLoaded()
    expect(screen.getByRole('tab', { name: /Pending/, selected: true })).toHaveTextContent('11')
    expect(screen.getByRole('tab', { name: /Requested for change/ })).toHaveTextContent('3')
    expect(screen.getByRole('tab', { name: /Declined/ })).toHaveTextContent('2')
    expect(screen.getByRole('tab', { name: /Approved/ })).toHaveTextContent('5')
    expect(screen.getByRole('tab', { name: /All runs/ })).toHaveTextContent('21')
    // Seven are ready for review; four are still in progress, folded below the table.
    expect(rows()).toHaveLength(7)
    expect(screen.getByText('7 need your review')).toBeVisible()
    expect(screen.getByRole('button', { name: /4 runs still in progress/ })).toBeVisible()
    expect(
      screen.getByRole('link', {
        name: 'Review “Add a CSV export to the appointment history page”',
      }),
    ).toHaveAttribute('href', '?run=run-clean')
  })

  it('shows runs the agent is still working on, in Pending and in Requested for change', async () => {
    // Open by default (0082): no click needed to reveal it.
    const user = await renderLoaded()
    expect(screen.getAllByText('Agent is working')).toHaveLength(2)
    expect(screen.getAllByText('Checks are running')).toHaveLength(2)

    await user.click(screen.getByRole('tab', { name: /Requested for change/ }))
    expect(rows()).toHaveLength(0)
    expect(screen.getByText('Nothing here needs you yet')).toBeVisible()
    expect(screen.getAllByText('Agent is making changes')).toHaveLength(3)
  })

  it('searches, says how many it shows, and offers to clear when nothing matches', async () => {
    const user = await renderLoaded()
    await user.type(screen.getByRole('searchbox', { name: 'Search runs' }), 'booking')
    expect(rows()).toHaveLength(1)
    expect(screen.getByText('Showing 1 of 21 active runs')).toBeVisible()

    await user.type(screen.getByRole('searchbox', { name: 'Search runs' }), 'zzz')
    expect(screen.getByText('No active runs match these filters')).toBeVisible()
    await user.click(screen.getAllByRole('button', { name: /Clear filters/ })[0])
    expect(rows()).toHaveLength(7)
  })

  it('orders by a column and says so on its header', async () => {
    const user = await renderLoaded()
    const sortByRun = screen.getByRole('button', { name: 'Order by run: A to Z' })
    await user.click(sortByRun)
    expect(sortByRun.closest('th')).toHaveAttribute('aria-sort', 'ascending')
  })

  it('archives a finished run, by hand', async () => {
    const user = await renderLoaded()
    await user.click(screen.getByRole('tab', { name: /Approved/ }))
    await user.click(screen.getByRole('button', { name: /^Archive “Move refund processing/ }))
    // It asks first, and Cancel changes nothing.
    const ask = screen.getByRole('dialog', { name: 'Move to the archive?' })
    expect(ask).toHaveTextContent(/record stays exactly as it is/)
    await user.click(within(ask).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('tab', { name: /Approved/ })).toHaveTextContent('5')
    await user.click(screen.getByRole('button', { name: /^Archive “Move refund processing/ }))
    await user.click(screen.getByRole('button', { name: 'Move to the archive' }))
    expect(await screen.findByRole('region', { name: /Notifications/ })).toHaveTextContent(
      'Archived “Move refund processing to the new payment gateway”.',
    )
    expect(screen.getByRole('tab', { name: /Approved/ })).toHaveTextContent('4')

    await user.click(screen.getByRole('button', { name: 'Archive, 5 archived runs' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Archive' })).toHaveFocus()
    expect(screen.getByText('By you')).toBeVisible()
  })

  it('the archive has no select boxes and no restore: read-only except for a new run', async () => {
    const user = await renderLoaded()
    await user.click(screen.getByRole('button', { name: 'Archive, 4 archived runs' }))
    expect(screen.getAllByText('Automatically, after 6 months')).toHaveLength(4)
    expect(screen.queryByRole('checkbox', { name: /^Select/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Restore/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Restore locked' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Request a new run/ }).length).toBeGreaterThan(0)
  })

  it("shows a run's decision details from its own data", async () => {
    const user = await renderLoaded()
    await user.click(screen.getByRole('tab', { name: /Approved/ }))
    await user.click(
      screen.getByRole('button', { name: /^Decision details: Move refund processing/ }),
    )
    const dialog = screen.getByRole('dialog', {
      name: 'Move refund processing to the new payment gateway',
    })
    expect(within(dialog).getByText('Approved')).toBeVisible()
    expect(within(dialog).getByText(/Released to payments-service \(production\)/)).toBeVisible()
    expect(within(dialog).getByRole('link', { name: /Open the full review/ })).toHaveAttribute(
      'href',
      '?run=run-messy',
    )
  })

  it('requests a new run only once the mistake is described', async () => {
    const user = await renderLoaded()
    await user.click(screen.getByRole('tab', { name: /Approved/ }))
    await user.click(screen.getByRole('button', { name: /^Request a new run: Move refund/ }))
    const send = screen.getByRole('button', { name: 'Send request' })
    expect(send).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: /What went wrong/ }), 'Rounding is wrong.')
    await user.click(send)
    expect(await screen.findByRole('region', { name: /Notifications/ })).toHaveTextContent(
      'Request sent to Maarit Kasakallio.',
    )
  })

  it('makes a CSV report of the selected runs', async () => {
    const createObjectURL = vi.fn(() => 'blob:report')
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = vi.fn()
    const user = await renderLoaded()
    await user.click(screen.getByRole('tab', { name: /Approved/ }))
    await user.click(screen.getByRole('checkbox', { name: /Select “Move refund/ }))
    expect(screen.getByText('1 run selected')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Create report' }))
    await user.click(screen.getByRole('radio', { name: 'CSV, for spreadsheets' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Create report' }),
    )
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(await screen.findByRole('region', { name: /Notifications/ })).toHaveTextContent(
      /created as CSV, 1 run\./,
    )
  })

  it('shows no select boxes on Pending: nothing there can be selected yet', async () => {
    await renderLoaded()
    expect(screen.queryAllByRole('checkbox', { name: /^Select/ })).toHaveLength(0)
  })

  it('shows a loading state, and a failed load with Retry', async () => {
    const { unmount } = render(<MyReviews runHref={runHref} options={{ delayMs: 50 }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews')
    unmount()

    render(<MyReviews runHref={runHref} options={{ delayMs: 0, simulateNetworkError: true }} />)
    expect(await screen.findByText(/Could not load your reviews/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible()
  })
})
