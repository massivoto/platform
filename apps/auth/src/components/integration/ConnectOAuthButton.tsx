/**
 * ConnectOAuth Component - Supports Google and GitHub OAuth
 */
import { Provider } from '@/lib/providers/provider.types.js'
import { useEffect, useState } from 'react'
import { IntegrationToken } from '@/lib/integration/integration.type.js'
import { LocalStorageTokenSaver } from '@/lib/token-saver/token-saver'

interface Props {
  provider: Provider
  userId: string
}

// Type definitions
interface UserInfo {
  email: string
  name: string
  picture?: string
  provider: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

interface GitHubUserResponse {
  login: string
  name: string
  email: string
  avatar_url: string
}

// OAuth Configuration per provider
interface OAuthConfigType {
  clientId: string
  authEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
  scopes: Record<string, string[]>
}

const OAUTH_CONFIG: Record<string, OAuthConfigType> = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: {
      Gmail: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://mail.google.com/',
      ],
      'Google Calendar': [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      'Google Drive': [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    },
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    authEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    userInfoEndpoint: 'https://api.github.com/user',
    scopes: {
      GitHub: ['user', 'repo', 'read:org'],
    },
  },
}

const REDIRECT_URI = window.location.origin + '/dashboard'

export function ConnectOAuthButton({ provider, userId }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Determine provider type (google or github)
  const providerType = provider.name.toLowerCase().includes('github') ? 'github' : 'google'
  const config = OAUTH_CONFIG[providerType]

  if (!config) {
    throw new Error(`Unsupported provider type: ${providerType}`)
  }

  // Initialize token saver
  const tokenSaver = new LocalStorageTokenSaver(userId)

  // Storage keys for user info
  const storageKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_user`

  // Generate random string for state/verifier
  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let result = ''
    const randomValues = new Uint8Array(length)
    crypto.getRandomValues(randomValues)
    randomValues.forEach((byte) => {
      result += chars[byte % chars.length]
    })
    return result
  }

  // Initiate OAuth login
  const handleConnect = async () => {
    try {
      if (!config.clientId) {
        setError(
          `${providerType.toUpperCase()} CLIENT_ID is not configured. Please check your .env file`,
        )
        return
      }

      const state = generateRandomString(32)
      sessionStorage.setItem(`oauth_state_${provider.name}`, state)
      sessionStorage.setItem('current_provider', provider.name)

      // Get scopes for this specific provider
      const scopesArray = config.scopes[provider.name as keyof typeof config.scopes] || []
      const scopes = scopesArray.join(' ')

      const params: Record<string, string> = {
        client_id: config.clientId,
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: scopes,
      }

      // Provider-specific parameters
      if (providerType === 'google') {
        params.response_type = 'token'
        params.prompt = 'consent'
      } else if (providerType === 'github') {
        params.allow_signup = 'true'
      }

      const authUrl = `${config.authEndpoint}?${new URLSearchParams(params)}`
      console.log(`🌐 Connecting to ${provider.name}...`)
      window.location.href = authUrl
    } catch (err) {
      setError('Connection error: ' + (err as Error).message)
      console.error('Connection Error:', err)
    }
  }

  // Fetch user info from Google
  const fetchGoogleUserInfo = async (accessToken: string): Promise<UserInfo> => {
    const response = await fetch(config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) throw new Error('Failed to fetch user data')

    const data = await response.json()
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: provider.name,
    }
  }

  // Fetch user info from GitHub
  const fetchGitHubUserInfo = async (accessToken: string): Promise<UserInfo> => {
    const response = await fetch(config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) throw new Error('Failed to fetch user data')

    const data: GitHubUserResponse = await response.json()

    // GitHub might not return email in the basic user endpoint
    let email = data.email
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })
      if (emailResponse.ok) {
        const emails = await emailResponse.json()
        const primaryEmail = emails.find((e: any) => e.primary)
        email = primaryEmail?.email || emails[0]?.email || 'no-email@github.com'
      }
    }

    return {
      email: email || 'no-email@github.com',
      name: data.name || data.login,
      picture: data.avatar_url,
      provider: provider.name,
    }
  }

  // Process access token and save
  const processAccessToken = async (accessToken: string): Promise<void> => {
    try {
      setLoading(true)

      // Fetch user info based on provider type
      const userInfo =
        providerType === 'github'
          ? await fetchGitHubUserInfo(accessToken)
          : await fetchGoogleUserInfo(accessToken)

      console.log(`👤 User ${provider.name}:`, userInfo.name)

      setUser(userInfo)
      setError(null)

      // Save user info for display purposes
      localStorage.setItem(storageKey, JSON.stringify(userInfo))

      // Create IntegrationToken object
      const now = new Date().toISOString()
      const providerId = provider.id || provider.name.toLowerCase().replace(/\s+/g, '_')

      // Note: Implicit flow doesn't provide exact expiry
      // We'll set a conservative expiry (1 hour)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      const scopesArray = config.scopes[provider.name as keyof typeof config.scopes] || []

      const integrationToken: IntegrationToken = {
        integrationId: providerId,
        kind: provider.kind,
        accessToken: {
          rawValue: accessToken,
        },
        refreshToken: null,
        idToken: null,
        expiresAt: expiresAt.toISOString(),
        scopes: scopesArray.map((s) => s.toString()),
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
        revoked: false,
      }

      // Save token using LocalStorageTokenSaver
      tokenSaver.saveToken(providerId, integrationToken)
      console.log(`💾 Token saved for provider ${providerId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const urlParams = new URLSearchParams(window.location.search)

    // Google uses hash, GitHub uses query params
    const accessToken = hashParams.get('access_token') || urlParams.get('access_token')
    const code = urlParams.get('code') // GitHub returns code, not token
    const errorParam = hashParams.get('error') || urlParams.get('error')
    const state = hashParams.get('state') || urlParams.get('state')
    const currentProvider = sessionStorage.getItem('current_provider')

    // Only process if this is for the current provider
    if (currentProvider !== provider.name) return

    if (errorParam) {
      setError('Authentication cancelled or failed: ' + errorParam)
      window.history.replaceState({}, document.title, window.location.pathname)
      sessionStorage.removeItem('current_provider')
      return
    }

    // Verify state
    if (state) {
      const savedState = sessionStorage.getItem(`oauth_state_${provider.name}`)
      if (state !== savedState) {
        setError('Security error: state mismatch')
        return
      }
    }

    // Process token
    if (accessToken) {
      processAccessToken(accessToken)
      window.history.replaceState({}, document.title, window.location.pathname)
      sessionStorage.removeItem(`oauth_state_${provider.name}`)
      sessionStorage.removeItem('current_provider')
    } else if (code && providerType === 'github') {
      // GitHub returns a code that needs to be exchanged
      // Note: This requires a backend endpoint to exchange the code
      setError('GitHub OAuth requires a backend to exchange the code.')
      console.log(code)
      console.error(error)
    }
  }, [provider.name])

  // Check if already connected on load
  useEffect(() => {
    const userInfo = localStorage.getItem(storageKey)
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo))
      } catch (e) {
        localStorage.removeItem(storageKey)
      }
    }
  }, [storageKey])

  // Logout
  const handleLogout = (): void => {
    setUser(null)
    localStorage.removeItem(storageKey)

    // Revoke token using LocalStorageTokenSaver
    const providerId = provider.id || provider.name.toLowerCase().replace(/\s+/g, '_')
    tokenSaver.revokeToken(providerId)

    console.log(`🔓 Logged out from ${provider.name}`)
  }

  return (
    <div className="mt-3">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Connecting...</p>
        </div>
      ) : user ? (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {user.picture && (
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm"> {user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
              <p className="text-xs text-blue-600 mt-1">{provider.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          onClick={handleConnect}
          disabled={loading}
        >
          {providerType === 'google' ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          <span>Connect with {provider.name}</span>
        </button>
      )}
    </div>
  )
}
