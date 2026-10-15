import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WelcomeModal } from './WelcomeModal'

describe('WelcomeModal', () => {
  it('shows the product explanation and both choices', () => {
    render(<WelcomeModal onStartTour={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Welcome to Review agent runs' })).toBeVisible()
    expect(screen.getByText(/AI agent did to a piece of software/)).toBeVisible()
    expect(screen.getByText(/Berit Alasmäki/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Take the tour' })).toBeVisible()
    expect(screen.getByRole('button', { name: /^Skip/ })).toBeVisible()
  })

  it('calls onStartTour from the Take the tour button', () => {
    const onStartTour = vi.fn()
    render(<WelcomeModal onStartTour={onStartTour} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }))
    expect(onStartTour).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip from the Skip button', () => {
    const onSkip = vi.fn()
    render(<WelcomeModal onStartTour={vi.fn()} onSkip={onSkip} />)
    fireEvent.click(screen.getByRole('button', { name: /^Skip/ }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip on Escape, same as closing any other way', () => {
    const onSkip = vi.fn()
    render(<WelcomeModal onStartTour={vi.fn()} onSkip={onSkip} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
