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

export interface TokenResponse {
  access_token: string
  token_type: string
  scope?: string
  expires_in?: number
  refresh_token?: string
  id_token?: string
}

export interface ProviderDriver {
  config: OAuthProviderConfig
  buildAuthorizeUrl: (params: { state: string; codeChallenge: string }) => string
  exchangeCode: (params: { code: string; codeVerifier: string }) => Promise<TokenResponse>
}
