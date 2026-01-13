import { useState, useEffect, useMemo } from 'react'
import { Provider } from '@/lib/providers/provider.types'
import { IntegrationToken } from '@/lib/integration/integration.type'
import {
  buildAuthUrl,
  generateRandomString,
  getRedirectUrl,
  GOOGLE_OAUTH_CONFIG,
  parseOAuthCallback,
} from '@/utilities/oauth-helpers'
import { LocalStorageTokenSaver, revokeGoogleToken } from '@/lib/token-saver/token-saver'
import { useOAuthStorage, OAuthTokenStorage } from '@/hooks/useOAuthStorage'
import { toast } from 'sonner'

export function useGoogleOAuth(provider: Provider, userId: string) {
  const [user, setUser] = useState<OAuthTokenStorage['userInfo'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const providerId = provider.id || provider.name.toLowerCase().replace(/\s+/g, '_')
  const tokenSaver = useMemo(() => new LocalStorageTokenSaver(userId), [userId])
  const { saveData, loadData, removeData } = useOAuthStorage()

  /* ---------- Fetch Google user ---------- */
  const fetchUserInfo = async (accessToken: string) => {
    const res = await fetch(GOOGLE_OAUTH_CONFIG.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error('Failed to fetch user info')
    return res.json()
  }

  /* ---------- Persist tokens ---------- */
  const persistTokens = async (accessToken: string) => {
    setLoading(true)
    try {
      const googleUser = await fetchUserInfo(accessToken)
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 3600_000).toISOString()

      const userInfo: OAuthTokenStorage['userInfo'] = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      }

      setUser(userInfo)

      // Save OAuth state for UI
      saveData<OAuthTokenStorage>(providerId, 'oauth-token', {
        providerId,
        providerName: provider.name,
        expiresAt,
        connectedAt: now,
        userInfo,
      })

      // Save technical token
      const scopes =
        GOOGLE_OAUTH_CONFIG.scopes[provider.name as keyof typeof GOOGLE_OAUTH_CONFIG.scopes] ?? []

      const integrationToken: IntegrationToken = {
        integrationId: providerId,
        kind: provider.kind,
        accessToken: { rawValue: accessToken },
        refreshToken: null,
        idToken: null,
        expiresAt,
        scopes: [...scopes],
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
        revoked: false,
      }

      tokenSaver.saveToken(providerId, integrationToken)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OAuth error')
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Connect ---------- */
  const connect = () => {
    if (!GOOGLE_OAUTH_CONFIG.clientId) {
      setError('GOOGLE_CLIENT_ID not configured')
      return
    }

    const state = generateRandomString(32)
    sessionStorage.setItem(`oauth_state_${provider.name}`, state)
    sessionStorage.setItem('current_provider', provider.name)

    const scopes =
      GOOGLE_OAUTH_CONFIG.scopes[provider.name as keyof typeof GOOGLE_OAUTH_CONFIG.scopes] ?? []

    const authUrl = buildAuthUrl({
      clientId: GOOGLE_OAUTH_CONFIG.clientId,
      redirectUri: getRedirectUrl(),
      state,
      scopes: [...scopes],
    })

    window.location.href = authUrl
  }

  /* ---------- Disconnect ---------- */
  const disconnect = async () => {
    const rawToken = tokenSaver.loader.loadRawTokens().get(providerId)?.accessToken?.rawValue
    if (rawToken) {
      try {
        await revokeGoogleToken(rawToken)
      } catch {}
    }

    tokenSaver.removeToken(providerId)
    removeData(providerId, 'oauth-token')
    setUser(null)

    toast.success(`Disconnected from ${provider.name}`)
  }

  /* ---------- OAuth callback ---------- */
  useEffect(() => {
    if (sessionStorage.getItem('current_provider') !== provider.name) return

    const { accessToken, error: oauthError, state } = parseOAuthCallback()
    const savedState = sessionStorage.getItem(`oauth_state_${provider.name}`)

    if (oauthError) setError(oauthError)
    else if (state !== savedState) setError('OAuth state mismatch')
    else if (accessToken) persistTokens(accessToken)

    window.history.replaceState({}, document.title, window.location.pathname)
    sessionStorage.removeItem(`oauth_state_${provider.name}`)
    sessionStorage.removeItem('current_provider')
  }, [provider.name])

  /* ---------- Hydration ---------- */
  useEffect(() => {
    const stored = loadData<OAuthTokenStorage>(providerId, 'oauth-token')
    if (stored?.userInfo) setUser(stored.userInfo)
  }, [providerId])

  return { user, error, loading, connect, disconnect }
}
