import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { WelcomeModal } from './WelcomeModal'

/*
 * `WelcomeModal` closes by unmounting, not via an `open` prop (`Modal`'s own convention) — this
 * story needs somewhere to unmount it to, a button that reopens it either way.
 */
function Reopenable() {
  const [open, setOpen] = useState(true)
  const [last, setLast] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      {last && (
        <p className="mb-[var(--space-4)] text-body text-text-secondary">Last choice: {last}</p>
      )}
      <button
        type="button"
        className="rounded-md border border-border px-[var(--space-4)] py-[var(--space-2)] text-body"
        onClick={() => setOpen(true)}
      >
        Reopen
      </button>
      {open && (
        <WelcomeModal
          onStartTour={() => {
            setLast('Take the tour')
            setOpen(false)
          }}
          onSkip={() => {
            setLast('Skip')
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

const meta = {
  title: 'App/WelcomeModal',
  component: WelcomeModal,
  parameters: { layout: 'fullscreen' },
  args: { onStartTour: () => {}, onSkip: () => {} },
} satisfies Meta<typeof WelcomeModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <Reopenable /> }
