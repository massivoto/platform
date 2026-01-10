import crypto from 'crypto'

const BASE64_URL_SAFE = /[+/=]/g

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(BASE64_URL_SAFE, (char) => {
      if (char === '+') return '-'
      if (char === '/') return '_'
      return ''
    })
}

export function generateCodeVerifier(length = 64): string {
  const bytes = crypto.randomBytes(length)
  return toBase64Url(bytes)
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest()
  return toBase64Url(hash)
}

export function generateState(length = 32): string {
  const bytes = crypto.randomBytes(length)
  return toBase64Url(bytes)
}
