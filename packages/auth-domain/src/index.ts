// ============================================================================
// @massivoto/auth-domain
// Shared authentication domain logic for OAuth, tokens, and providers
// ============================================================================

// Providers
export {
  ProviderKind,
  ProviderKindSchema,
  IntegrationCategories,
  IntegrationCategorySchema,
  type IntegrationCategoryId,
  type Provider,
  ProviderSchema,
  type OAuthProviderConfig,
  OAuthProviderConfigSchema,
} from './providers.js'

// Tokens
export {
  IntegrationStatuses,
  IntegrationStatusSchema,
  type IntegrationStatus,
  type TokenSecret,
  TokenSecretSchema,
  type TokenResponse,
  TokenResponseSchema,
  type IntegrationToken,
  IntegrationTokenSchema,
  type Integration,
  IntegrationSchema,
  getIntegrationStatus,
  createTokenSecret,
  isTokenExpired,
  getTokenExpiryDate,
} from './tokens.js'

// OAuth
export {
  type OAuthState,
  OAuthStateSchema,
  type OAuthCallbackParams,
  OAuthCallbackParamsSchema,
  type ProviderDriver,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  type AuthorizeUrlParams,
  buildAuthorizeUrl,
  type ParsedOAuthHash,
  parseOAuthHash,
  buildOAuthRedirectHash,
} from './oauth.js'

// Storage
export {
  StorageKeys,
  type TokenSaver,
  type TokenVisibleInfo,
  type TokenLoader,
  type TokenStore,
  type SimpleStorage,
} from './storage.js'

// Errors
export {
  AuthError,
  OAuthError,
  OAuthStateError,
  OAuthTokenExchangeError,
  OAuthProviderNotFoundError,
  TokenError,
  TokenNotFoundError,
  TokenExpiredError,
  TokenRevokedError,
  TokenRevocationError,
} from './errors.js'
