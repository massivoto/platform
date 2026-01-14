import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { loadEnv } from './env.js'
import { buildProviderRegistry, getProviderDriver } from './providers/registry.js'
import { generateCodeChallenge, generateCodeVerifier, generateState } from './utils/pkce.js'
import { encodeMockCode, generateMockTokens, MockOAuthError, parseScenario } from './providers/mock/index.js'
import { getMockSessionStore, MockSessionStates, MockSessionState, getIntegrationStatus } from '@massivoto/auth-domain'
import { TokenRepository, InMemoryTokenRepository } from './db/index.js'

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

export interface AppDependencies {
  tokenRepository?: TokenRepository
}

export function createApp(deps: AppDependencies = {}) {
  const env = loadEnv()
  const registry = buildProviderRegistry(env)
  const tokenRepository = deps.tokenRepository ?? new InMemoryTokenRepository()
  const app = express()

  app.use(cors({ origin: env.frontendOrigin, credentials: true }))
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

    // user_id is required
    const userId = req.query.user_id
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'Missing required query param: user_id' })
      return
    }

    // Parse query params
    const instant = req.query.instant === 'true'
    const scenario = parseScenario(req.query.scenario)

    // Instant mode: skip redirect dance, return tokens directly (mock mode only)
    if (env.authMode === 'mock' && instant) {
      try {
        const tokens = generateMockTokens(scenario, providerId)
        await tokenRepository.saveToken(userId, providerId, tokens)
        res.json({ provider: providerId, ...tokens })
      } catch (error) {
        if (error instanceof MockOAuthError) {
          res.status(400).json({ error: error.code, error_description: error.message })
        } else {
          res.status(500).json({ error: 'server_error', error_description: 'Unexpected error' })
        }
      }
      return
    }

    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const redirectUri =
      typeof req.query.redirect_uri === 'string' && req.query.redirect_uri.length > 0
        ? req.query.redirect_uri
        : env.frontendOrigin

    let authorizeUrl = driver.buildAuthorizeUrl({ state, codeChallenge })

    // In mock mode, override the scenario in the authorize URL with the one from request
    if (env.authMode === 'mock') {
      const url = new URL(authorizeUrl)
      url.searchParams.set('scenario', scenario)
      authorizeUrl = url.toString()
    }

    const cookieName = getCookieName(providerId)

    // Store userId and scenario in cookie (scenario for mock mode)
    const cookieData = env.authMode === 'mock'
      ? { state, codeVerifier, redirectUri, userId, scenario }
      : { state, codeVerifier, redirectUri, userId }

    res.cookie(cookieName, JSON.stringify(cookieData), {
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

      let parsed: { state: string; codeVerifier: string; redirectUri?: string; userId?: string }
      try {
        parsed = JSON.parse(cookieValue)
      } catch {
        res.status(400).json({ error: 'Invalid PKCE session cookie' })
        return
      }

      // userId must be present in cookie
      if (!parsed.userId) {
        res.status(400).json({ error: 'Missing user_id in session' })
        return
      }

      const requestState = parseQueryParam(req.query.state, 'state')
      const code = parseQueryParam(req.query.code, 'code')

      if (requestState !== parsed.state) {
        res.status(400).json({ error: 'State mismatch' })
        return
      }

      const tokens = await driver.exchangeCode({ code, codeVerifier: parsed.codeVerifier })

      // Save token to repository
      await tokenRepository.saveToken(parsed.userId, providerId, tokens)

      res.clearCookie(cookieName, { path: `/oauth/${providerId}` })

      const frontendRedirect =
        typeof parsed.redirectUri === 'string' && parsed.redirectUri.length > 0
          ? parsed.redirectUri
          : env.frontendOrigin

      try {
        const url = new URL(frontendRedirect)
        // Only pass status in hash, tokens are stored server-side
        url.hash = new URLSearchParams({
          provider: providerId,
          status: 'success',
        }).toString()
        res.redirect(url.toString())
        return
      } catch {
        // Fallback to JSON if redirect URI is malformed
        res.json({ provider: providerId, status: 'success' })
        return
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      res.status(500).json({ error: message })
    }
  })

  // ============================================================================
  // Integration API Endpoints
  // ============================================================================

  app.get('/api/integrations', async (req: Request, res: Response) => {
    const userId = req.query.user_id
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'Missing required query param: user_id' })
      return
    }

    try {
      const integrations = await tokenRepository.listTokens(userId)
      res.json({ integrations })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      res.status(500).json({ error: message })
    }
  })

  app.get('/api/integrations/:providerId', async (req: Request, res: Response) => {
    const userId = req.query.user_id
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'Missing required query param: user_id' })
      return
    }

    const { providerId } = req.params

    try {
      const token = await tokenRepository.getToken(userId, providerId)
      if (!token) {
        res.status(404).json({ error: 'Integration not found' })
        return
      }

      res.json({
        providerId: token.providerId,
        status: getIntegrationStatus(token),
        connectedAt: token.createdAt,
        expiresAt: token.expiresAt,
        scopes: token.scopes,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      res.status(500).json({ error: message })
    }
  })

  app.delete('/api/integrations/:providerId', async (req: Request, res: Response) => {
    const userId = req.query.user_id
    if (typeof userId !== 'string' || !userId) {
      res.status(400).json({ error: 'Missing required query param: user_id' })
      return
    }

    const { providerId } = req.params

    try {
      const deleted = await tokenRepository.deleteToken(userId, providerId)
      if (!deleted) {
        res.status(404).json({ error: 'Integration not found' })
        return
      }

      res.json({ deleted: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      res.status(500).json({ error: message })
    }
  })

  // Mock authorize endpoint - only registered in mock mode
  // Simulates the OAuth provider's authorization page
  if (env.authMode === 'mock') {
    app.get('/mock/authorize', (req: Request, res: Response) => {
      const state = req.query.state as string
      const redirectUri = req.query.redirect_uri as string
      const scenario = parseScenario(req.query.scenario)
      const providerId = (req.query.provider as string) || 'unknown'

      if (!state || !redirectUri) {
        res.status(400).json({ error: 'Missing required parameters: state, redirect_uri' })
        return
      }

      try {
        const url = new URL(redirectUri)

        // For 'denied' scenario, simulate user clicking "Deny"
        if (scenario === 'denied') {
          url.searchParams.set('error', 'access_denied')
          url.searchParams.set('error_description', 'The user denied the authorization request')
          url.searchParams.set('state', state)
          res.redirect(url.toString())
          return
        }

        // For 'error' scenario, simulate provider error
        if (scenario === 'error') {
          url.searchParams.set('error', 'server_error')
          url.searchParams.set('error_description', 'The authorization server encountered an unexpected error')
          url.searchParams.set('state', state)
          res.redirect(url.toString())
          return
        }

        // For success/expired scenarios, simulate user clicking "Allow"
        // Generate a mock code that encodes the scenario
        const mockCode = encodeMockCode(scenario, providerId)
        url.searchParams.set('code', mockCode)
        url.searchParams.set('state', state)
        res.redirect(url.toString())
      } catch {
        res.status(400).json({ error: 'Invalid redirect_uri' })
      }
    })

    // Session management endpoints for testing
    app.get('/mock/sessions', (_req: Request, res: Response) => {
      const store = getMockSessionStore()
      res.json({ sessions: store.listSessions() })
    })

    app.get('/mock/sessions/:id', (req: Request, res: Response) => {
      const store = getMockSessionStore()
      const session = store.getSession(req.params.id)
      if (!session) {
        res.status(404).json({ error: 'Session not found' })
        return
      }
      res.json(session)
    })

    app.post('/mock/sessions/:id/state', (req: Request, res: Response) => {
      const { state } = req.body as { state?: string }
      if (!state || !MockSessionStates.includes(state as MockSessionState)) {
        res.status(400).json({
          error: 'Invalid state',
          validStates: MockSessionStates,
        })
        return
      }

      const store = getMockSessionStore()
      const session = store.getSession(req.params.id)
      if (!session) {
        res.status(404).json({ error: 'Session not found' })
        return
      }

      store.updateState(req.params.id, state as MockSessionState)
      res.json({ ...session, state })
    })

    app.delete('/mock/sessions/:id', (req: Request, res: Response) => {
      const store = getMockSessionStore()
      store.deleteSession(req.params.id)
      res.json({ deleted: true })
    })

    app.delete('/mock/sessions', (_req: Request, res: Response) => {
      const store = getMockSessionStore()
      store.clear()
      res.json({ cleared: true })
    })

    console.log('Mock mode enabled - /mock/* endpoints registered')
  }

  // Basic error handler (fallback)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message })
  })

  return { app, env, tokenRepository }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, env } = createApp()
  app.listen(env.port, () => {
    console.log(`Auth backend listening on port ${env.port}`)
  })
}
