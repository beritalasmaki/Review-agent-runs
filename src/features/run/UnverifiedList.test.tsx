import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runClean, runMessy, runMessyPending } from '../../fixtures'
import { UnverifiedList } from './UnverifiedList'

describe('UnverifiedList', () => {
  it('before a decision: what approving would accept, open items marked', () => {
    render(<UnverifiedList run={runMessyPending} />)
    expect(screen.getByRole('heading', { name: 'What is not checked' })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getAllByText('Open:')).toHaveLength(4)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('after a decision: the list to explain later', () => {
    render(<UnverifiedList run={runMessy} />)
    expect(screen.getByRole('heading', { name: 'What is still unverified' })).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('says "Nothing" when every check ran and nothing is unverified', () => {
    render(
      <UnverifiedList
        run={{ ...runClean, confidence: runClean.confidence.filter((a) => a.value >= 0.85) }}
      />,
    )
    expect(screen.getByText(/^Nothing\./)).toBeVisible()
  })
})
