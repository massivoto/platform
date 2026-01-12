import { z } from 'zod'

// ============================================================================
// Provider Kind - How credentials are obtained
// ============================================================================

export enum ProviderKind {
  OAUTH2_PKCE = 'OAUTH2_PKCE',
  OAUTH2_CLIENT_CREDENTIALS = 'OAUTH2_CLIENT_CREDENTIALS',
  KEY_AND_SECRET = 'KEY_AND_SECRET',
  API_KEY = 'API_KEY',
}

export const ProviderKindSchema = z.nativeEnum(ProviderKind)

// ============================================================================
// Integration Categories
// ============================================================================

export const IntegrationCategories = ['EMAIL', 'CALENDAR', 'DOCUMENT', 'WEBHOOK', 'GITHUB', 'AI'] as const
export type IntegrationCategoryId = (typeof IntegrationCategories)[number]

export const IntegrationCategorySchema = z.enum(IntegrationCategories)

// ============================================================================
// Provider - User-facing provider definition
// ============================================================================

export interface Provider {
  id: string
  name: string
  logo?: string
  about?: string
  scopes: string[]
  kind: ProviderKind
  categories: IntegrationCategoryId[]
}

export const ProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().optional(),
  about: z.string().optional(),
  scopes: z.array(z.string()),
  kind: ProviderKindSchema,
  categories: z.array(IntegrationCategorySchema),
})

// ============================================================================
// OAuth Provider Config - Backend configuration for OAuth flow
// ============================================================================

export interface OAuthProviderConfig {
  id: string
  displayName: string
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  clientId: string
  clientSecret?: string
  redirectUri: string
  usePKCE: boolean
  extraAuthParams?: Record<string, string>
  extraTokenParams?: Record<string, string>
}

export const OAuthProviderConfigSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  authorizeUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()),
  clientId: z.string().min(1),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url(),
  usePKCE: z.boolean(),
  extraAuthParams: z.record(z.string()).optional(),
  extraTokenParams: z.record(z.string()).optional(),
})
