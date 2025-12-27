import { expect, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ProviderCard } from './ProviderCard'

describe('ProviderCard', () => {
  it('renders provider details and actions', () => {
    render(
      <MemoryRouter>
        <ProviderCard
          id="openai"
          name="OpenAI"
          logo="/logos/openai.svg"
          about="Connect to OpenAI with your API key."
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: 'OpenAI logo' })).toHaveAttribute(
      'src',
      '/logos/openai.svg',
    )
    expect(screen.getByRole('heading', { name: 'OpenAI' })).toBeInTheDocument()
    expect(screen.getByText('Connect to OpenAI with your API key.')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Connect to OpenAI' })).toHaveAttribute(
      'href',
      '/providers/openai/connect',
    )
    expect(screen.getByRole('link', { name: 'View OpenAI settings' })).toHaveAttribute(
      'href',
      '/providers/openai/settings',
    )
  })
})
