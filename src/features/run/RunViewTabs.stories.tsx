import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Tabs } from '../../components/Tabs'
import { runMessyPending } from '../../fixtures'
import { RunViewTabs } from './RunViewTabs'

const meta = {
  title: 'Features/Run/RunViewTabs',
  component: RunViewTabs,
  args: { run: runMessyPending, view: 'story' },
  decorators: [
    (Story) => {
      const [value, setValue] = useState('story')
      return (
        <Tabs value={value} onValueChange={setValue}>
          <Story />
        </Tabs>
      )
    },
  ],
} satisfies Meta<typeof RunViewTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
