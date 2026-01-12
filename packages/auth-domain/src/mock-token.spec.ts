import { describe, it, expect, beforeEach } from 'vitest'
import {
  isMockToken,
  parseMockToken,
  createMockToken,
  getMockTokenState,
  getMockTokenSession,
  validateMockToken,
  createMockTokenForProvider,
  expireMockToken,
  revokeMockToken,
  resetMockSessionStore,
  getMockSessionStore,
} from './mock-token.js'
import { TokenExpiredError, TokenRevokedError } from './errors.js'

describe('mock-token', () => {
  beforeEach(() => {
    resetMockSessionStore()
  })

  describe('isMockToken', () => {
    it('returns true for mock tokens', () => {
      expect(isMockToken('mock:github:abc123')).toBe(true)
      expect(isMockToken('mock:google:xyz789')).toBe(true)
    })

    it('returns false for real tokens', () => {
      expect(isMockToken('gho_abc123')).toBe(false)
      expect(isMockToken('ya29.xyz789')).toBe(false)
      expect(isMockToken('')).toBe(false)
    })
  })

  describe('parseMockToken', () => {
    it('parses valid mock token', () => {
      const result = parseMockToken('mock:github:abc123')

      expect(result).toEqual({
        provider: 'github',
        sessionId: 'abc123',
      })
    })

    it('returns null for non-mock token', () => {
      expect(parseMockToken('gho_abc123')).toBeNull()
    })

    it('returns null for malformed mock token', () => {
      expect(parseMockToken('mock:github')).toBeNull()
      expect(parseMockToken('mock:github:abc:extra')).toBeNull()
    })
  })

  describe('createMockToken', () => {
    it('creates token from session', () => {
      const session = getMockSessionStore().createSession('github')
      const token = createMockToken(session)

      expect(token).toBe(`mock:github:${session.id}`)
    })
  })

  describe('createMockTokenForProvider', () => {
    it('creates token and session for provider', () => {
      const token = createMockTokenForProvider('github')

      expect(isMockToken(token)).toBe(true)
      expect(parseMockToken(token)?.provider).toBe('github')
    })
  })

  describe('getMockTokenState', () => {
    it('returns state for valid mock token', () => {
      const token = createMockTokenForProvider('github')
      expect(getMockTokenState(token)).toBe('valid')
    })

    it('returns null for non-mock token', () => {
      expect(getMockTokenState('gho_abc123')).toBeNull()
    })

    it('returns null for non-existent session', () => {
      expect(getMockTokenState('mock:github:nonexistent')).toBeNull()
    })
  })

  describe('getMockTokenSession', () => {
    it('returns session for valid mock token', () => {
      const token = createMockTokenForProvider('github')
      const session = getMockTokenSession(token)

      expect(session).not.toBeNull()
      expect(session?.provider).toBe('github')
      expect(session?.state).toBe('valid')
    })

    it('returns null for non-mock token', () => {
      expect(getMockTokenSession('gho_abc123')).toBeNull()
    })
  })

  describe('expireMockToken', () => {
    it('sets session state to expired', () => {
      const token = createMockTokenForProvider('github')
      expireMockToken(token)

      expect(getMockTokenState(token)).toBe('expired')
    })

    it('does nothing for non-mock token', () => {
      // Should not throw
      expireMockToken('gho_abc123')
    })
  })

  describe('revokeMockToken', () => {
    it('sets session state to revoked', () => {
      const token = createMockTokenForProvider('github')
      revokeMockToken(token)

      expect(getMockTokenState(token)).toBe('revoked')
    })
  })

  describe('validateMockToken', () => {
    it('returns session for valid token', () => {
      const token = createMockTokenForProvider('github')
      const session = validateMockToken(token)

      expect(session.provider).toBe('github')
      expect(session.state).toBe('valid')
    })

    it('throws TokenExpiredError for expired token', () => {
      const token = createMockTokenForProvider('github')
      expireMockToken(token)

      expect(() => validateMockToken(token)).toThrow(TokenExpiredError)
    })

    it('throws TokenRevokedError for revoked token', () => {
      const token = createMockTokenForProvider('github')
      revokeMockToken(token)

      expect(() => validateMockToken(token)).toThrow(TokenRevokedError)
    })

    it('throws for non-mock token', () => {
      expect(() => validateMockToken('gho_abc123')).toThrow('Invalid mock token format')
    })

    it('throws for non-existent session', () => {
      expect(() => validateMockToken('mock:github:nonexistent')).toThrow('Mock session not found')
    })
  })
})
