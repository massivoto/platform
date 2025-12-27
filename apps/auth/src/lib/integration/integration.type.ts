import { ProviderKind } from '../providers/provider.types.js'

export type IntegrationStatus = 'connected' | 'revoked' | 'error' | 'needs_reauth'

/**
 * Integration describes a third-party account connected through OAuth to act on behalf of a Massivoto user.
 * Scopes should follow a least privilege strategy and status transitions must mark invalid tokens as `needs_reauth`.
 */
export interface Integration {
  id: string
  userId: string
  providerId: string
  externalAccountId?: string
  externalAccountLabel?: string
  selectedScopes: string[]
  status: IntegrationStatus
  createdAt: string
  updatedAt: string
  lastSyncAt: string | null
  expiresAt: string | null
}

/**
 * For the moment, we populate only rawValue for unencrypted tokens.
 * IntegrationTokenSecret represents encrypted credentials (ciphertext + IV and optional auth tag).
 * By keeping secrets encrypted at rest we can reuse the same structure for access, refresh or ID tokens.
 */
export interface IntegrationTokenSecret {
  rawValue: string
  cipherText?: string
  iv?: string
  tag?: string
  rotatedAt?: string
}

/**
 * IntegrationToken groups encrypted OAuth material for a specific integration.
 * Track scope history, expiry and usage to support rotation, least privilege audits and re-auth flows.
 */
export interface IntegrationToken {
  integrationId: string
  kind: ProviderKind
  accessToken?: IntegrationTokenSecret
  apiKey?: IntegrationTokenSecret
  secret?: IntegrationTokenSecret
  refreshToken?: IntegrationTokenSecret | null // Ignore for the moment
  idToken?: IntegrationTokenSecret | null // Ignore for the moment
  expiresAt: string | null
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  revoked: boolean
}
