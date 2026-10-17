import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide'
import { MorphIcon } from './MorphIcon'

const meta = {
  title: 'Components/MorphIcon',
  component: MorphIcon,
  args: { icon: ChevronDown, className: 'h-6 w-6 text-text-primary' },
} satisfies Meta<typeof MorphIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = { args: { icon: ChevronDown } }

export const Open: Story = { args: { icon: ChevronUp } }

/** Click to morph between the two states — the only way to see the spring animation itself. */
export const Interactive: Story = {
  render: (args) => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-text-primary"
        >
          {open ? 'Hide' : 'Show'}
          <MorphIcon {...args} icon={open ? ChevronUp : ChevronDown} />
        </button>
      )
    }
    return <Demo />
  },
}

/** `reducedMotion="never"` (morphicons' own default, overriding MorphIcon's) — jumps instantly,
 * so this story's own screenshot is stable without clicking through a spring animation. */
export const ReducedMotion: Story = {
  args: { icon: ChevronUp, reducedMotion: 'always' },
}
