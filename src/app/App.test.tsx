import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { INTRO_SEEN_KEY } from './intro'
import { TOUR_SEEN_KEY } from './tour'
import { runClean, runMessyPending } from '../fixtures'
import App from './App'

// These tests are about the page; the intro, the welcome modal and the tour are each covered
// on their own (WelcomeIntro.test.tsx, WelcomeModal.test.tsx, OnboardingTour.test.tsx).
beforeEach(() => {
  window.sessionStorage.setItem(INTRO_SEEN_KEY, 'seen')
  window.sessionStorage.setItem(TOUR_SEEN_KEY, 'seen')
})

afterEach(() => {
  window.history.pushState({}, '', '/')
  window.sessionStorage.clear()
})

describe('App', () => {
  it('shows a loading state before any run arrives, on the home page', () => {
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews')
  })

  it('defaults to "My reviews", with no ?run= query given', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'My reviews' })).toBeVisible()
  })

  it('has no logo or main menu of its own: the run page opens on its own breadcrumb back home', async () => {
    window.history.pushState({}, '', `/?run=${runClean.id}`)
    render(<App />)
    expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to the reviews list' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('loads the run named by ?run=', async () => {
    window.history.pushState({}, '', `/?run=${runClean.id}`)
    render(<App />)
    expect(await screen.findByText(runClean.target.system)).toBeVisible()
  })

  it('shows a plain not-found message for an unknown ?run= id', async () => {
    window.history.pushState({}, '', '/?run=run-does-not-exist')
    render(<App />)
    expect(await screen.findByText(/Could not find a run with id/)).toBeVisible()
  })

  it('on a new visit, lays the intro over the home page, which is already loading underneath', async () => {
    window.sessionStorage.clear()
    // The tour's own sequencing (intro -> welcome modal -> tour) is covered below; keeping it
    // seen here isolates this test to what it is actually about, the intro and the loading
    // state underneath it.
    window.sessionStorage.setItem(TOUR_SEEN_KEY, 'seen')
    window.history.pushState({}, '', '/?delay=50')
    render(<App />)
    expect(screen.getByTestId('welcome-intro')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews')
    expect(await screen.findByRole('heading', { name: 'My reviews' })).toBeVisible()
  })

  it("hands off to the page's own loading state when a skip beats a slow load", async () => {
    window.sessionStorage.clear()
    window.sessionStorage.setItem(TOUR_SEEN_KEY, 'seen')
    window.history.pushState({}, '', '/?delay=100')
    render(<App />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('welcome-intro')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews')
    expect(await screen.findByRole('heading', { name: 'My reviews' })).toBeVisible()
  })

  it('does not show the intro once it has been seen', () => {
    render(<App />)
    expect(screen.queryByTestId('welcome-intro')).not.toBeInTheDocument()
  })

  it('does not show the intro on a direct run link, even on a new visit', async () => {
    window.sessionStorage.clear()
    window.history.pushState({}, '', `/?run=${runMessyPending.id}`)
    render(<App />)
    expect(screen.queryByTestId('welcome-intro')).not.toBeInTheDocument()
    expect(await screen.findByText(runMessyPending.id)).toBeVisible()
  })

  describe('the welcome modal and the onboarding tour', () => {
    beforeEach(() => {
      // The intro already seen, the tour not: isolates these to what happens next, same as
      // the intro tests above isolate themselves from the tour.
      window.sessionStorage.setItem(INTRO_SEEN_KEY, 'seen')
      window.sessionStorage.removeItem(TOUR_SEEN_KEY)
    })

    it('offers the welcome modal once the intro is out of the way, not before', async () => {
      render(<App />)
      expect(
        await screen.findByRole('heading', { name: 'Welcome to Review agent runs' }),
      ).toBeVisible()
    })

    it('"Take the tour" closes the modal and opens Leg 1 on My reviews', async () => {
      render(<App />)
      fireEvent.click(await screen.findByRole('button', { name: 'Take the tour' }))
      expect(
        screen.queryByRole('heading', { name: 'Welcome to Review agent runs' }),
      ).not.toBeInTheDocument()
      expect(await screen.findByText('Step 1 of 5')).toBeVisible()
    })

    it('skipping the modal opens neither the modal nor the tour, and remembers it', async () => {
      render(<App />)
      fireEvent.click(await screen.findByRole('button', { name: /^Skip/ }))
      expect(
        screen.queryByRole('heading', { name: 'Welcome to Review agent runs' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Step 1 of 5')).not.toBeInTheDocument()
      expect(window.sessionStorage.getItem(TOUR_SEEN_KEY)).not.toBeNull()
    })

    it('does not offer the welcome modal on a direct run link', async () => {
      window.history.pushState({}, '', `/?run=${runMessyPending.id}`)
      render(<App />)
      await screen.findByText(runMessyPending.id)
      expect(
        screen.queryByRole('heading', { name: 'Welcome to Review agent runs' }),
      ).not.toBeInTheDocument()
    })
  })
})
