import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

import { ProviderCard } from '@/components/ProviderCard.js'

const meta: Meta<typeof ProviderCard> = {
  title: 'Components/ProviderCard',
  component: ProviderCard,
  args: {
    id: 'openai',
    name: 'OpenAI',
    logo: 'https://picsum.photos/seed/openai/96/96',
    about: 'Connect to OpenAI to power AI-driven messaging and automation flows.',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-md">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof ProviderCard>

export const Default: Story = {}

export const WithLongDescription: Story = {
  args: {
    about:
      'This integration provides advanced tooling, observability, and real-time analytics across the entire messaging stack.',
  },
}
