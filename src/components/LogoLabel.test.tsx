import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLabel } from './LogoLabel'

describe('LogoLabel', () => {
  it('renders as a named image', () => {
    render(<LogoLabel />)
    expect(screen.getByRole('img', { name: 'Review agent runs' })).toBeInTheDocument()
  })
})
