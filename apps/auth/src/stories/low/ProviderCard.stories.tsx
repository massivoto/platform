import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

import { ProviderCard } from '@/components/ProviderCard'

const meta: Meta<typeof ProviderCard> = {
  title: 'Low/ProviderCard',
  component: ProviderCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-sm">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/openai.svg',
    about: 'Connect to OpenAI with your API key.',
  },
}

export default meta

type Story = StoryObj<typeof ProviderCard>

export const Default: Story = {}

export const LongDescription: Story = {
  args: {
    about:
      'Connect to OpenAI with your API key to unlock advanced language models, embeddings, and moderation capabilities across your workspace.',
  },
}
