export type AuthMode = 'mock' | 'real'

export interface EnvConfig {
  port: number
  frontendOrigin: string
  authMode: AuthMode
  githubClientId: string
  githubClientSecret: string
  githubRedirectUri: string
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
  isProduction: boolean
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseAuthMode(value: string | undefined): AuthMode {
  if (value === 'mock') return 'mock'
  return 'real'
}

export function loadEnv(): EnvConfig {
  const port = Number(process.env.PORT ?? 3001)
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number')
  }

  const authMode = parseAuthMode(process.env.AUTH_MODE)
  const isMock = authMode === 'mock'

  // In mock mode, OAuth credentials are optional (use placeholders)
  const requireOrMock = (name: string, mockValue: string): string => {
    if (isMock) {
      return process.env[name] ?? mockValue
    }
    return requireEnv(name)
  }

  return {
    port,
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:8080',
    authMode,
    githubClientId: requireOrMock('GITHUB_CLIENT_ID', 'mock-github-client-id'),
    githubClientSecret: requireOrMock('GITHUB_CLIENT_SECRET', 'mock-github-client-secret'),
    githubRedirectUri: requireOrMock('GITHUB_REDIRECT_URI', 'http://localhost:3001/oauth/github/callback'),
    googleClientId: requireOrMock('GOOGLE_CLIENT_ID', 'mock-google-client-id'),
    googleClientSecret: requireOrMock('GOOGLE_CLIENT_SECRET', 'mock-google-client-secret'),
    googleRedirectUri: requireOrMock('GOOGLE_REDIRECT_URI', 'http://localhost:3001/oauth/google/callback'),
    isProduction: process.env.NODE_ENV === 'production',
  }
}
