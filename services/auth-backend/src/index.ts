import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { loadEnv } from './env.js'
import { buildProviderRegistry, getProviderDriver } from './providers/registry.js'
import { generateCodeChallenge, generateCodeVerifier, generateState } from './utils/pkce.js'

const COOKIE_PREFIX = 'oauth_ctx'
const COOKIE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

function getCookieName(providerId: string): string {
  return `${COOKIE_PREFIX}_${providerId}`
}

function parseQueryParam(queryValue: unknown, name: string): string {
  if (typeof queryValue !== 'string' || !queryValue) {
    throw new Error(`Missing query param: ${name}`)
  }
  return queryValue
}

export function createApp() {
  const env = loadEnv()
  const registry = buildProviderRegistry(env)
  const app = express()

  app.use(cors({ origin: env.frontendOrigin, credentials: false }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  app.get('/oauth/:provider/start', async (req: Request, res: Response) => {
    const providerId = req.params.provider
    const driver = getProviderDriver(registry, providerId)
    if (!driver) {
      res.status(404).json({ error: 'Provider not found' })
      return
    }

    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const redirectUri =
      typeof req.query.redirect_uri === 'string' && req.query.redirect_uri.length > 0
        ? req.query.redirect_uri
        : env.frontendOrigin

    const authorizeUrl = driver.buildAuthorizeUrl({ state, codeChallenge })
    const cookieName = getCookieName(providerId)

    res.cookie(cookieName, JSON.stringify({ state, codeVerifier, redirectUri }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      path: `/oauth/${providerId}`,
      maxAge: COOKIE_MAX_AGE_MS,
    })

    res.redirect(authorizeUrl)
  })

  app.get('/oauth/:provider/callback', async (req: Request, res: Response) => {
    try {
      const providerId = req.params.provider
      const driver = getProviderDriver(registry, providerId)
      if (!driver) {
        res.status(404).json({ error: 'Provider not found' })
        return
      }

      const cookieName = getCookieName(providerId)
      const cookieValue = req.cookies?.[cookieName]
      if (!cookieValue) {
        res.status(400).json({ error: 'Missing PKCE session cookie' })
        return
      }

      let parsed: { state: string; codeVerifier: string; redirectUri?: string }
      try {
        parsed = JSON.parse(cookieValue)
      } catch {
        res.status(400).json({ error: 'Invalid PKCE session cookie' })
        return
      }

      const requestState = parseQueryParam(req.query.state, 'state')
      const code = parseQueryParam(req.query.code, 'code')

      if (requestState !== parsed.state) {
        res.status(400).json({ error: 'State mismatch' })
        return
      }

      const tokens = await driver.exchangeCode({ code, codeVerifier: parsed.codeVerifier })
      res.clearCookie(cookieName, { path: `/oauth/${providerId}` })

      const frontendRedirect =
        typeof parsed.redirectUri === 'string' && parsed.redirectUri.length > 0
          ? parsed.redirectUri
          : env.frontendOrigin

      try {
        const url = new URL(frontendRedirect)
        url.hash = new URLSearchParams({
          provider: providerId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? '',
          expires_in: tokens.expires_in?.toString() ?? '',
          scope: tokens.scope ?? '',
          token_type: tokens.token_type ?? '',
        }).toString()
        res.redirect(url.toString())
        return
      } catch {
        // Fallback to JSON if redirect URI is malformed
        res.json({ provider: providerId, ...tokens })
        return
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      res.status(500).json({ error: message })
    }
  })

  // Basic error handler (fallback)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message })
  })

  return { app, env }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, env } = createApp()
  app.listen(env.port, () => {
    console.log(`Auth backend listening on port ${env.port}`)
  })
}
