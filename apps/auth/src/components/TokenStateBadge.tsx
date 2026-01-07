// R-BUILD-42: Token connection status indicator.

type TokenState = 'idle' | 'connected' | 'error'

interface TokenStateBadgeProps {
  state: TokenState
  className?: string
}

const STATE_VARIANTS: Record<TokenState, { label: string; badgeClass: string }> = {
  idle: {
    label: 'Not Connected',
    badgeClass: 'badge-neutral',
  },
  connected: {
    label: 'Connected',
    badgeClass: 'badge-success',
  },
  error: {
    label: 'Error',
    badgeClass: 'badge-error',
  },
}

export const TokenStateBadge = ({ state, className = '' }: TokenStateBadgeProps) => {
  const { label, badgeClass } = STATE_VARIANTS[state]

  const composedClassName = ['badge badge-sm font-medium', badgeClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={composedClassName}
      role="status"
      aria-live="polite"
      aria-label={`Token connection status: ${label}`}
      data-state={state}
    >
      {label}
    </span>
  )
}
