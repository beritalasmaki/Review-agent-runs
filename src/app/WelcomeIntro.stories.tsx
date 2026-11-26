import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { WelcomeIntro } from './WelcomeIntro'

/*
 * The intro plays once and then opens the welcome dialog over its last frame; both of the
 * dialog's choices unmount it. This story can bring it back with a button, and says which choice
 * was made. Playing it here also sets the real `ledger:intro-seen` flag for this tab's visit.
 */
function Replayable() {
  const [playing, setPlaying] = useState(true)
  const [last, setLast] = useState<string | null>(null)
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-6)' }}>
      <p className="text-body text-text-secondary">
        The page underneath. {last ? `Last choice: ${last}.` : 'Choose in the welcome dialog.'}
      </p>
      <button
        type="button"
        className="mt-[var(--space-4)] rounded-md border border-border px-[var(--space-4)] py-[var(--space-2)] text-body"
        onClick={() => setPlaying(true)}
      >
        Show the welcome
      </button>
      {playing && (
        <WelcomeIntro
          onStartTour={() => {
            setLast('Take the tour')
            setPlaying(false)
          }}
          onSkip={() => {
            setLast('Skip')
            setPlaying(false)
          }}
        />
      )}
    </div>
  )
}

const meta = {
  title: 'App/WelcomeIntro',
  component: WelcomeIntro,
  parameters: { layout: 'fullscreen' },
  args: { onStartTour: () => {}, onSkip: () => {} },
} satisfies Meta<typeof WelcomeIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Intro: Story = { render: () => <Replayable /> }
