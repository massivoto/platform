// ============================================================================
// Base Auth Error
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// ============================================================================
// OAuth Errors
// ============================================================================

export class OAuthError extends AuthError {
  constructor(
    message: string,
    code: string,
    public readonly provider?: string,
    cause?: unknown
  ) {
    super(message, code, cause)
    this.name = 'OAuthError'
  }
}

export class OAuthStateError extends OAuthError {
  constructor(message = 'Invalid or expired OAuth state') {
    super(message, 'OAUTH_STATE_INVALID')
    this.name = 'OAuthStateError'
  }
}

export class OAuthTokenExchangeError extends OAuthError {
  constructor(provider: string, cause?: unknown) {
    super(`Failed to exchange authorization code for ${provider}`, 'OAUTH_TOKEN_EXCHANGE_FAILED', provider, cause)
    this.name = 'OAuthTokenExchangeError'
  }
}

export class OAuthProviderNotFoundError extends OAuthError {
  constructor(providerId: string) {
    super(`OAuth provider '${providerId}' not found`, 'OAUTH_PROVIDER_NOT_FOUND', providerId)
    this.name = 'OAuthProviderNotFoundError'
  }
}

// ============================================================================
// Token Errors
// ============================================================================

export class TokenError extends AuthError {
  constructor(
    message: string,
    code: string,
    public readonly providerId?: string,
    cause?: unknown
  ) {
    super(message, code, cause)
    this.name = 'TokenError'
  }
}

export class TokenNotFoundError extends TokenError {
  constructor(providerId: string) {
    super(`Token for provider '${providerId}' not found`, 'TOKEN_NOT_FOUND', providerId)
    this.name = 'TokenNotFoundError'
  }
}

export class TokenExpiredError extends TokenError {
  constructor(providerId: string) {
    super(`Token for provider '${providerId}' has expired`, 'TOKEN_EXPIRED', providerId)
    this.name = 'TokenExpiredError'
  }
}

export class TokenRevokedError extends TokenError {
  constructor(providerId: string) {
    super(`Token for provider '${providerId}' has been revoked`, 'TOKEN_REVOKED', providerId)
    this.name = 'TokenRevokedError'
  }
}

export class TokenRevocationError extends TokenError {
  constructor(providerId: string, cause?: unknown) {
    super(`Failed to revoke token for provider '${providerId}'`, 'TOKEN_REVOCATION_FAILED', providerId, cause)
    this.name = 'TokenRevocationError'
  }
}
