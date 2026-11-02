import type { Meta, StoryObj } from '@storybook/react-vite'
import { TopNav } from './TopNav'

const meta = {
  title: 'Components/TopNav',
  component: TopNav,
  parameters: { layout: 'fullscreen' },
  // The logo is a hole cut through the bar, open to whatever sits behind it — meaningless over
  // Storybook's own plain canvas, so this wraps it in the same `bg-page-glass` photo every real
  // page already sits on (`App.tsx`), the same way `RunTopBar`'s own story needs no such wrapper
  // only because it has nothing transparent to show through.
  decorators: [
    (Story) => (
      <div className="min-h-[220px] bg-page-glass">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
