import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SimpleButton } from './SimpleButton'

describe('SimpleButton', () => {
  it('renders with default styles', () => {
    render(<SimpleButton>Click me</SimpleButton>)

    const button = screen.getByRole('button', { name: 'Click me' })

    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
    expect(button).toHaveClass('text-primary-foreground')
  })

  it('applies variant classes when provided', () => {
    render(<SimpleButton variant="outline">Outline</SimpleButton>)

    const button = screen.getByRole('button', { name: 'Outline' })

    expect(button).toHaveClass('border-input')
    expect(button).toHaveClass('bg-background')
  })

  it('merges extraClasses and className props', () => {
    render(
      <SimpleButton className="w-full" extraClasses="data-[state=open]:bg-accent">
        With classes
      </SimpleButton>,
    )

    const button = screen.getByRole('button', { name: 'With classes' })

    expect(button).toHaveClass('w-full')
    expect(button).toHaveClass('data-[state=open]:bg-accent')
  })

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<SimpleButton onClick={handleClick}>Action</SimpleButton>)

    const button = screen.getByRole('button', { name: 'Action' })

    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
