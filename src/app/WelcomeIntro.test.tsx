import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INTRO_SEEN_KEY, INTRO_TIMING } from './intro'
import { WelcomeIntro } from './WelcomeIntro'

const t = INTRO_TIMING
const TOTAL = t.station * 3 + t.sign + t.fade

beforeEach(() => {
  window.sessionStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WelcomeIntro', () => {
  it('visits Station Alpha, Beta and Omega, signs, then fades and finishes', () => {
    const onDone = vi.fn()
    render(<WelcomeIntro onDone={onDone} />)
    const overlay = screen.getByTestId('welcome-intro')
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
    expect(overlay).toHaveAttribute('data-phase', 'alpha')
    expect(overlay).toHaveTextContent('A run is requested')

    act(() => {
      vi.advanceTimersByTime(t.station)
    })
    expect(overlay).toHaveAttribute('data-phase', 'beta')
    expect(overlay).toHaveTextContent('An agent does the work')

    act(() => {
      vi.advanceTimersByTime(t.station)
    })
    expect(overlay).toHaveAttribute('data-phase', 'omega')
    expect(overlay).toHaveTextContent('You review it and decide')

    act(() => {
      vi.advanceTimersByTime(t.station)
    })
    expect(overlay).toHaveAttribute('data-phase', 'sign')
    expect(overlay.querySelector('svg.intro-mark')).toHaveAttribute('data-resolved')
    expect(overlay).toHaveTextContent('Berit Alasmäki')

    act(() => {
      vi.advanceTimersByTime(t.sign)
    })
    expect(overlay).toHaveAttribute('data-phase', 'fade')
    expect(onDone).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(t.fade)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).not.toBeNull()
  })

  it('any key skips it at once, and remembers for this visit', () => {
    const onDone = vi.fn()
    render(<WelcomeIntro onDone={onDone} />)
    window.localStorage.setItem(INTRO_SEEN_KEY, 'from the first version')
    fireEvent.keyDown(window, { key: 'a' })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(INTRO_SEEN_KEY)).toBeNull()
    act(() => {
      vi.advanceTimersByTime(TOTAL)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('a click or tap skips it at once', () => {
    const onDone = vi.fn()
    render(<WelcomeIntro onDone={onDone} />)
    fireEvent.pointerDown(screen.getByTestId('welcome-intro'))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
