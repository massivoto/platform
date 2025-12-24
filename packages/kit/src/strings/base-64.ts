/**
 * Encode any UTF-8 string to Base-64.
 */
export function encodeBase64(text: string): string {
  // Convert → bytes (handles emojis, CJK, …)
  const bytes = new TextEncoder().encode(text)

  // Browser path ───────────────────────────
  if (typeof btoa === 'function') {
    let bin = ''
    bytes.forEach((b) => (bin += String.fromCharCode(b)))
    return btoa(bin)
  }

  // Node path ──────────────────────────────
  return Buffer.from(bytes).toString('base64')
}

/**
 * Decode a Base-64 string back to UTF-8 text.
 */
export function decodeBase64(b64: string): string {
  let bin: string

  // Browser
  if (typeof atob === 'function') {
    bin = atob(b64)
  }
  // Node
  else {
    bin = Buffer.from(b64, 'base64').toString('binary')
  }

  // binary-string → Uint8Array → UTF-8
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

  return new TextDecoder().decode(bytes)
}
