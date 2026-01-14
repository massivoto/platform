# PRD: OAuth Mock Testing

**Status:** IMPLEMENTED

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Parent PRD

- [OAuth Flow Completion](./oauth-flow.prd.md)

## Child PRDs

- None

## Context

The OAuth flow implementation is complete (see parent PRD), but automated testing of the full redirect chain is missing. Currently, the only way to validate the flow is manual testing: click Connect -> authorize -> callback -> redirect with hash -> frontend parses hash.

We have mock infrastructure in place (`mock.provider.ts`, `mock.scenarios.ts`, `mock.tokens.ts`) but no `/mock/authorize` endpoint to simulate the OAuth provider's redirect behavior. This prevents automated integration testing of the redirect chain.

This PRD defines the work to enable automated testing of all OAuth redirections, covering both success and error scenarios.

## Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2026-01-14 | Testing strategy | Hybrid (backend integration + frontend unit) | Best coverage/speed ratio, tests both sides |
| 2026-01-14 | Mock authorize location | Backend `/mock/authorize` endpoint | Keeps mock logic centralized in auth-backend |
| 2026-01-14 | Test framework | Vitest + Supertest | Already used in project, fast execution |
| 2026-01-14 | HTTP client for redirects | Supertest `agent()` | Cookie jar persists across requests, `redirects(0)` captures 302s |
| 2026-01-14 | Browser simulation | Not needed | Supertest agent handles cookies/redirects without browser overhead |

## Scope

**In scope:**
- `/mock/authorize` endpoint that simulates OAuth provider redirect
- Backend integration tests for `/start` -> `/callback` -> redirect chain
- Backend integration tests for all error scenarios
- Frontend unit tests for hash parsing on mount
- Frontend unit tests for `useIntegrations` hook OAuth callback handling

**Out of scope:**
- Playwright E2E tests (can be added later)
- Performance testing
- Load testing of OAuth endpoints

## Requirements

### Mock Authorize Endpoint

**Test:** `npx vitest run services/auth-backend/src/mock`

R-MOCKTEST-01: Create `GET /mock/authorize` endpoint that accepts standard OAuth parameters: `client_id`, `redirect_uri`, `state`, `code_challenge`, `scope`, `scenario`, `provider`

R-MOCKTEST-02: `/mock/authorize` must redirect (302) to the `redirect_uri` with `code` and `state` query parameters

R-MOCKTEST-03: The `code` parameter must be generated using `encodeMockCode(scenario, provider)` from `mock.tokens.ts`

R-MOCKTEST-04: When `scenario=denied`, redirect with `?error=access_denied&error_description=User+denied+access&state={state}`

R-MOCKTEST-05: When `scenario=error`, redirect with `?error=server_error&error_description=Authorization+server+error&state={state}`

R-MOCKTEST-06: `/mock/authorize` must only be registered when `AUTH_MODE=mock` environment variable is set

### Backend Integration Tests

**Test:** `npx vitest run services/auth-backend/src/oauth/oauth.integration.spec.ts`

R-MOCKTEST-21: Test `/oauth/:provider/start` returns 302 redirect to mock authorize URL with correct parameters

R-MOCKTEST-22: Test `/oauth/:provider/start` sets PKCE cookie with `state`, `codeVerifier`, `userId`

R-MOCKTEST-23: Test `/oauth/:provider/start` returns 400 if `user_id` query parameter is missing

R-MOCKTEST-24: Test full redirect chain: `/start` -> `/mock/authorize` -> `/callback` -> final redirect

R-MOCKTEST-25: Test `/callback` with `scenario=success` saves token to repository and redirects with `#provider=x&status=success`

R-MOCKTEST-26: Test `/callback` with `scenario=denied` redirects with `#provider=x&error=access_denied`

R-MOCKTEST-27: Test `/callback` with `scenario=error` redirects with `#provider=x&error=server_error`

R-MOCKTEST-28: Test `/callback` with `scenario=expired` saves token with expired state and redirects with success (token is valid but expired)

R-MOCKTEST-29: Test `/callback` with invalid `state` (CSRF) returns error redirect `#error=state_mismatch`

R-MOCKTEST-30: Test `/callback` with expired cookie (>10 min) returns error redirect `#error=session_expired`

### Frontend Hook Tests

**Test:** `npx vitest run apps/auth/src/hooks/useIntegrations.spec.ts`

R-MOCKTEST-41: Test `useIntegrations` hook detects `#provider=x&status=success` hash on mount

