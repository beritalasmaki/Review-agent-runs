import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingTour } from './OnboardingTour'
import type { TourStep } from './OnboardingTour'

function Page({
  steps,
  onDismiss,
  missingTimeoutMs,
}: {
  steps: TourStep[]
  onDismiss: (reason: string) => void
  missingTimeoutMs?: number
}) {
  return (
    <>
      <button type="button" data-tour="one">
        First target
      </button>
      <button type="button" data-tour="two">
        Second target
      </button>
      <OnboardingTour steps={steps} onDismiss={onDismiss} missingTimeoutMs={missingTimeoutMs} />
    </>
  )
}

const TWO_STEPS: TourStep[] = [
  { id: 'one', selector: '[data-tour="one"]', title: 'First step', body: 'About the first thing.' },
  {
    id: 'two',
    selector: '[data-tour="two"]',
    title: 'Second step',
    body: 'About the second thing.',
  },
]

describe('OnboardingTour', () => {
  it('shows the first step, with no Back button', async () => {
    render(<Page steps={TWO_STEPS} onDismiss={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'First step' })).toBeVisible()
    expect(screen.getByText('Step 1 of 2')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('moves to the next step on Next, and back again on Back', async () => {
    render(<Page steps={TWO_STEPS} onDismiss={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('heading', { name: 'Second step' })).toBeVisible()
    expect(screen.getByText('Step 2 of 2')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { name: 'First step' })).toBeVisible()
  })

  it('calls onDismiss("finished") from the last step\'s Done button', async () => {
    const onDismiss = vi.fn()
    render(<Page steps={TWO_STEPS} onDismiss={onDismiss} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }))
    expect(onDismiss).toHaveBeenCalledWith('finished')
  })

  it('calls onDismiss("skip") from Skip tour, on any step', async () => {
    const onDismiss = vi.fn()
    render(<Page steps={TWO_STEPS} onDismiss={onDismiss} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Skip tour' }))
    expect(onDismiss).toHaveBeenCalledWith('skip')
  })

  it('calls onDismiss("navigated") on pagehide, before reaching the last step', async () => {
    const onDismiss = vi.fn()
    render(<Page steps={TWO_STEPS} onDismiss={onDismiss} />)
    await screen.findByRole('heading', { name: 'First step' }) // step 1 of 2, not the last
    fireEvent(window, new Event('pagehide'))
    expect(onDismiss).toHaveBeenCalledWith('navigated')
  })

  it('calls onDismiss("escape") on Escape, from anywhere', () => {
    const onDismiss = vi.fn()
    render(<Page steps={TWO_STEPS} onDismiss={onDismiss} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledWith('escape')
  })

  it('skips a step whose target is never in the DOM, once it has waited for it', async () => {
    const steps: TourStep[] = [
      { id: 'missing', selector: '[data-tour="does-not-exist"]', title: 'Missing', body: '…' },
      {
        id: 'two',
        selector: '[data-tour="two"]',
        title: 'Second step',
        body: 'About the second thing.',
      },
    ]
    render(<Page steps={steps} onDismiss={vi.fn()} missingTimeoutMs={10} />)
    expect(await screen.findByRole('heading', { name: 'Second step' })).toBeVisible()
  })

  it('finishes outright once every step has waited and none ever appeared', async () => {
    const onDismiss = vi.fn()
    const steps: TourStep[] = [
      { id: 'missing', selector: '[data-tour="nope"]', title: 'Missing', body: '…' },
    ]
    render(<Page steps={steps} onDismiss={onDismiss} missingTimeoutMs={10} />)
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('finished'))
  })

  it('finds a target that appears after the step opens, instead of giving up on it', async () => {
    function LatePage() {
      const [show, setShow] = useState(false)
      return (
        <>
          {show && (
            <button type="button" data-tour="late">
              Late target
            </button>
          )}
          <OnboardingTour
            steps={[{ id: 'late', selector: '[data-tour="late"]', title: 'Late step', body: '…' }]}
            onDismiss={vi.fn()}
          />
          <button type="button" onClick={() => setShow(true)}>
            Reveal
          </button>
        </>
      )
    }
    render(<LatePage />)
    expect(screen.queryByRole('heading', { name: 'Late step' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal' }))
    expect(await screen.findByRole('heading', { name: 'Late step' })).toBeVisible()
  })

  it('wraps Tab from the last button back to the first, inside the bubble', async () => {
    render(<Page steps={TWO_STEPS} onDismiss={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Next' })) // now on step 2
    const done = await screen.findByRole('button', { name: 'Done' })
    const back = screen.getByRole('button', { name: 'Back' })
    done.focus()
    const controls = done.closest('div')!
    fireEvent.keyDown(controls, { key: 'Tab' })
    expect(back).toHaveFocus()
  })
})
