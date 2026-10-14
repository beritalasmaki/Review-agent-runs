import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { INTRO_SEEN_KEY } from './intro'
import { runClean, runMessyPending } from '../fixtures'
import App from './App'

// These tests are about the page; the intro is covered on its own (WelcomeIntro.test.tsx).
beforeEach(() => {
  window.sessionStorage.setItem(INTRO_SEEN_KEY, 'seen')
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
    expect(screen.getByRole('link', { name: 'My reviews' })).toHaveAttribute('href', '/')
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
    window.history.pushState({}, '', '/?delay=50')
    render(<App />)
    expect(screen.getByTestId('welcome-intro')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading reviews')
    expect(await screen.findByRole('heading', { name: 'My reviews' })).toBeVisible()
  })

  it("hands off to the page's own loading state when a skip beats a slow load", async () => {
    window.sessionStorage.clear()
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
})
