/**
 * CUID validation utility for tests
 * CUIDs are 25 characters long and contain letters and numbers
 * Format: c[a-z0-9]{24}
 */
export function isValidCuid(cuid: string): boolean {
  return /^c[a-z0-9]{24}$/.test(cuid)
}

/**
 * CUID regex pattern for use in test expectations
 */
export const CUID_PATTERN = /^c[a-z0-9]{24}$/
