import { EnvConfig } from '../../env.js'
import { OAuthProviderConfig, ProviderDriver, TokenResponse } from '../../types/oauth.js'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

function buildGoogleConfig(env: EnvConfig): OAuthProviderConfig {
  return {
    id: 'google',
    displayName: 'Google',
    authorizeUrl: GOOGLE_AUTH_URL,
    tokenUrl: GOOGLE_TOKEN_URL,
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: env.googleRedirectUri,
    usePKCE: true,
    extraAuthParams: { access_type: 'offline', include_granted_scopes: 'true', prompt: 'consent' },
  }
}

function buildAuthorizeUrl(config: OAuthProviderConfig, state: string, codeChallenge: string): string {
  const url = new URL(config.authorizeUrl)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  url.searchParams.set('scope', config.scopes.join(' '))
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  if (config.extraAuthParams) {
    for (const [key, value] of Object.entries(config.extraAuthParams)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

async function exchangeCode(config: OAuthProviderConfig, code: string, codeVerifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret ?? '',
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Google token exchange failed: ${response.status} ${errorBody}`)
  }

  return (await response.json()) as TokenResponse
}

export function createGoogleDriver(env: EnvConfig): ProviderDriver {
  const config = buildGoogleConfig(env)
  return {
    config,
    buildAuthorizeUrl: ({ state, codeChallenge }) => buildAuthorizeUrl(config, state, codeChallenge),
    exchangeCode: ({ code, codeVerifier }) => exchangeCode(config, code, codeVerifier),
  }
}
