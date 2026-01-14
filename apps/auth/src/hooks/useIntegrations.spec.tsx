import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useIntegrations, Integration } from './useIntegrations'
import { useHandlers, resetHandlers } from '@/mocks/http/server'
import { Handler, json } from '@/mocks/http/handlers'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock window.location for connect() redirect tests
const mockLocation = {
  href: 'http://localhost:3000/dashboard',
  hash: '',
  pathname: '/dashboard',
  search: '',
  origin: 'http://localhost:3000',
}

describe('useIntegrations', () => {
  const backendUrl = 'http://localhost:4000'
  const userId = 'user-123'

  // In-memory store for tests
  let integrationsDb: Map<string, Integration>

  // Default handlers for the integrations API
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
      method: 'GET',
      path: '/api/integrations/:providerId',
      handle: ({ params }) => {
        const integration = integrationsDb.get(params.providerId!)
        if (!integration) {
          return json({ error: 'Integration not found' }, { status: 404 })
        }
        return json(integration)
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

  describe('initial load', () => {
    it('should fetch integrations on mount', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      // Initially loading
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.integrations).toHaveLength(1)
      expect(result.current.integrations[0]?.providerId).toBe('google')
      expect(result.current.error).toBeNull()
    })

    it('should return empty array when no integrations', async () => {
      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.integrations).toEqual([])
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      const onError = vi.fn()
      useHandlers([
        {
          method: 'GET',
          path: '/api/integrations',
          handle: () => json({ error: 'Server error' }, { status: 500 }),
        },
      ])

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId, onError })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch integrations: 500')
      expect(onError).toHaveBeenCalledWith('Failed to fetch integrations: 500')
    })
  })

  describe('isConnected', () => {
    it('should return true for connected provider', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isConnected('google')).toBe(true)
      expect(result.current.isConnected('github')).toBe(false)
    })

    it('should return false for revoked provider', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'revoked',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isConnected('google')).toBe(false)
    })
  })

  describe('disconnect', () => {
    it('should disconnect and refresh integrations', async () => {
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.integrations).toHaveLength(1)

      await act(async () => {
        await result.current.disconnect('google')
      })

      expect(result.current.integrations).toHaveLength(0)
    })

    it('should handle disconnect error', async () => {
      const onError = vi.fn()

      // Return 404 on DELETE
      useHandlers([
        {
          method: 'GET',
          path: '/api/integrations',
          handle: () => json({ integrations: [] }),
        },
        {
          method: 'DELETE',
          path: '/api/integrations/:providerId',
          handle: () => json({ error: 'Not found' }, { status: 404 }),
        },
      ])

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId, onError })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.disconnect('nonexistent')
      })

      expect(onError).toHaveBeenCalledWith('Failed to disconnect: 404')
    })
  })

  describe('connect', () => {
    // R-MOCKTEST-46: Test connect() redirects to correct backend URL
    it('should redirect to OAuth start endpoint', async () => {
      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.connect('google')
      })

      // Check that window.location.href was set to the OAuth URL
      expect(window.location.href).toContain(`${backendUrl}/oauth/google/start`)
      expect(window.location.href).toContain(`user_id=${encodeURIComponent(userId)}`)
      expect(window.location.href).toContain('redirect_uri=')
    })
  })

  describe('OAuth callback handling', () => {
    // R-MOCKTEST-41: Test detects success hash on mount
    it('should parse success callback from hash and call onSuccess', async () => {
      const onSuccess = vi.fn()

      // Simulate OAuth callback hash
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#provider=google&status=success',
        },
        writable: true,
      })

      renderHook(() =>
        useIntegrations({ backendUrl, userId, onSuccess })
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('google')
      })

      // Should clear hash from URL
      expect(window.history.replaceState).toHaveBeenCalled()
    })

    // R-MOCKTEST-42: Test refresh() is called after detecting success hash
    it('should call refresh() after detecting success hash', async () => {
      const onSuccess = vi.fn()

      // Add an integration that will be fetched on refresh
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      // Simulate OAuth success callback hash
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#provider=google&status=success',
        },
        writable: true,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId, onSuccess })
      )

      // Wait for both onSuccess and integrations to load (refresh was called)
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('google')
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify refresh was called by checking integrations were loaded
      expect(result.current.integrations).toHaveLength(1)
      expect(result.current.integrations[0]?.providerId).toBe('google')
    })

    // R-MOCKTEST-43: Test clears hash from URL after processing
    it('should clear hash from URL using history.replaceState', async () => {
      // Simulate OAuth callback hash
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#provider=google&status=success',
        },
        writable: true,
      })

      renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          '/dashboard'
        )
      })
    })

    // R-MOCKTEST-44: Test detects error hash and exposes error
    it('should parse error callback from hash and call onError', async () => {
      const onError = vi.fn()

      // Simulate OAuth error callback hash
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#provider=github&error=access_denied&error_description=User%20denied',
        },
        writable: true,
      })

      renderHook(() =>
        useIntegrations({ backendUrl, userId, onError })
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('User denied')
      })
    })

    // R-MOCKTEST-45: Test does not trigger on unrelated hash fragments
    it('should not trigger callbacks on unrelated hash fragments', async () => {
      const onSuccess = vi.fn()
      const onError = vi.fn()

      // Simulate unrelated hash (e.g., anchor link)
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#section-about',
        },
        writable: true,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId, onSuccess, onError })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Neither callback should have been called
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()

      // Hash should NOT have been cleared (no OAuth hash to process)
      expect(window.history.replaceState).not.toHaveBeenCalled()
    })

    it('should not trigger callbacks on empty hash', async () => {
      const onSuccess = vi.fn()
      const onError = vi.fn()

      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '',
        },
        writable: true,
      })

      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId, onSuccess, onError })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('should re-fetch integrations', async () => {
      const { result } = renderHook(() =>
        useIntegrations({ backendUrl, userId })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.integrations).toHaveLength(0)

      // Add integration to DB
      integrationsDb.set('google', {
        providerId: 'google',
        status: 'connected',
        connectedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
      })

      // Manually refresh
      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.integrations).toHaveLength(1)
    })
  })
})
