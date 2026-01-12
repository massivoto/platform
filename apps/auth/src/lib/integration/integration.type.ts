// Re-export from shared auth-domain package
export {
  type IntegrationStatus,
  IntegrationStatuses,
  IntegrationStatusSchema,
  type Integration,
  IntegrationSchema,
  type TokenSecret as IntegrationTokenSecret,
  TokenSecretSchema,
  type IntegrationToken,
  IntegrationTokenSchema,
  createTokenSecret,
  isTokenExpired,
  getTokenExpiryDate,
} from '@massivoto/auth-domain'
