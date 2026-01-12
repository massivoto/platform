import {
  MockSession,
  MockSessionState,
  MockSessionStore,
  InMemoryMockSessionStore,
} from './mock-session.js'
import { TokenExpiredError, TokenRevokedError } from './errors.js'

// ============================================================================
// Mock Token Format: mock:<provider>:<sessionId>
// ============================================================================

const MOCK_TOKEN_PREFIX = 'mock:'

/**
 * Check if a token is a mock token
 */
export function isMockToken(token: string): boolean {
  return token.startsWith(MOCK_TOKEN_PREFIX)
}

/**
 * Parse a mock token into its components
 */
export function parseMockToken(token: string): { provider: string; sessionId: string } | null {
  if (!isMockToken(token)) {
    return null
  }

  const parts = token.split(':')
  if (parts.length !== 3) {
    return null
  }

  const [, provider, sessionId] = parts
  return { provider, sessionId }
}

/**
 * Create a mock token from session
 */
export function createMockToken(session: MockSession): string {
  return `${MOCK_TOKEN_PREFIX}${session.provider}:${session.id}`
}

// ============================================================================
// Global Store Management
// ============================================================================

let globalStore: MockSessionStore = new InMemoryMockSessionStore()

/**
 * Set the global mock session store
 */
export function setMockSessionStore(store: MockSessionStore): void {
  globalStore = store
}

/**
 * Get the global mock session store
 */
export function getMockSessionStore(): MockSessionStore {
  return globalStore
}

/**
 * Reset to default in-memory store (useful for tests)
 */
export function resetMockSessionStore(): void {
  globalStore = new InMemoryMockSessionStore()
}

// ============================================================================
// Token State Checking
// ============================================================================

/**
 * Get the state of a mock token
 * Returns null if token is not found or not a mock token
 */
export function getMockTokenState(token: string): MockSessionState | null {
  const parsed = parseMockToken(token)
  if (!parsed) {
    return null
  }

  const session = globalStore.getSession(parsed.sessionId)
  return session?.state ?? null
}

/**
 * Get the full session for a mock token
 */
export function getMockTokenSession(token: string): MockSession | null {
  const parsed = parseMockToken(token)
  if (!parsed) {
    return null
  }

  return globalStore.getSession(parsed.sessionId)
}

/**
 * Validate a mock token and throw appropriate errors
 * Use this in commands that need to check token validity
 */
export function validateMockToken(token: string): MockSession {
  const parsed = parseMockToken(token)
  if (!parsed) {
    throw new Error('Invalid mock token format')
  }

  const session = globalStore.getSession(parsed.sessionId)
  if (!session) {
    throw new Error('Mock session not found')
  }

  if (session.state === 'expired') {
    throw new TokenExpiredError(parsed.provider)
  }

  if (session.state === 'revoked') {
    throw new TokenRevokedError(parsed.provider)
  }

  return session
}

// ============================================================================
// Convenience Functions for Testing
// ============================================================================

/**
 * Create a mock token for a provider with a new session
 */
export function createMockTokenForProvider(provider: string): string {
  const session = globalStore.createSession(provider)
  return createMockToken(session)
}

/**
 * Expire a mock token (set its session state to expired)
 */
export function expireMockToken(token: string): void {
  const parsed = parseMockToken(token)
  if (parsed) {
    globalStore.updateState(parsed.sessionId, 'expired')
  }
}

/**
 * Revoke a mock token (set its session state to revoked)
 */
export function revokeMockToken(token: string): void {
  const parsed = parseMockToken(token)
  if (parsed) {
    globalStore.updateState(parsed.sessionId, 'revoked')
  }
}
