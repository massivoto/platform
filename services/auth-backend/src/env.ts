export interface EnvConfig {
  port: number
  frontendOrigin: string
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

export function loadEnv(): EnvConfig {
  const port = Number(process.env.PORT ?? 3001)
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number')
  }

  return {
    port,
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:8080',
    githubClientId: requireEnv('GITHUB_CLIENT_ID'),
    githubClientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
    githubRedirectUri: requireEnv('GITHUB_REDIRECT_URI'),
    googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    googleRedirectUri: requireEnv('GOOGLE_REDIRECT_URI'),
    isProduction: process.env.NODE_ENV === 'production',
  }
}
