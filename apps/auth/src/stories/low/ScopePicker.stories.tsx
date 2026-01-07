import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'

import { ScopePicker } from '@/components/ScopePicker'

const meta: Meta<typeof ScopePicker> = {
  title: 'Low/ScopePicker',
  component: ScopePicker,
  parameters: {
    layout: 'centered',
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ScopePicker>

export const Default: Story = {}
