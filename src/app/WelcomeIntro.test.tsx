import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INTRO_SEEN_KEY, INTRO_TIMING } from './intro'
import { WelcomeIntro } from './WelcomeIntro'

beforeEach(() => {
  window.sessionStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function renderIntro() {
  const onStartTour = vi.fn()
  const onSkip = vi.fn()
  render(<WelcomeIntro onStartTour={onStartTour} onSkip={onSkip} />)
  return { onStartTour, onSkip }
}

describe('WelcomeIntro', () => {
  it('plays the three stations with a text description, and no dialog yet', () => {
    renderIntro()
    const overlay = screen.getByTestId('welcome-intro')
    expect(overlay).not.toHaveAttribute('data-done')
    expect(overlay).toHaveTextContent('across three stations')
    expect(overlay.querySelector('.intro-cam')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Alpha · Request')).toBeInTheDocument()
    expect(screen.getByText('Beta · Agent at work')).toBeInTheDocument()
    expect(screen.getByText('Omega · Your review')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).toBeNull()
  })

  it('opens the welcome dialog over the last frame when the animation ends, and remembers it', () => {
    renderIntro()
    act(() => {
      vi.advanceTimersByTime(INTRO_TIMING.total)
    })
    expect(screen.getByTestId('welcome-intro')).toHaveAttribute('data-done')
    expect(screen.getByRole('dialog', { name: 'Welcome to Review agent runs' })).toBeVisible()
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).not.toBeNull()
  })

  it('"Skip intro" jumps to the dialog at once', () => {
    renderIntro()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Skip intro' })).not.toBeInTheDocument()
  })

  it('Escape skips the animation while it plays', () => {
    renderIntro()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('"Replay intro" plays it again and takes the dialog away until it is done', () => {
    renderIntro()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay intro' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('welcome-intro')).not.toHaveAttribute('data-done')
    act(() => {
      vi.advanceTimersByTime(INTRO_TIMING.total)
    })
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it("passes the dialog's two choices on", () => {
    const { onStartTour, onSkip } = renderIntro()
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }))
    expect(onStartTour).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /^Skip, I'll look around/ }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('with reduced motion it starts on the last frame, with the dialog open', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    renderIntro()
    expect(screen.getByTestId('welcome-intro')).toHaveAttribute('data-done')
    expect(screen.getByRole('dialog')).toBeVisible()
  })
})
