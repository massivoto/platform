import { renderWithProviders, screen } from '@/tests/render'
import { expect, describe, it } from 'vitest'
import { ExampleCard } from './ExampleCard.tsx'

describe('ExampleCard', () => {
  it('renders with accessible title and description', () => {
    renderWithProviders(<ExampleCard title="Status" description="Track the latest numbers" />)

    expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByText('Track the latest numbers')).toBeInTheDocument()
  })
})
