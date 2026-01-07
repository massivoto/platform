// R-FOUNDATION-102: Fake token generators for tests and stories

export type ApiKeyToken = { type: 'apiKey'; key: string }
export type OAuthToken = {
  type: 'oauth'
  accessToken: string
  refreshToken?: string
  expiry?: number // epoch seconds
  scopes?: string[]
}
export type Token = ApiKeyToken | OAuthToken

type RandomOptions = { length?: number; alphabet?: string }

const DEFAULT_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomString({ length = 16, alphabet = DEFAULT_ALPHABET }: RandomOptions = {}): string {
  let out = ''
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length)
    out += alphabet[idx]
  }
  return out
}

export function fakeApiKeyToken(
  providerId: string,
  options?: { prefix?: string; randomLength?: number },
): ApiKeyToken {
  const prefix = options?.prefix ?? 'mv_fake'
  const rnd = randomString({ length: options?.randomLength ?? 16 })
  return { type: 'apiKey', key: `${prefix}_${providerId}_${rnd}` }
}

export function fakeOAuthToken(
  providerId: string,
  options?: {
    scopes?: string[]
    expiresInSec?: number
    withRefreshToken?: boolean
  },
): OAuthToken {
  const rndA = randomString({ length: 24 })
  const rndR = randomString({ length: 24 })
  const nowSec = Math.floor(Date.now() / 1000)
  const expiry = nowSec + (options?.expiresInSec ?? 3600)

  const base: OAuthToken = {
    type: 'oauth',
    accessToken: `mv_fake_${providerId}_access_${rndA}`,
    expiry,
    scopes: options?.scopes,
  }

  if (options?.withRefreshToken !== false) {
    base.refreshToken = `mv_fake_${providerId}_refresh_${rndR}`
  }

  return base
}
