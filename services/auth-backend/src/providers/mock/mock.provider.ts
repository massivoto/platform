import { EnvConfig } from '../../env.js'
import { OAuthProviderConfig, ProviderDriver, TokenResponse } from '../../types/oauth.js'
import { parseScenario } from './mock.scenarios.js'
import { decodeMockCode, generateMockTokens, MockOAuthError } from './mock.tokens.js'

/**
 * Build mock provider config
 */
function buildMockConfig(providerId: string, env: EnvConfig): OAuthProviderConfig {
  const port = env.port
  const baseUrl = `http://localhost:${port}`

  return {
    id: providerId,
    displayName: `Mock ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}`,
    authorizeUrl: `${baseUrl}/mock/authorize`,
    tokenUrl: `${baseUrl}/mock/token`,
    scopes: ['mock:read', 'mock:write'],
    clientId: `mock-${providerId}-client-id`,
    clientSecret: `mock-${providerId}-client-secret`,
    redirectUri: `${baseUrl}/oauth/${providerId}/callback`,
    usePKCE: true,
    extraAuthParams: {},
    extraTokenParams: {},
  }
}

/**
 * Build authorize URL for mock provider
 * Encodes scenario in the URL for the mock authorize endpoint to use
 */
function buildAuthorizeUrl(
  config: OAuthProviderConfig,
  state: string,
  codeChallenge: string,
  scenario: string = 'success'
): string {
  const url = new URL(config.authorizeUrl)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  url.searchParams.set('scope', config.scopes.join(' '))
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // Pass scenario through to mock authorize endpoint
  url.searchParams.set('scenario', scenario)
  // Pass provider ID for the mock endpoint
  url.searchParams.set('provider', config.id)
  return url.toString()
}

/**
 * Exchange mock authorization code for tokens
 * Decodes the scenario from the code and returns appropriate tokens
 */
async function exchangeCode(config: OAuthProviderConfig, code: string, _codeVerifier: string): Promise<TokenResponse> {
  const decoded = decodeMockCode(code)

  if (!decoded) {
    throw new MockOAuthError('invalid_grant', 'Invalid or malformed authorization code')
  }

  // Generate tokens based on the scenario encoded in the code
  return generateMockTokens(decoded.scenario, decoded.providerId)
}

/**
 * Create a mock provider driver
 * Used when AUTH_MODE=mock to simulate OAuth flows without hitting real providers
 */
export function createMockDriver(providerId: string, env: EnvConfig, scenario?: string): ProviderDriver {
  const config = buildMockConfig(providerId, env)
  const parsedScenario = parseScenario(scenario)

  return {
    config,
    buildAuthorizeUrl: ({ state, codeChallenge }) => buildAuthorizeUrl(config, state, codeChallenge, parsedScenario),
    exchangeCode: ({ code, codeVerifier }) => exchangeCode(config, code, codeVerifier),
  }
}
