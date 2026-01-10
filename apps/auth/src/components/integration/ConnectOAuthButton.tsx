/**
 * ConnectOAuth Component - Supports Google OAuth
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { IntegrationToken } from '@/lib/integration/integration.type.js'
import { Provider } from '@/lib/providers/provider.types.js'
import { LocalStorageTokenSaver, revokeGoogleToken } from '@/lib/token-saver/token-saver'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

interface OAuthConfigType {
  clientId: string
  authEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
  scopes: Record<string, string[]>
}

const GOOGLE_OAUTH_CONFIG: OAuthConfigType = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scopes: {
    Gmail: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://mail.google.com/',
      // Granular Gmail scopes for add-on style permissions
      'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
      'https://www.googleapis.com/auth/gmail.addons.current.message.action',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.compose',
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
}

const REDIRECT_URI = window.location.origin + '/dashboard'

export function ConnectOAuthButton({ provider, userId }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Initialize token saver
  const tokenSaver = new LocalStorageTokenSaver(userId)

  // Storage keys for user info
  const storageKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_user`

  // Generate random string for state
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
      if (!GOOGLE_OAUTH_CONFIG.clientId) {
        setError('GOOGLE_CLIENT_ID is not configured. Please check your .env file')
        return
      }

      const state = generateRandomString(32)
      sessionStorage.setItem(`oauth_state_${provider.name}`, state)
      sessionStorage.setItem('current_provider', provider.name)

      // Get scopes for this specific provider
      const scopesArray =
        GOOGLE_OAUTH_CONFIG.scopes[provider.name as keyof typeof GOOGLE_OAUTH_CONFIG.scopes] || []
      const scopes = scopesArray.join(' ')

      const params = {
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        redirect_uri: REDIRECT_URI,
        response_type: 'token',
        state: state,
        scope: scopes,
        prompt: 'consent',
      }

      const authUrl = `${GOOGLE_OAUTH_CONFIG.authEndpoint}?${new URLSearchParams(params)}`
      window.location.href = authUrl
    } catch (err) {
      setError('Connection error: ' + (err as Error).message)
    }
  }

  // Fetch user info from Google
  const fetchGoogleUserInfo = async (accessToken: string): Promise<UserInfo> => {
    const response = await fetch(GOOGLE_OAUTH_CONFIG.userInfoEndpoint, {
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

  // Process access token and save
  const processAccessToken = async (accessToken: string): Promise<void> => {
    try {
      setLoading(true)

      // Fetch user info from Google
      const userInfo = await fetchGoogleUserInfo(accessToken)

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

      const scopesArray =
        GOOGLE_OAUTH_CONFIG.scopes[provider.name as keyof typeof GOOGLE_OAUTH_CONFIG.scopes] || []

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

    const accessToken = hashParams.get('access_token')
    const errorParam = hashParams.get('error')
    const state = hashParams.get('state')
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
      processAccessToken(accessToken).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
        sessionStorage.removeItem(`oauth_state_${provider.name}`)
        sessionStorage.removeItem('current_provider')
      })
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
  const handleLogout = async (): Promise<void> => {
    if (!user) return

    const providerId = provider.id || provider.name.toLowerCase().replace(/\s+/g, '_')
    const rawToken = tokenSaver.loader.loadRawTokens().get(providerId)

    if (rawToken?.accessToken?.rawValue) {
      try {
        await revokeGoogleToken(rawToken.accessToken.rawValue).catch(() => {
          // Ignore CORS failure — token is likely revoked anyway
        })
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        }
      }
    }

    // Remove from local storage
    tokenSaver.removeToken(providerId)

    // Clear UI
    setUser(null)
    localStorage.removeItem(storageKey)

    toast.success('Successfully disconnected from ' + provider.name, {
      description: `You have logged out from ${provider.name}.`,
    })
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
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
              <p className="text-xs text-blue-600 mt-1">{provider.name}</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                  Disconnect
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out from {provider.name}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleLogout()
                    }}
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          onClick={handleConnect}
          disabled={loading}
        >
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
          <span>Connect with {provider.name}</span>
        </button>
      )}
    </div>
  )
}
