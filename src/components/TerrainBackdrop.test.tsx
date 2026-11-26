import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TerrainBackdrop } from './TerrainBackdrop'

describe('TerrainBackdrop', () => {
  it('is the page main landmark, carrying the backdrop class, around its content', () => {
    render(<TerrainBackdrop>Page content</TerrainBackdrop>)
    const main = screen.getByRole('main')
    expect(main).toBe(screen.getByTestId('terrain-backdrop'))
    expect(main).toHaveClass('terrain-page')
    expect(main).toHaveTextContent('Page content')
  })
})
