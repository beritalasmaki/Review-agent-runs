import type { Meta, StoryObj } from '@storybook/react-vite'
import { TerrainBackdrop } from './TerrainBackdrop'

const meta = {
  title: 'Components/TerrainBackdrop',
  component: TerrainBackdrop,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <div className="m-[var(--space-6)] max-w-sm rounded-lg border border-border-subtle bg-surface p-[var(--space-5)] text-body text-text-primary">
        A card on the page: opaque, so text never sits on the terrain itself.
      </div>
    ),
  },
} satisfies Meta<typeof TerrainBackdrop>

export default meta
type Story = StoryObj<typeof meta>

/** Dark theme only; switch the Storybook theme to light and the backdrop disappears. */
export const Default: Story = {}
