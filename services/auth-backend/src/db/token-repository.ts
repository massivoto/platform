import {
  IntegrationToken,
  IntegrationStatus,
  TokenResponse,
  ProviderKind,
  createTokenSecret,
  getTokenExpiryDate,
} from '@massivoto/auth-domain'

// ============================================================================
// Stored Token - IntegrationToken with backend-specific fields
// ============================================================================

/**
 * StoredToken extends IntegrationToken with:
 * - `id` always defined (UUID - sensitive data)
 * - `userId` - platform user who owns this token
 * - `providerId` - which provider (google, github, etc.)
 */
export interface StoredToken extends IntegrationToken {
  id: string // always defined after save (UUID for sensitive data)
  userId: string
  providerId: string
}

// Re-export for convenience
export type { IntegrationStatus }

// ============================================================================
// Integration Summary - Lightweight view for listings
// ============================================================================

export interface IntegrationSummary {
  providerId: string
  status: IntegrationStatus
  connectedAt: string
  expiresAt: string | null
}

// ============================================================================
// Token Repository Interface
// ============================================================================

export interface TokenRepository {
  /**
   * Save or update a token for a user/provider combination
   */
  saveToken(userId: string, providerId: string, token: TokenResponse): Promise<StoredToken>

  /**
   * Get a token for a specific user/provider
   */
  getToken(userId: string, providerId: string): Promise<StoredToken | null>

  /**
   * List all tokens for a user
   */
  listTokens(userId: string): Promise<IntegrationSummary[]>

  /**
   * Delete a token (hard delete)
   */
  deleteToken(userId: string, providerId: string): Promise<boolean>

  /**
   * Update token status (e.g., mark as revoked)
   */
  updateStatus(userId: string, providerId: string, revoked: boolean): Promise<boolean>
}

// ============================================================================
// Helper: Convert TokenResponse to StoredToken
// ============================================================================

export function tokenResponseToStoredToken(
  id: string,
  userId: string,
  providerId: string,
  token: TokenResponse,
  kind: ProviderKind = ProviderKind.OAUTH2_PKCE,
  existingCreatedAt?: string
): StoredToken {
  const now = new Date().toISOString()

  return {
    id,
    userId,
    providerId,
    integrationId: `${userId}:${providerId}`,
    kind,
    accessToken: createTokenSecret(token.access_token),
    refreshToken: token.refresh_token ? createTokenSecret(token.refresh_token) : null,
    idToken: token.id_token ? createTokenSecret(token.id_token) : null,
    expiresAt: token.expires_in ? getTokenExpiryDate(token.expires_in) : null,
    scopes: token.scope ? token.scope.split(' ') : [],
    lastUsedAt: null,
    createdAt: existingCreatedAt ?? now,
    updatedAt: now,
    revoked: false,
  }
}
