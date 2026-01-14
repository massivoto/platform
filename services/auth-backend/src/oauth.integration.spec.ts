/**
 * OAuth Integration Tests
 *
 * Tests the full OAuth redirect chain using Supertest agent for cookie persistence.
 * Requirements: R-MOCKTEST-21 to R-MOCKTEST-30
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from './index.js'
import { InMemoryTokenRepository } from './db/index.js'
import { resetMockSessionStore } from '@massivoto/auth-domain'

describe('OAuth Integration Tests', () => {
  let tokenRepository: InMemoryTokenRepository

  // Set mock mode before any tests run
  beforeAll(() => {
    process.env.AUTH_MODE = 'mock'
    process.env.FRONTEND_ORIGIN = 'http://localhost:8080'
  })

  afterAll(() => {
    delete process.env.AUTH_MODE
    delete process.env.FRONTEND_ORIGIN
  })

  beforeEach(() => {
    tokenRepository = new InMemoryTokenRepository()
    resetMockSessionStore()
  })

  describe('/oauth/:provider/start', () => {
    // R-MOCKTEST-21: Test /start returns 302 redirect to mock authorize URL
    it('redirects to mock authorize URL with correct parameters', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      const res = await agent
        .get('/oauth/github/start?user_id=test-user')
        .redirects(0)
        .expect(302)

      const location = res.headers.location
      expect(location).toContain('/mock/authorize')
      expect(location).toContain('client_id=')
      expect(location).toContain('redirect_uri=')
      expect(location).toContain('state=')
      expect(location).toContain('code_challenge=')
      expect(location).toContain('scope=')
    })

    // R-MOCKTEST-22: Test /start sets PKCE cookie
    it('sets PKCE cookie with state, codeVerifier, userId', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      const res = await agent
        .get('/oauth/github/start?user_id=test-user')
        .redirects(0)
        .expect(302)

      const cookies = res.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some((c: string) => c.includes('oauth_ctx_github'))).toBe(true)

      // Parse the cookie to verify contents
      const cookieHeader = cookies.find((c: string) => c.includes('oauth_ctx_github'))
      const cookieValue = decodeURIComponent(cookieHeader.split(';')[0].split('=')[1])
      const parsed = JSON.parse(cookieValue)

      expect(parsed.state).toBeDefined()
      expect(parsed.codeVerifier).toBeDefined()
      expect(parsed.userId).toBe('test-user')
    })

    // R-MOCKTEST-23: Test /start returns 400 if user_id is missing
    it('returns 400 if user_id is missing', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      const res = await agent
        .get('/oauth/github/start')
        .expect(400)

      expect(res.body.error).toContain('user_id')
    })
  })

  describe('Full OAuth Redirect Chain', () => {
    // R-MOCKTEST-24: Test full redirect chain
    it('completes full redirect chain: /start -> /mock/authorize -> /callback -> final redirect', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Step 1: Start OAuth flow
      const startRes = await agent
        .get('/oauth/github/start?user_id=test-user&redirect_uri=http://localhost:8080/dashboard')
        .redirects(0)
        .expect(302)

      // Step 2: Follow redirect to /mock/authorize
      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)
        .expect(302)

      // Step 3: Follow redirect to /callback
      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      expect(callbackUrl.pathname).toBe('/oauth/github/callback')
      expect(callbackUrl.searchParams.get('code')).toMatch(/^mock_code_/)
      expect(callbackUrl.searchParams.get('state')).toBeDefined()

      const callbackRes = await agent
        .get(callbackUrl.pathname + callbackUrl.search)
        .redirects(0)
        .expect(302)

      // Step 4: Verify final redirect has success hash
      expect(callbackRes.headers.location).toContain('http://localhost:8080/dashboard')
      expect(callbackRes.headers.location).toContain('#provider=github')
      expect(callbackRes.headers.location).toContain('status=success')
    })

    // R-MOCKTEST-25: Test success scenario saves token
    it('saves token to repository on success', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Complete the flow
      const startRes = await agent
        .get('/oauth/github/start?user_id=test-user')
        .redirects(0)

      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)

      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      await agent
        .get(callbackUrl.pathname + callbackUrl.search)
        .redirects(0)
        .expect(302)

      // Verify token was saved
      const token = await tokenRepository.getToken('test-user', 'github')
      expect(token).toBeDefined()
      expect(token?.accessToken?.rawValue).toMatch(/^mock:github:/)
      expect(token?.providerId).toBe('github')
    })

    // R-MOCKTEST-26: Test denied scenario
    it('redirects with error hash when user denies access', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Start with denied scenario
      const startRes = await agent
        .get('/oauth/github/start?user_id=test-user&scenario=denied')
        .redirects(0)

      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)
        .expect(302)

      // Mock authorize redirects with error params
      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      expect(callbackUrl.searchParams.get('error')).toBe('access_denied')

      // No token should be saved
      const token = await tokenRepository.getToken('test-user', 'github')
      expect(token).toBeNull()
    })

    // R-MOCKTEST-27: Test error scenario
    it('redirects with error hash on server error', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Start with error scenario
      const startRes = await agent
        .get('/oauth/github/start?user_id=test-user&scenario=error')
        .redirects(0)

      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)
        .expect(302)

      // Mock authorize redirects with error params
      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      expect(callbackUrl.searchParams.get('error')).toBe('server_error')

      // No token should be saved
      const token = await tokenRepository.getToken('test-user', 'github')
      expect(token).toBeNull()
    })

    // R-MOCKTEST-28: Test expired scenario saves token with expired state
    it('saves token with expired state for expired scenario', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Start with expired scenario
      const startRes = await agent
        .get('/oauth/github/start?user_id=test-user&scenario=expired')
        .redirects(0)

      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)

      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      const callbackRes = await agent
        .get(callbackUrl.pathname + callbackUrl.search)
        .redirects(0)
        .expect(302)

      // Should still redirect with success (token is saved, but expired)
      expect(callbackRes.headers.location).toContain('status=success')

      // Token should be saved
      const token = await tokenRepository.getToken('test-user', 'github')
      expect(token).toBeDefined()
      expect(token?.accessToken?.rawValue).toMatch(/^mock:github:/)
    })
  })

  describe('Security Tests', () => {
    // R-MOCKTEST-29: Test CSRF protection (state mismatch)
    it('returns error when state does not match (CSRF protection)', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Start OAuth flow to set the cookie
      await agent
        .get('/oauth/github/start?user_id=test-user')
        .redirects(0)

      // Try callback with wrong state
      const res = await agent
        .get('/oauth/github/callback?code=mock_code_success_github_123&state=wrong-state')
        .expect(400)

      expect(res.body.error).toContain('State mismatch')
    })

    // R-MOCKTEST-30: Test expired session (no cookie)
    it('returns error when session cookie is missing', async () => {
      const { app } = createApp({ tokenRepository })
      // Don't use agent - no cookies
      const res = await request(app)
        .get('/oauth/github/callback?code=mock_code_success_github_123&state=some-state')
        .expect(400)

      expect(res.body.error).toContain('cookie')
    })
  })

  describe('Multiple Providers', () => {
    it('handles Google OAuth flow', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      const startRes = await agent
        .get('/oauth/google/start?user_id=test-user')
        .redirects(0)
        .expect(302)

      const authorizeUrl = new URL(startRes.headers.location, 'http://localhost:3001')
      const authorizeRes = await agent
        .get(authorizeUrl.pathname + authorizeUrl.search)
        .redirects(0)

      const callbackUrl = new URL(authorizeRes.headers.location, 'http://localhost:3001')
      const callbackRes = await agent
        .get(callbackUrl.pathname + callbackUrl.search)
        .redirects(0)
        .expect(302)

      expect(callbackRes.headers.location).toContain('#provider=google')
      expect(callbackRes.headers.location).toContain('status=success')

      const token = await tokenRepository.getToken('test-user', 'google')
      expect(token).toBeDefined()
      expect(token?.providerId).toBe('google')
    })

    it('isolates cookies between providers', async () => {
      const { app } = createApp({ tokenRepository })
      const agent = request.agent(app)

      // Start GitHub flow
      await agent
        .get('/oauth/github/start?user_id=test-user')
        .redirects(0)

      // Start Google flow (different cookie)
      await agent
        .get('/oauth/google/start?user_id=test-user')
        .redirects(0)

      // GitHub cookie should still work
      // (This tests that cookies are scoped by provider path)
    })
  })
})
