// import { Buffer } from 'buffer'; // Node.js Buffer for base64

import { decodeBase64, encodeBase64 } from './base-64.js'

function getObfuscationKey(): string {
  // Prefer env variable, fallback to a default. Ensure it's not empty.
  const key = process.env.PYRAMIDS_OBFUSCATION_KEY || 'DefaultObfuscationKey123'
  if (!key) {
    console.warn('Obfuscation key is empty. Using a default key.')
    return 'DefaultObfuscationKey123' // Ensure a non-empty key
  }
  return key
}

/**
 * Obfuscates data using a simple XOR cipher with the provided key.
 * The result is Hex encoded.
 * @param data The string data to obfuscate.
 * @returns The Hex encoded obfuscated string, or null if input is invalid.
 */
export function obfuscateData(data: string): string | null {
  if (data.length === 0) {
    return ''
  }
  data = encodeBase64(data)
  const key = getObfuscationKey()
  let xorResult = ''
  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-bitwise
    xorResult += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    )
  }

  // Convert the XOR result to Hex
  let hexResult = ''
  for (let i = 0; i < xorResult.length; i++) {
    const hex = xorResult.charCodeAt(i).toString(16)
    hexResult += hex.padStart(2, '0') // Ensure 2 digits per character
  }
  return hexResult
}

/**
 * Deobfuscates data that was previously obfuscated with obfuscateData (using Hex).
 * Expects a Hex encoded string.
 * @param obfuscatedData The Hex encoded obfuscated string.
 * @returns The original string data, or null if input is invalid or decryption fails.
 */
export function deobfuscateData(obfuscatedData: string): string {
  if (obfuscatedData === '') {
    return ''
  }
  if (
    obfuscatedData.length % 2 !==
    0 // Hex string length must be even
  ) {
    throw new Error('Invalid Hex string length')
  }

  const key = getObfuscationKey()

  // Convert Hex back to the intermediate XORed string
  let xorResult = ''
  for (let i = 0; i < obfuscatedData.length; i += 2) {
    const hexPair = obfuscatedData.substring(i, i + 2)
    const charCode = parseInt(hexPair, 16)
    if (isNaN(charCode)) {
      // Invalid hex character found
      throw new Error('Invalid Hex character in input string')
    }
    xorResult += String.fromCharCode(charCode)
  }

  // De-XOR the result
  let result = ''
  for (let i = 0; i < xorResult.length; i++) {
    // eslint-disable-next-line no-bitwise
    result += String.fromCharCode(
      xorResult.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    )
  }

  return decodeBase64(result)
}
