// @ts-ignore - Vite env types
import { toast } from 'sonner'
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || ''

export const GOOGLE_OAUTH_CONFIG = {
  clientId: GOOGLE_CLIENT_ID,
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scopes: {
    Gmail: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://mail.google.com/',
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
} as const

/**
 * Generate a cryptographically secure random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  randomValues.forEach((byte) => {
    result += chars[byte % chars.length]
  })
  return result
}

/**
 * Get the OAuth redirect URI
 */
export function getRedirectUrl(): string {
  return window.location.origin + '/dashboard'
}

/**
 * Parameters for building OAuth authorization URL
 */
interface BuildAuthUrlParams {
  clientId: string
  redirectUri: string
  state: string
  scopes: string[]
  prompt?: string
}

/**
 * Build Google OAuth authorization URL
 */
export function buildAuthUrl({
  clientId,
  redirectUri,
  state,
  scopes,
  prompt = 'consent',
}: BuildAuthUrlParams): string {
  const params = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    state: state,
    scope: scopes.join(' '),
    prompt,
  }

  return `${GOOGLE_OAUTH_CONFIG.authEndpoint}?${new URLSearchParams(params)}`
}

/**
 * Result from parsing OAuth callback
 */
interface OAuthCallbackResult {
  accessToken: string | null
  error: string | null
  state: string | null
}

/**
 * Parse OAuth callback parameters from URL hash
 */
export function parseOAuthCallback(): OAuthCallbackResult {
  const hash = window.location.hash.substring(1)
  const hashParams = new URLSearchParams(hash)

  return {
    accessToken: hashParams.get('access_token'),
    error: hashParams.get('error'),
    state: hashParams.get('state'),
  }
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = (text: string) => {
  if (!text) return

  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success('Copied to clipboard', {
        description: 'API key has been copied to your clipboard.',
      })
    })
    .catch((err) => {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy', {
        description: 'Could not copy to clipboard.',
      })
    })
}
