import type { Meta, StoryObj } from '@storybook/react'

import { TokenStateBadge } from '@/components/TokenStateBadge.js'

const meta: Meta<typeof TokenStateBadge> = {
  title: 'Components/TokenStateBadge',
  component: TokenStateBadge,
  args: {
    state: 'idle',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'connected', 'error'],
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof TokenStateBadge>

export const Idle: Story = {}

export const Connected: Story = {
  args: {
    state: 'connected',
  },
}

export const Error: Story = {
  args: {
    state: 'error',
  },
}
