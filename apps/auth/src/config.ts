/**
 * App configuration from environment variables.
 * Fails fast with clear error messages if required vars are missing.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Check your .env file.`)
  }
  return value
}

export const config = {
  backendUrl: requireEnv('VITE_BACKEND_URL'),
}
