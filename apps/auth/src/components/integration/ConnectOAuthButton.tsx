/**
 * ConnectOAuth Component - FRONTEND ONLY
 * Gère uniquement la connexion PKCE et envoie au backend
 */
import { Provider } from '@/lib/providers/provider.types.js'
import { useEffect, useState } from 'react'

interface Props {
  provider: Provider
}

// Type definitions
interface UserInfo {
  email: string
  name: string
  picture?: string
  token: string
  provider: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

// Configuration - Frontend only
const CLIENT_ID = '307670974118-oecea42ekojo7k0ou6cae6fvqov26a3h.apps.googleusercontent.com'
const REDIRECT_URI = 'http://localhost:8080/dashboard'
const BACKEND_URL = 'http://localhost:3000' // Votre backend Express

// ✅ PKCE must be enabled for frontend OAuth
const USE_PKCE = true

// Scopes simplifiés pour commencer
// Scopes par provider
const PROVIDER_SCOPES: Record<string, string> = {
  Gmail: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
    'https://www.googleapis.com/auth/gmail.addons.current.message.action',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.compose',
  ].join(' '),
  'Google Calendar': [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' '),
  'Google Drive': [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ].join(' '),
}

export function ConnectOAuthButton({ provider }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Storage keys
  const storageKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_user`
  const tokenKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_token`
  const refreshTokenKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_refresh_token`

  // Générer une chaîne aléatoire pour PKCE
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

  // Créer le code_challenge pour PKCE
  const sha256 = async (plain: string): Promise<ArrayBuffer> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await crypto.subtle.digest('SHA-256', data)
  }

  const base64urlencode = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const hashed = await sha256(verifier)
    return base64urlencode(hashed)
  }

  // Initier le login avec PKCE (FRONTEND ONLY)
  const handleConnect = async () => {
    try {
      const state = generateRandomString(32)
      sessionStorage.setItem(`oauth_state_${provider.name}`, state)
      sessionStorage.setItem('current_provider', provider.name)

      // Scopes pour ce provider
      const scopes = PROVIDER_SCOPES[provider.name] || PROVIDER_SCOPES['Gmail']

      // Code verifier pour PKCE
      const codeVerifier = generateRandomString(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Sauvegarder pour l'échange de token
      sessionStorage.setItem(`code_verifier_${provider.name}`, codeVerifier)

      const params: Record<string, string> = {
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: scopes as string,
        state: state,
        access_type: 'offline',
        prompt: 'consent',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(params)}`

      console.log(`🌐 Redirection vers ${provider.name} OAuth...`)
      window.location.href = authUrl
    } catch (err) {
      setError('Erreur PKCE: ' + (err as Error).message)
      console.error('PKCE Error:', err)
    }
  }

  // 🔄 ENVOYER AU BACKEND pour l'échange de token
  const exchangeCodeForToken = async (code: string, codeVerifier: string): Promise<void> => {
    try {
      setLoading(true)
      console.log('📡 Envoi au backend pour échange de token...')

      const response = await fetch(`${BACKEND_URL}/api/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          codeVerifier: codeVerifier,
          redirectUri: REDIRECT_URI,
          provider: provider.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Backend error:', errorData)

        let errorMessage = errorData.error || "Erreur lors de l'échange du code"
        if (errorData.error === 'invalid_grant') {
          errorMessage = "Code d'autorisation invalide ou expiré"
        }
        throw new Error(errorMessage)
      }

      const data: TokenResponse = await response.json()
      console.log(`✅ Token obtenu pour ${provider.name}`)

      // Sauvegarder le token
      localStorage.setItem(tokenKey, data.access_token)
      if (data.refresh_token) {
        localStorage.setItem(refreshTokenKey, data.refresh_token)
      }

      // Récupérer les infos utilisateur
      await fetchUserInfo(data.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Token exchange error:', err)
      setLoading(false)
    }
  }

  // Récupérer les infos utilisateur (avec le token du backend)
  const fetchUserInfo = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Erreur récupération données')

      const data = await response.json()
      const userInfo: UserInfo = {
        email: data.email,
        name: data.name,
        picture: data.picture,
        token: token,
        provider: provider.name,
      }

      console.log(`👤 Utilisateur ${provider.name}:`, userInfo.name)

      setUser(userInfo)
      setError(null)
      localStorage.setItem(storageKey, JSON.stringify(userInfo))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Gérer le retour de Google OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const errorParam = urlParams.get('error')
    const currentProvider = sessionStorage.getItem('current_provider')

    // Vérifier que c'est pour le bon provider
    if (currentProvider !== provider.name) return

    if (errorParam) {
      setError('Authentification annulée: ' + errorParam)
      cleanUrl()
      return
    }

    if (code && state) {
      const savedState = sessionStorage.getItem(`oauth_state_${provider.name}`)
      if (state !== savedState) {
        setError('Erreur de sécurité: state mismatch')
        return
      }

      const codeVerifier = sessionStorage.getItem(`code_verifier_${provider.name}`) || ''

      if (codeVerifier) {
        exchangeCodeForToken(code, codeVerifier)
      } else {
        setError('Code verifier manquant pour PKCE')
      }

      cleanUrl()
    }
  }, [provider.name])

  // Nettoyer l'URL après traitement
  const cleanUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname)
    sessionStorage.removeItem(`code_verifier_${provider.name}`)
    sessionStorage.removeItem(`oauth_state_${provider.name}`)
    sessionStorage.removeItem('current_provider')
  }

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem(tokenKey)
    const userInfo = localStorage.getItem(storageKey)

    if (token && userInfo) {
      setUser(JSON.parse(userInfo))
    }
  }, [storageKey, tokenKey])

  // Déconnexion
  const handleLogout = (): void => {
    const token = localStorage.getItem(tokenKey)

    setUser(null)
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(refreshTokenKey)
    localStorage.removeItem(storageKey)

    if (token) {
      // Optionnel: révoquer le token côté backend
      fetch(`${BACKEND_URL}/api/auth/google/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch((err) => console.error('Error revoking token:', err))
    }
  }

  return (
    <div className="mt-3">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Connexion en cours...</p>
        </div>
      ) : user ? (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {user.picture && (
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Connecté: {user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
              <p className="text-xs text-blue-600 mt-1">{provider.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Déconnecter
            </button>
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
