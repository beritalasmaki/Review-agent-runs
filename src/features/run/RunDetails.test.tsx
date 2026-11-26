import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { runBlocked, runMessy, runMessyPending } from '../../fixtures'
import { RunDetails } from './RunDetails'

describe('RunDetails', () => {
  it('leads with the environment, the target, who asked, when it ran and the revision', () => {
    render(<RunDetails run={runMessyPending} />)
    const card = screen.getByRole('region', { name: 'Run details' })
    expect(within(card).getByText('Production')).toBeVisible()
    expect(within(card).getByText('payments-service')).toBeVisible()
    expect(within(card).getByText('Maarit Kasakallio')).toBeVisible()
    expect(within(card).getByText('Duration 1 h 49 min')).toBeVisible()
    expect(within(card).getByText('e91a4c')).toBeVisible()
  })

  it('keeps the plain lines behind an "i" beside each label, not on the page', async () => {
    const user = userEvent.setup()
    render(<RunDetails run={runMessyPending} />)
    expect(screen.queryByText('The live system. Real customers use it.')).not.toBeInTheDocument()
    await user.hover(screen.getByRole('button', { name: 'About environment' }))
    expect(
      (await screen.findAllByText('The live system. Real customers use it.')).length,
    ).toBeGreaterThan(0)
  })

  it('puts the rest under "More details"', async () => {
    const user = userEvent.setup()
    render(<RunDetails run={runMessyPending} />)
    const more = screen.getByText('More details')
    await user.click(more)
    const card = screen.getByRole('region', { name: 'Run details' })
    expect(within(card).getByText('run-messy-pending')).toBeVisible()
    expect(within(card).getByText('Kestrel 4.3.0')).toBeVisible()
    expect(within(card).getByText('· 2 not run')).toBeVisible()
    expect(within(card).getByText('52%')).toBeVisible()
  })

  it('shows a failed check and an exception', async () => {
    const user = userEvent.setup()
    render(<RunDetails run={runBlocked} />)
    await user.click(screen.getByText('More details'))
    expect(screen.getByText('· 1 failed')).toBeVisible()
    expect(screen.getByText('1 exception · 1 does not apply')).toBeVisible()
  })

  it('uses past tense once released', () => {
    render(<RunDetails run={runMessy} />)
    expect(screen.getByText('Released revision')).toBeVisible()
  })
})
