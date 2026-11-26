import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme
    localStorage.clear()
  })

  it('starts dark, and switches the theme and remembers the choice', async () => {
    render(<ThemeToggle />)
    const toggle = screen.getByRole('switch', { name: 'Dark theme' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    await userEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('reads a choice already on the page', () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)
    expect(screen.getByRole('switch', { name: 'Dark theme' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })
})
