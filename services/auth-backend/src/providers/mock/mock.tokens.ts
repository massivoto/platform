import { TokenResponse } from '../../types/oauth.js'
import { MockScenario } from './mock.scenarios.js'
import {
  getMockSessionStore,
  createMockToken,
  MockSessionState,
} from '@massivoto/auth-domain'

/**
 * Error thrown when a mock scenario simulates a failure
 */
export class MockOAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'MockOAuthError'
  }
}

/**
 * Scope mappings for different providers
 */
const PROVIDER_SCOPES: Record<string, string> = {
  github: 'read:user user:email',
  google: 'openid email profile',
}

/**
 * Map OAuth scenario to session state
 */
function scenarioToSessionState(scenario: MockScenario): MockSessionState {
  switch (scenario) {
    case 'success':
      return 'valid'
    case 'expired':
      return 'expired'
    case 'revoked':
      return 'revoked'
    default:
      return 'valid'
  }
}

/**
 * Generate mock tokens based on scenario
 * Creates a session in the mock session store and returns a mock token
 * @throws MockOAuthError for denied/error scenarios
 */
export function generateMockTokens(scenario: MockScenario, providerId: string): TokenResponse {
  const scope = PROVIDER_SCOPES[providerId] ?? 'read write'

  // Handle error scenarios before creating a session
  if (scenario === 'denied') {
    throw new MockOAuthError('access_denied', 'The user denied the authorization request')
  }

  if (scenario === 'error') {
    throw new MockOAuthError('server_error', 'The authorization server encountered an unexpected error')
  }

  // Create a session in the store
  const store = getMockSessionStore()
  const session = store.createSession(providerId)

  // Set the session state based on scenario
  const state = scenarioToSessionState(scenario)
  if (state !== 'valid') {
    store.updateState(session.id, state)
  }

  // Create mock token in the format: mock:<provider>:<sessionId>
  const accessToken = createMockToken(session)

  return {
    access_token: accessToken,
    refresh_token: scenario === 'success' ? `mock_refresh:${providerId}:${session.id}` : undefined,
    token_type: 'Bearer',
    expires_in: scenario === 'expired' ? 0 : 3600,
    scope,
  }
}

/**
 * Encode scenario into a mock authorization code
 */
export function encodeMockCode(scenario: MockScenario, providerId: string): string {
  const timestamp = Date.now()
  // Format: mock_code_{scenario}_{provider}_{timestamp}
  return `mock_code_${scenario}_${providerId}_${timestamp}`
}

/**
 * Decode scenario from a mock authorization code
 * Returns null if not a valid mock code
 */
export function decodeMockCode(code: string): { scenario: MockScenario; providerId: string } | null {
  const match = code.match(/^mock_code_(success|expired|revoked|denied|error)_([a-z]+)_\d+$/)
  if (!match) {
    return null
  }
  return {
    scenario: match[1] as MockScenario,
    providerId: match[2],
  }
}
