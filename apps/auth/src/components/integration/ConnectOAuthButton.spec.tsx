import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConnectOAuthButton } from './ConnectOAuthButton.js'
import { useHandlers, resetHandlers } from '@/mocks/http/server'
import { Handler, json } from '@/mocks/http/handlers'
import { Provider, ProviderKind } from '@/lib/providers/provider.types'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/dashboard',
  hash: '',
  pathname: '/dashboard',
  search: '',
  origin: 'http://localhost:3000',
}

describe('ConnectOAuthButton', () => {
  const mockProvider: Provider = {
    id: 'google',
    name: 'Google',
    logo: 'https://example.com/google.png',
    about: 'Google OAuth provider',
    scopes: ['email', 'profile'],
    kind: ProviderKind.OAUTH,
    categories: ['email'],
  }

  const userId = 'user-123'

  // In-memory store for tests
  let integrationsDb: Map<string, { providerId: string; status: string; connectedAt: string; expiresAt: string | null }>

  const createHandlers = (): Handler[] => [
    {
      method: 'GET',
      path: '/api/integrations',
      handle: () => {
        const integrations = Array.from(integrationsDb.values())
        return json({ integrations })
      },
    },
    {
      method: 'DELETE',
      path: '/api/integrations/:providerId',
      handle: ({ params }) => {
        const deleted = integrationsDb.delete(params.providerId!)
        if (!deleted) {
          return json({ error: 'Integration not found' }, { status: 404 })
        }
        return json({ deleted: true })
      },
    },
  ]

  beforeEach(() => {
    integrationsDb = new Map()
    useHandlers(createHandlers())

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...mockLocation },
      writable: true,
    })

    // Mock window.history.replaceState
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    resetHandlers()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    // R-MOCKTEST-64: Test shows loading state
    it('should show loading state initially', () => {
      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    // R-MOCKTEST-61: Test renders connect state when not connected
    it('should show connect button when not connected', async () => {
      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByText(`Connect with ${mockProvider.name}`)).toBeInTheDocument()
    })

    // R-MOCKTEST-62: Test renders connected state with provider info
    it('should show connected state when provider is connected', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })

      expect(screen.getByText('Disconnect')).toBeInTheDocument()
      expect(screen.getByText(mockProvider.name)).toBeInTheDocument()
    })

    it('should show provider logo when connected', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument()
      })

      const logo = screen.getByAltText(mockProvider.name)
      expect(logo).toHaveAttribute('src', mockProvider.logo)
    })
  })

  describe('connect action', () => {
    // R-MOCKTEST-63: Test click triggers connect()
    it('should redirect to OAuth start endpoint on connect', async () => {
      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      const connectButton = screen.getByText(`Connect with ${mockProvider.name}`)
      fireEvent.click(connectButton)

      // Check redirect URL contains expected parts
      expect(window.location.href).toContain('/oauth/google/start')
      expect(window.location.href).toContain(`user_id=${encodeURIComponent(userId)}`)
    })
  })

  describe('disconnect action', () => {
    it('should show confirmation dialog on disconnect click', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
      })

      // Click disconnect button to open dialog
      fireEvent.click(screen.getByText('Disconnect'))

      // Check dialog content
      await waitFor(() => {
        expect(screen.getByText('Confirm Disconnect')).toBeInTheDocument()
        expect(screen.getByText(`Are you sure you want to disconnect from ${mockProvider.name}?`)).toBeInTheDocument()
      })
    })

    it('should disconnect when confirmed', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
      })

      // Open dialog
      fireEvent.click(screen.getByText('Disconnect'))

      // Confirm disconnect (there are two Disconnect buttons - one trigger, one action)
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Click the confirm button inside the dialog
      const confirmButton = screen.getAllByRole('button').find(
        btn => btn.textContent === 'Disconnect' && btn.closest('[role="alertdialog"]')
      )
      expect(confirmButton).toBeDefined()
      fireEvent.click(confirmButton!)

      // Should show connect button after disconnect
      await waitFor(() => {
        expect(screen.getByText(`Connect with ${mockProvider.name}`)).toBeInTheDocument()
      })
    })

    it('should close dialog on cancel', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
      })

      // Open dialog
      fireEvent.click(screen.getByText('Disconnect'))

      await waitFor(() => {
        expect(screen.getByText('Confirm Disconnect')).toBeInTheDocument()
      })

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'))

      // Dialog should close, still show connected state
      await waitFor(() => {
        expect(screen.queryByText('Confirm Disconnect')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    // R-MOCKTEST-65: Test shows error state when OAuth fails
    it('should display error message when fetch fails', async () => {
      useHandlers([
        {
          method: 'GET',
          path: '/api/integrations',
          handle: () => json({ error: 'Server error' }, { status: 500 }),
        },
      ])

      render(<ConnectOAuthButton provider={mockProvider} userId={userId} />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch integrations/)).toBeInTheDocument()
      })
    })
  })
})
