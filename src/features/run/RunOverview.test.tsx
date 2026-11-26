import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runMessy, runMessyPending } from '../../fixtures'
import { RunOverview } from './RunOverview'

describe('RunOverview', () => {
  it('shows status, initiative, why the agent was asked and where the run is now', () => {
    render(<RunOverview run={runMessyPending} />)
    expect(screen.getByText('Awaiting review')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(runMessyPending.initiative)
    expect(screen.getByText('What the agent did')).toBeVisible()
    expect(screen.getByText('Maarit Kasakallio')).toBeVisible()
    expect(
      screen.getByText(/Nothing has been released\. The agent worked for 1 h 49 min/),
    ).toBeVisible()
  })

  it('after an approval: the status and who decided what', () => {
    render(<RunOverview run={runMessy} />)
    expect(screen.getByText('Approved')).toBeVisible()
    expect(
      screen.getByText(/approved revision e91a4c for payments-service in production/),
    ).toBeVisible()
  })

  it('has no Show or Hide details control', () => {
    render(<RunOverview run={runMessyPending} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
