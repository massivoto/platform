// Re-export from shared auth-domain package
export {
  type Provider,
  ProviderSchema,
  ProviderKind,
  ProviderKindSchema,
  type IntegrationCategoryId,
  IntegrationCategories,
  IntegrationCategorySchema,
  type OAuthProviderConfig,
  OAuthProviderConfigSchema,
} from '@massivoto/auth-domain'

// Legacy re-export for backwards compatibility with existing code
export type { Provider as ProviderScopes } from '@massivoto/auth-domain'
