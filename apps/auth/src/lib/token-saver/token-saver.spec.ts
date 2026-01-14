import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { IntegrationToken } from '../integration/integration.type.js'
import { getIntegrationStatus } from '../integration/token-status.js'
import { ProviderKind } from '../providers/provider.types.js'
import { LocalStorageTokenLoader } from './token-loader.js'
import { LocalStorageTokenSaver } from './token-saver.js'

describe('LocalStorage token saver/loader', () => {
  const userId = 'john123 '
  const providerId = 'github'

  const token: IntegrationToken = {
    integrationId: 'integration-1',
    kind: ProviderKind.API_KEY,
    apiKey: { rawValue: 'api-key-123' },
    expiresAt: null,
    scopes: ['repo'],
    lastUsedAt: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    revoked: false,
  }

  beforeEach(() => {
    localStorage.clear()
  })

  it('saves a token in localStorage and loads it back', () => {
    const saver = new LocalStorageTokenSaver(userId)
    saver.saveToken(providerId, token)

    const loader = new LocalStorageTokenLoader(userId)
    const storedTokens = loader.loadRawTokens()
    const loadedToken = storedTokens.get(providerId)

    expect(loadedToken).toBeDefined()
    expect(loadedToken?.apiKey?.rawValue).toBe(token.apiKey!.rawValue)
    expect(loadedToken?.kind).toBe(token.kind)
    expect(loadedToken?.revoked).toBe(false)
  })
})

describe('getIntegrationStatus expiration cases', () => {
  const baseNow = new Date('2024-03-10T12:00:00Z')
  const baseToken: IntegrationToken = {
    integrationId: 'integration-2',
    kind: ProviderKind.API_KEY,
    apiKey: { rawValue: 'api-key-123' },
    expiresAt: null,
    scopes: ['repo'],
    lastUsedAt: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    revoked: false,
  }

  beforeEach(() => {
    vi.setSystemTime(baseNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks token as needs_reauth when expired yesterday', () => {
    const yesterday = new Date(baseNow.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const status = getIntegrationStatus({ ...baseToken, expiresAt: yesterday })
    expect(status).toBe('needs_reauth')
  })

  it('returns connected when token is not expired', () => {
    const tomorrow = new Date(baseNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    const status = getIntegrationStatus({ ...baseToken, expiresAt: tomorrow })
    expect(status).toBe('connected')
  })

  it('returns connected when expiresAt is undefined', () => {
    const status = getIntegrationStatus({
      ...baseToken,
      expiresAt: undefined as unknown as string | null,
    })
    expect(status).toBe('connected')
  })
})

// TODO AI: Implement revokeToken method in LocalStorageTokenSaver or remove this test
describe.skip('LocalStorageTokenSaver revokeToken', () => {
  const userId = 'john123 '
  const providerId = 'github'
  const now = new Date('2024-04-01T10:00:00Z')

  const token: IntegrationToken = {
    integrationId: 'integration-3',
    kind: ProviderKind.API_KEY,
    apiKey: { rawValue: 'api-key-321' },
    expiresAt: null,
    scopes: ['repo'],
    lastUsedAt: null,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    revoked: false,
  }

  beforeEach(() => {
    localStorage.clear()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks the token as revoked and sets expiresAt when revoked', () => {
    const saver = new LocalStorageTokenSaver(userId)
    saver.saveToken(providerId, token)

    saver.revokeToken(providerId)

    const loader = new LocalStorageTokenLoader(userId)
    const revokedToken = loader.loadRawTokens().get(providerId)

    expect(revokedToken?.revoked).toBe(true)
    expect(revokedToken?.expiresAt).toBe(now.toISOString())
    expect(getIntegrationStatus(revokedToken as IntegrationToken)).toBe('revoked')
  })
})
