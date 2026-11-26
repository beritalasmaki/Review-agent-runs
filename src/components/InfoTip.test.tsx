import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InfoTip } from './InfoTip'

describe('InfoTip', () => {
  it('keeps the line in the page for assistive technology, without a visible "i"', () => {
    const { container } = render(
      <p>
        Open items <InfoTip label="Open items">Things the run could not finish or check.</InfoTip>
      </p>,
    )
    expect(screen.getByText('Things the run could not finish or check.')).toHaveClass('sr-only')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })
})
