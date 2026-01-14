import { useCallback, useEffect, useState } from 'react'
import { parseOAuthHash } from '@massivoto/auth-domain'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface Integration {
  providerId: string
  status: 'connected' | 'revoked' | 'expired'
  connectedAt: string
  expiresAt: string | null
}

export interface UseIntegrationsOptions {
  backendUrl: string
  userId: string
  onSuccess?: (providerId: string) => void
  onError?: (error: string) => void
}

export interface UseIntegrationsResult {
  integrations: Integration[]
  loading: boolean
  error: string | null
  connect: (providerId: string) => void
  disconnect: (providerId: string) => Promise<void>
  refresh: () => Promise<void>
  isConnected: (providerId: string) => boolean
}

// ============================================================================
// Hook
// ============================================================================

export function useIntegrations(options: UseIntegrationsOptions): UseIntegrationsResult {
  const { backendUrl, userId, onSuccess, onError } = options

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch integrations from backend
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${backendUrl}/api/integrations?user_id=${encodeURIComponent(userId)}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch integrations: ${res.status}`)
      }

      const data = await res.json()
      setIntegrations(data.integrations ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load integrations'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [backendUrl, userId, onError])

  // Handle OAuth callback hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hash = window.location.hash
    if (!hash) {
      refresh()
      return
    }

    const parsed = parseOAuthHash(hash)

    // Check if this is an OAuth callback
    if (parsed.provider) {
      // Clear hash from URL
      window.history.replaceState({}, '', window.location.pathname + window.location.search)

      if (parsed.error) {
        const errorMessage = parsed.errorDescription || parsed.error || 'Connection failed'
        toast.error(`Failed to connect to ${parsed.provider}`, {
          description: errorMessage,
        })
        onError?.(errorMessage)
      } else {
        toast.success(`Connected to ${parsed.provider}`, {
          description: 'Your account has been linked successfully.',
        })
        onSuccess?.(parsed.provider)
      }
    }

    // Refresh after handling callback
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initiate OAuth connection
  const connect = useCallback(
    (providerId: string) => {
      if (typeof window === 'undefined') {
        console.warn('connect() called in non-browser environment')
        return
      }
      const currentUrl = window.location.href.split('#')[0]
      const redirectUri = encodeURIComponent(currentUrl)
      const url = `${backendUrl}/oauth/${providerId}/start?user_id=${encodeURIComponent(userId)}&redirect_uri=${redirectUri}`
      window.location.href = url
    },
    [backendUrl, userId]
  )

  // Disconnect provider
  const disconnect = useCallback(
    async (providerId: string) => {
      try {
        const res = await fetch(
          `${backendUrl}/api/integrations/${providerId}?user_id=${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )

        if (!res.ok) {
          throw new Error(`Failed to disconnect: ${res.status}`)
        }

        toast.success(`Disconnected from ${providerId}`)
        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to disconnect'
        toast.error('Disconnect failed', { description: message })
        onError?.(message)
      }
    },
    [backendUrl, userId, refresh, onError]
  )

  // Check if a provider is connected
  const isConnected = useCallback(
    (providerId: string) => {
      return integrations.some((i) => i.providerId === providerId && i.status === 'connected')
    },
    [integrations]
  )

  return {
    integrations,
    loading,
    error,
    connect,
    disconnect,
    refresh,
    isConnected,
  }
}
