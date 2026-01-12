import { IntegrationToken, IntegrationStatus } from './tokens.js'
import { ProviderKind } from './providers.js'

// ============================================================================
// Storage Keys - Centralized key patterns
// ============================================================================

export const StorageKeys = {
  tokenStore: (userId: string) => `token_saver_${userId}`,
  providerConnection: (providerId: string) => `${providerId}_connected`,
} as const

// ============================================================================
// Token Saver Interface
// ============================================================================

export interface TokenSaver {
  saveToken(providerId: string, token: IntegrationToken): void
  markTokenAsRevoked(providerId: string): void
  removeToken(providerId: string): void
}

// ============================================================================
// Token Loader Interface
// ============================================================================

export interface TokenVisibleInfo {
  providerId: string
  userId: string
  kind: ProviderKind
  visibleInfo: {
    accessToken?: string
    apiKey?: string
    secret?: string
    expiresAt?: string | null
    scopes: string[]
  }
  status: IntegrationStatus
}

export interface TokenLoader {
  loadTokens(): Map<string, TokenVisibleInfo>
  loadRawTokens(): Map<string, Partial<IntegrationToken>>
}

// ============================================================================
// Token Store - Combined saver and loader
// ============================================================================

export interface TokenStore extends TokenSaver, TokenLoader {
  userId: string
}

// ============================================================================
// Simple Storage Interface (for DI)
// ============================================================================

export interface SimpleStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
