import { EnvConfig } from '../../env.js'
import { OAuthProviderConfig, ProviderDriver, TokenResponse } from '../../types/oauth.js'

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function buildGithubConfig(env: EnvConfig): OAuthProviderConfig {
  return {
    id: 'github',
    displayName: 'GitHub',
    authorizeUrl: GITHUB_AUTH_URL,
    tokenUrl: GITHUB_TOKEN_URL,
    scopes: ['read:user', 'user:email'],
    clientId: env.githubClientId,
    clientSecret: env.githubClientSecret,
    redirectUri: env.githubRedirectUri,
    usePKCE: true,
    extraAuthParams: {},
    extraTokenParams: { allow_signup: 'false' },
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
  url.searchParams.set('allow_signup', 'false')
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
    throw new Error(`GitHub token exchange failed: ${response.status} ${errorBody}`)
  }

  return (await response.json()) as TokenResponse
}

export function createGithubDriver(env: EnvConfig): ProviderDriver {
  const config = buildGithubConfig(env)
  return {
    config,
    buildAuthorizeUrl: ({ state, codeChallenge }) => buildAuthorizeUrl(config, state, codeChallenge),
    exchangeCode: ({ code, codeVerifier }) => exchangeCode(config, code, codeVerifier),
  }
}
