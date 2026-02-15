import { expect, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TokenStateBadge } from './TokenStateBadge.js'

describe('TokenStateBadge', () => {
  it.each([
    ['idle', 'Not Connected', 'badge-neutral'],
    ['connected', 'Connected', 'badge-success'],
    ['error', 'Error', 'badge-error'],
  ] as const)('renders the %s state', (state, label, badgeClass) => {
    render(<TokenStateBadge state={state} />)

    const badge = screen.getByRole('status', {
      name: `Token connection status: ${label}`,
    })

    expect(badge).toHaveTextContent(label)
    expect(badge.className).toContain('badge')
    expect(badge.className).toContain(badgeClass)
    expect(badge).toHaveAttribute('data-state', state)
  })

  it('merges additional class names', () => {
    render(<TokenStateBadge state="connected" className="badge-lg" />)

    const badge = screen.getByRole('status', {
      name: 'Token connection status: Connected',
    })

    expect(badge.className).toContain('badge-lg')
  })
})
