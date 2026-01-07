import type { Meta, StoryObj } from '@storybook/react'
import { Activity } from 'lucide-react'

import { ExampleCard } from '@/components/ExampleCard'

const meta: Meta<typeof ExampleCard> = {
  title: 'Components/ExampleCard',
  component: ExampleCard,
  args: {
    title: 'Status Overview',
    description: 'Track the latest numbers at a glance.',
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof ExampleCard>

export const Default: Story = {}

export const WithIcon: Story = {
  args: {
    icon: Activity,
    title: 'Active Providers',
    description: '23 integrations live right now.',
    className: 'max-w-sm',
  },
}
