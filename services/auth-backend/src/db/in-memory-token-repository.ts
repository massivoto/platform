import { TokenResponse, getIntegrationStatus } from '@massivoto/auth-domain'
import {
  TokenRepository,
  StoredToken,
  IntegrationSummary,
  tokenResponseToStoredToken,
} from './token-repository.js'

// ============================================================================
// In-Memory Token Repository (for unit tests)
// ============================================================================

export class InMemoryTokenRepository implements TokenRepository {
  private tokens: Map<string, StoredToken> = new Map()
  private idCounter = 0

  private makeKey(userId: string, providerId: string): string {
    return `${userId}:${providerId}`
  }

  private generateId(): string {
    // In-memory uses simple IDs for testing; real DB uses UUID
    return `test-uuid-${++this.idCounter}`
  }

  async saveToken(userId: string, providerId: string, token: TokenResponse): Promise<StoredToken> {
    const key = this.makeKey(userId, providerId)
    const existing = this.tokens.get(key)

    const storedToken = tokenResponseToStoredToken(
      existing?.id ?? this.generateId(),
      userId,
      providerId,
      token,
      undefined,
      existing?.createdAt
    )

    this.tokens.set(key, storedToken)
    return storedToken
  }

  async getToken(userId: string, providerId: string): Promise<StoredToken | null> {
    const key = this.makeKey(userId, providerId)
    return this.tokens.get(key) ?? null
  }

  async listTokens(userId: string): Promise<IntegrationSummary[]> {
    const results: IntegrationSummary[] = []

    for (const token of this.tokens.values()) {
      if (token.userId === userId) {
        results.push({
          providerId: token.providerId,
          status: getIntegrationStatus(token),
          connectedAt: token.createdAt,
          expiresAt: token.expiresAt,
        })
      }
    }

    return results
  }

  async deleteToken(userId: string, providerId: string): Promise<boolean> {
    const key = this.makeKey(userId, providerId)
    return this.tokens.delete(key)
  }

  async updateStatus(userId: string, providerId: string, revoked: boolean): Promise<boolean> {
    const key = this.makeKey(userId, providerId)
    const token = this.tokens.get(key)

    if (!token) {
      return false
    }

    token.revoked = revoked
    token.updatedAt = new Date().toISOString()
    this.tokens.set(key, token)
    return true
  }

  // Test helpers
  clear(): void {
    this.tokens.clear()
    this.idCounter = 0
  }

  size(): number {
    return this.tokens.size
  }
}
