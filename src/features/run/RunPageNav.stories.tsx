import type { Meta, StoryObj } from '@storybook/react-vite'
import { RunPageNav } from './RunPageNav'

const meta = {
  title: 'Features/Run/RunPageNav',
  component: RunPageNav,
  parameters: { layout: 'padded' },
  args: { reviewsHref: '#' },
} satisfies Meta<typeof RunPageNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
