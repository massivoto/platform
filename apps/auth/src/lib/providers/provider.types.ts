export interface Provider {
  id: string // Gmail, Slack, etc.
  name: string // basically the display name, same than id
  logo?: string // Presented to the user
  about?: string // brief description of the provider
  // All the scopes proposed by the provider
  scopes: string[]
  // For the moment, a provider has a single kind
  kind: ProviderKind
  categories: IntegrationCategoryId[]
}

/**
 * Some providers have some scopes, some don't
 */
export interface ProviderScopes {
  providerId: string
  scopes: string[]
}

export enum ProviderKind {
  OAUTH2_PKCE = 'OAUTH2_PKCE',
  OAUTH2_CLIENT_CREDENTIALS = 'OAUTH2_CLIENT_CREDENTIALS',
  KEY_AND_SECRET = 'KEY_AND_SECRET',
  API_KEY = 'API_KEY',
}

export type IntegrationCategoryId = 'EMAIL' | 'CALENDAR' | 'DOCUMENT' | 'WEBHOOK'
