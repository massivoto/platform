import { z } from 'zod'
import { ProviderKind, ProviderKindSchema } from './providers.js'

// ============================================================================
// Integration Status
// ============================================================================

export const IntegrationStatuses = ['connected', 'revoked', 'error', 'needs_reauth'] as const
export type IntegrationStatus = (typeof IntegrationStatuses)[number]

export const IntegrationStatusSchema = z.enum(IntegrationStatuses)

// ============================================================================
// Token Secret - Encrypted or raw credential value
// ============================================================================

export interface TokenSecret {
  rawValue: string
  cipherText?: string
  iv?: string
  tag?: string
  rotatedAt?: string
}

export const TokenSecretSchema = z.object({
  rawValue: z.string(),
  cipherText: z.string().optional(),
  iv: z.string().optional(),
  tag: z.string().optional(),
  rotatedAt: z.string().optional(),
})

// ============================================================================
// Token Response - OAuth token endpoint response
// ============================================================================

export interface TokenResponse {
  access_token: string
  token_type: string
  scope?: string
  expires_in?: number
  refresh_token?: string
  id_token?: string
}

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  id_token: z.string().optional(),
})

// ============================================================================
// Integration Token - Stored token for a provider connection
// ============================================================================

export interface IntegrationToken {
  id?: string // undefined before save, set after (UUID for sensitive data)
  integrationId: string
  kind: ProviderKind
  accessToken?: TokenSecret
  apiKey?: TokenSecret
  secret?: TokenSecret
  refreshToken?: TokenSecret | null
  idToken?: TokenSecret | null
  expiresAt: string | null
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  revoked: boolean
}

export const IntegrationTokenSchema = z.object({
  id: z.string().uuid().optional(),
  integrationId: z.string(),
  kind: ProviderKindSchema,
  accessToken: TokenSecretSchema.optional(),
  apiKey: TokenSecretSchema.optional(),
  secret: TokenSecretSchema.optional(),
  refreshToken: TokenSecretSchema.nullable().optional(),
  idToken: TokenSecretSchema.nullable().optional(),
  expiresAt: z.string().nullable(),
  scopes: z.array(z.string()),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  revoked: z.boolean(),
})

// ============================================================================
// Integration - High-level connection record
// ============================================================================

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

export const IntegrationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string(),
  externalAccountId: z.string().optional(),
  externalAccountLabel: z.string().optional(),
  selectedScopes: z.array(z.string()),
  status: IntegrationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSyncAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
})

// ============================================================================
// Token Status Logic
// ============================================================================

export function getIntegrationStatus(token: IntegrationToken): IntegrationStatus {
  if (token.revoked) {
    return 'revoked'
  }

  if (token.expiresAt) {
    const now = new Date()
    const expiresAt = new Date(token.expiresAt)
    if (expiresAt < now) {
      return 'needs_reauth'
    }
  }

  return 'connected'
}

// ============================================================================
// Token Helpers
// ============================================================================

export function createTokenSecret(rawValue: string): TokenSecret {
  return { rawValue }
}

export function isTokenExpired(token: IntegrationToken): boolean {
  if (!token.expiresAt) return false
  return new Date(token.expiresAt) < new Date()
}

export function getTokenExpiryDate(expiresIn: number): string {
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
  return expiresAt.toISOString()
}
