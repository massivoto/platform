import { z } from 'zod'
import { TokenResponse } from './tokens.js'
import { OAuthProviderConfig } from './providers.js'

// ============================================================================
// OAuth State & Callback Types
// ============================================================================

export interface OAuthState {
  state: string
  codeVerifier: string
  redirectUri: string
  providerId: string
  createdAt: number
}

export const OAuthStateSchema = z.object({
  state: z.string(),
  codeVerifier: z.string(),
  redirectUri: z.string(),
  providerId: z.string(),
  createdAt: z.number(),
})

export interface OAuthCallbackParams {
  code: string
  state: string
  error?: string
  error_description?: string
}

export const OAuthCallbackParamsSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

// ============================================================================
// Provider Driver Interface - Backend implementation contract
// ============================================================================

export interface ProviderDriver {
  config: OAuthProviderConfig
  buildAuthorizeUrl(params: { state: string; codeChallenge: string }): string
  exchangeCode(params: { code: string; codeVerifier: string }): Promise<TokenResponse>
}

// ============================================================================
// PKCE Utilities - Isomorphic (works in Node.js and Browser)
// ============================================================================

function toBase64Url(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto')
    const nodeBytes = nodeCrypto.randomBytes(length)
    bytes.set(nodeBytes)
  }
  return bytes
}

async function sha256(message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(hashBuffer)
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto')
    const hash = nodeCrypto.createHash('sha256').update(message).digest()
    return new Uint8Array(hash)
  }
}

export function generateCodeVerifier(length = 64): string {
  const bytes = getRandomBytes(length)
  return toBase64Url(bytes)
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = await sha256(codeVerifier)
  return toBase64Url(hash)
}

export function generateState(length = 32): string {
  const bytes = getRandomBytes(length)
  return toBase64Url(bytes)
}

// ============================================================================
// OAuth URL Builders
// ============================================================================

export interface AuthorizeUrlParams {
  authorizeUrl: string
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
  codeChallenge?: string
  extraParams?: Record<string, string>
}

export function buildAuthorizeUrl(params: AuthorizeUrlParams): string {
  const url = new URL(params.authorizeUrl)

  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', params.scopes.join(' '))
  url.searchParams.set('state', params.state)

  if (params.codeChallenge) {
    url.searchParams.set('code_challenge', params.codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
  }

  if (params.extraParams) {
    for (const [key, value] of Object.entries(params.extraParams)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

// ============================================================================
// OAuth Hash Parser (for frontend callback handling)
// ============================================================================

export interface ParsedOAuthHash {
  provider?: string
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  scope?: string
  state?: string
  error?: string
  errorDescription?: string
}

export function parseOAuthHash(hash: string): ParsedOAuthHash {
  const params = new URLSearchParams(hash.replace(/^#/, ''))

  return {
    provider: params.get('provider') || undefined,
    accessToken: params.get('access_token') || undefined,
    refreshToken: params.get('refresh_token') || undefined,
    expiresIn: params.get('expires_in') ? parseInt(params.get('expires_in')!, 10) : undefined,
    scope: params.get('scope') || undefined,
    state: params.get('state') || undefined,
    error: params.get('error') || undefined,
    errorDescription: params.get('error_description') || undefined,
  }
}

export function buildOAuthRedirectHash(params: {
  provider: string
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  scope?: string
}): string {
  const hashParams = new URLSearchParams()
  hashParams.set('provider', params.provider)
  hashParams.set('access_token', params.accessToken)

  if (params.refreshToken) {
    hashParams.set('refresh_token', params.refreshToken)
  }
  if (params.expiresIn) {
    hashParams.set('expires_in', params.expiresIn.toString())
  }
  if (params.scope) {
    hashParams.set('scope', params.scope)
  }

  return `#${hashParams.toString()}`
}
