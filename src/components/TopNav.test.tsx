import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TopNav } from './TopNav'

describe('TopNav', () => {
  it('renders as a named banner landmark', () => {
    render(<TopNav />)
    expect(screen.getByRole('banner', { name: 'Review agent runs' })).toBeInTheDocument()
  })
})