R-MOCKTEST-42: Test `useIntegrations` hook calls `refresh()` after detecting success hash

R-MOCKTEST-43: Test `useIntegrations` hook clears hash from URL after processing (using `history.replaceState`)

R-MOCKTEST-44: Test `useIntegrations` hook detects `#provider=x&error=access_denied` and exposes error state

R-MOCKTEST-45: Test `useIntegrations` hook does not trigger on unrelated hash fragments

R-MOCKTEST-46: Test `connect(providerId)` redirects to correct backend URL with `user_id` and `redirect_uri`

### Frontend Component Tests

**Test:** `npx vitest run apps/auth/src/components/integration/ConnectOAuthButton.spec.ts`

R-MOCKTEST-61: Test `ConnectOAuthButton` renders connect state when not connected

R-MOCKTEST-62: Test `ConnectOAuthButton` renders connected state with provider info when connected

R-MOCKTEST-63: Test `ConnectOAuthButton` click triggers `connect()` from `useIntegrations` hook

R-MOCKTEST-64: Test `ConnectOAuthButton` shows loading state during OAuth flow

R-MOCKTEST-65: Test `ConnectOAuthButton` shows error state when OAuth fails

## Supertest Agent Pattern

Backend integration tests use Supertest's `agent()` to persist cookies across the redirect chain:

```typescript
import { agent } from 'supertest'
import { createApp } from './app'

describe('OAuth redirect chain', () => {
  const client = agent(createApp({ authMode: 'mock' }))

  it('completes full OAuth flow', async () => {
    // 1. /start sets PKCE cookie, returns redirect to /mock/authorize
    const start = await client
      .get('/oauth/github/start?user_id=test-user')
      .redirects(0)
      .expect(302)

    // 2. Extract state from redirect URL
    const authorizeUrl = new URL(start.headers.location)
    const state = authorizeUrl.searchParams.get('state')

    // 3. /mock/authorize returns redirect to /callback with code
    const authorize = await client
      .get(authorizeUrl.pathname + authorizeUrl.search)
      .redirects(0)
      .expect(302)

    // 4. /callback reads PKCE cookie, exchanges code, saves token
    const callbackUrl = new URL(authorize.headers.location, 'http://localhost')
    const callback = await client
      .get(callbackUrl.pathname + callbackUrl.search)
      .redirects(0)
      .expect(302)

    // 5. Verify final redirect has success hash
    expect(callback.headers.location).toMatch(/#provider=github&status=success/)
  })
})
```

Key patterns:
- `agent(app)` creates client with cookie jar
- `redirects(0)` prevents auto-following redirects
- Cookie set in step 1 is automatically sent in step 4
- Each step verifies the redirect URL before following

## Test Scenarios Matrix

| Scenario | Mock Code | Callback Behavior | Final Redirect Hash |
|----------|-----------|-------------------|---------------------|
| success | `mock_code_success_github_*` | Save token, status=connected | `#provider=github&status=success` |
| expired | `mock_code_expired_github_*` | Save token, status=expired | `#provider=github&status=success` |
| revoked | `mock_code_revoked_github_*` | Save token, status=revoked | `#provider=github&status=success` |
| denied | N/A (error redirect) | No token saved | `#provider=github&error=access_denied` |
| error | N/A (error redirect) | No token saved | `#provider=github&error=server_error` |

## Dependencies

- **Depends on:**
  - `@massivoto/auth-domain` (mock-token, mock-session)
  - `services/auth-backend` mock provider infrastructure
  - `oauth-flow.prd.md` implementation (IMPLEMENTED)
- **Blocks:**
  - CI/CD pipeline OAuth validation
  - Future Playwright E2E tests
- **New dev dependencies:**
  - `supertest` - HTTP assertions with cookie jar support
  - `@types/supertest` - TypeScript types

## Open Questions

- [x] ~~Should we add rate limiting to `/mock/authorize`?~~ No, mock endpoints are for testing only
- [x] ~~Should mock endpoints return artificial delays?~~ No, fast tests are better; latency testing is out of scope

## Acceptance Criteria

- [x] All 5 scenarios (success, expired, revoked, denied, error) have passing integration tests
- [x] Frontend hook correctly parses all hash variants
- [x] `AUTH_MODE=mock` enables mock endpoints, production mode does not expose them
- [x] Tests run in CI without external dependencies
- [x] Manual test in PRD `oauth-flow.prd.md` can be replaced with automated test reference
