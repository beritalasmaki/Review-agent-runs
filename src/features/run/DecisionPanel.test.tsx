import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runBlocked, runClean, runMessyPending } from '../../fixtures'
import type { Run } from '../../lib/types'
import { DecisionPanel } from './DecisionPanel'

describe('DecisionPanel', () => {
  it('lists every open item as its own tick, with a running count', async () => {
    const user = userEvent.setup()
    render(<DecisionPanel run={runMessyPending} onRunUpdated={vi.fn()} />)

    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(3)
    expect(screen.getByText('0 of 3')).toBeVisible()

    await user.click(screen.getByLabelText(/checks did not run/))
    expect(screen.getByText('1 of 3')).toBeVisible()
    expect(boxes[0]).toBeChecked()
  })

  it('blocks approval until every item is ticked and a reason is written, and says why', async () => {
    const user = userEvent.setup()
    render(<DecisionPanel run={runMessyPending} onRunUpdated={vi.fn()} />)
    const approve = screen.getByRole('button', { name: 'Approve and release' })

    expect(approve).toBeDisabled()
    expect(screen.getByText('To approve, tick 3 more items and add a reason.')).toBeVisible()
    expect(screen.getByLabelText(/Reason for approving/)).toBeRequired()
    expect(screen.getByText('(required: 2 checks are missing)')).toBeVisible()

    for (const box of screen.getAllByRole('checkbox')) await user.click(box)
    expect(approve).toBeDisabled()
    expect(screen.getByText('To approve, add a reason.')).toBeVisible()

    await user.type(screen.getByLabelText(/Reason for approving/), 'Neither check applies.')
    expect(approve).toBeEnabled()
    expect(
      screen.getByText(
        'Ready. Releases e91a4c to payments-service in production. You can undo for 10 minutes.',
      ),
    ).toBeVisible()
  })

  it('does not ask for a reason when no check is missing', () => {
    render(<DecisionPanel run={runClean} onRunUpdated={vi.fn()} />)
    expect(screen.getByText('(optional)')).toBeVisible()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Approve and release' })).toBeEnabled()
  })

  it('keeps a failed check and an exception as ticks', () => {
    render(<DecisionPanel run={runBlocked} onRunUpdated={vi.fn()} />)
    expect(screen.getByLabelText('Data retention check failed.')).toBeVisible()
    expect(screen.getByLabelText(/Exception by Kaisa Heinämäki/)).toBeVisible()
  })

  it('records the ticks and the reason with an approval', async () => {
    const user = userEvent.setup()
    const onRunUpdated = vi.fn()
    render(
      <DecisionPanel
        run={runMessyPending}
        onRunUpdated={onRunUpdated}
        submitDecisionOptions={{ delayMs: 0 }}
        defaultTickedIds={['open-gates-unknown', 'open-confidence-side_effects', 'open-note-m19']}
        defaultReason="Neither check applies to this change."
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Approve and release' }))
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText('Your reason: “Neither check applies to this change.”'),
    ).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Approve and release' }))

    await vi.waitFor(() => expect(onRunUpdated).toHaveBeenCalled())
    const decision = (onRunUpdated.mock.calls[0][0] as Run).decision!
    expect(decision.reason).toBe('Neither check applies to this change.')
    expect(decision.acknowledgedItemIds).toEqual([
      'open-gates-unknown',
      'open-confidence-side_effects',
      'open-note-m19',
    ])
  })

  it('opens the reason dialog for Request changes and Reject run', async () => {
    const user = userEvent.setup()
    render(<DecisionPanel run={runBlocked} onRunUpdated={vi.fn()} />)

    // Each confirmation opens a beat after the click, behind the icon's own pop (0090).
    await user.click(screen.getByRole('button', { name: 'Request changes' }))
    const changesDialog = await screen.findByRole('dialog')
    expect(within(changesDialog).getByLabelText('What should change?')).toBeVisible()
    await user.click(within(changesDialog).getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Reject run' }))
    const rejectDialog = await screen.findByRole('dialog')
    expect(within(rejectDialog).getByLabelText('Why is this rejected?')).toBeVisible()
  })

  it('names who is deciding', () => {
    render(<DecisionPanel run={runClean} onRunUpdated={vi.fn()} />)
    expect(screen.getByText('Juhani Virtaleppäsoutu')).toBeVisible()
  })

  it('links each open item to where it is shown in full', async () => {
    const user = userEvent.setup()
    const onShowItem = vi.fn()
    render(<DecisionPanel run={runMessyPending} onRunUpdated={vi.fn()} onShowItem={onShowItem} />)
    await user.click(screen.getByRole('button', { name: 'Show the checks →' }))
    expect(onShowItem).toHaveBeenLastCalledWith({ kind: 'check', gateId: 'licensing', count: 2 })
    await user.click(screen.getByRole('button', { name: 'Show the score →' }))
    expect(onShowItem).toHaveBeenLastCalledWith({ kind: 'score', area: 'side_effects' })
    await user.click(screen.getByRole('button', { name: 'Show the step →' }))
    expect(onShowItem).toHaveBeenLastCalledWith({ kind: 'step', eventId: 'm19' })
    // A link is not part of the tick: nothing was ticked.
    expect(screen.getByText('0 of 3')).toBeVisible()
  })

  it('has no links without onShowItem', () => {
    render(<DecisionPanel run={runMessyPending} onRunUpdated={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /^Show the/ })).not.toBeInTheDocument()
  })

  describe('the approve pop', () => {
    function stubMotion(reduce: boolean) {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    }
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    })

    it('pops the button, then opens the confirmation', () => {
      stubMotion(false)
      vi.useFakeTimers()
      render(<DecisionPanel run={runClean} onRunUpdated={vi.fn()} />)
      const approve = screen.getByRole('button', { name: 'Approve and release' })
      fireEvent.click(approve)
      expect(approve).toHaveAttribute('data-popping')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(440)
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(approve).not.toHaveAttribute('data-popping')
    })

    it('lets Reject pressed during the pop win, so a decline never opens as an approval', () => {
      stubMotion(false)
      vi.useFakeTimers()
      render(<DecisionPanel run={runClean} onRunUpdated={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Approve and release' }))
      fireEvent.click(screen.getByRole('button', { name: 'Reject run' }))
      act(() => {
        vi.advanceTimersByTime(440)
      })
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('button', { name: 'Reject run' })).toBeInTheDocument()
      expect(
        within(dialog).queryByRole('button', { name: 'Approve and release' }),
      ).not.toBeInTheDocument()
    })

    it('skips the pop for reduced motion and opens the confirmation at once', () => {
      stubMotion(true)
      render(<DecisionPanel run={runClean} onRunUpdated={vi.fn()} />)
      const approve = screen.getByRole('button', { name: 'Approve and release' })
      fireEvent.click(approve)
      expect(approve).not.toHaveAttribute('data-popping')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
