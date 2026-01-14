# PRD: OAuth Flow Completion

**Status:** IMPLEMENTED

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Parent PRD

- None (top-level for auth-backend)

## Child PRDs

- None

## Context

The OAuth system has partial implementation: `auth-domain` provides types and PKCE utilities, `auth-backend` handles the OAuth redirect dance (`/start` and `/callback`), but tokens are returned to the frontend without being persisted. The frontend (`apps/auth`) currently bypasses the backend entirely, using an insecure implicit flow with localStorage.

This PRD defines the minimum work to complete the OAuth PKCE flow: persist tokens server-side, associate them with platform users, and update the frontend to use the backend endpoints.

## Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2026-01-13 | Token storage | PostgreSQL | Production-ready, queryable, path to scale |
| 2026-01-13 | Testing strategy | Mock repository for unit tests | Fast tests; testcontainers for integration later |
| 2026-01-13 | User association | Query param (`user_id`) | Simple, stateless, works now |
| 2026-01-13 | Scope | Minimum viable | PKCE + save only; refresh/revocation later |
| 2026-01-13 | Success redirect | `/dashboard#provider=x&status=success` | Frontend parses hash, shows toast |
| 2026-01-13 | user_id validation | None (trusted string) | Simple for MVP, e.g., "john_doe" |
| 2026-01-13 | Postgres client | postgres.js | Modern, tagged templates, cleaner syntax |
| 2026-01-13 | Status column | Yes | Track `connected`, `revoked`, `expired` in DB |
| 2026-01-13 | Future: ORM | Prisma | Migrate from postgres.js to Prisma for schema management |

## Scope

**In scope:**
- PostgreSQL setup with docker-compose
- Token repository interface + mock implementation
- Persist tokens in `/callback` handler
- Accept `user_id` in `/start` endpoint
- API endpoint to list user's integrations
- Frontend refactor to call backend `/start`
- Frontend hash parsing for success/error feedback

**Out of scope:**
- Token refresh logic
- Token revocation UI
- Multiple connections per provider
- Testcontainers / integration tests
- Encryption at rest (tokens stored as-is for now)
- Rate limiting, audit logs

## Requirements

### Database & Repository

**Test:** `npx vitest run services/auth-backend/src/db`

R-OAUTH-01: Define `TokenRepository` interface with methods: `saveToken(userId, providerId, token)`, `getToken(userId, providerId)`, `listTokens(userId)`, `deleteToken(userId, providerId)`

R-OAUTH-02: Implement `InMemoryTokenRepository` for unit tests that stores tokens in a Map

R-OAUTH-03: Implement `PostgresTokenRepository` that persists to `integration_tokens` table

R-OAUTH-04: Create SQL migration for `integration_tokens` table with columns: `id`, `user_id`, `provider_id`, `access_token`, `refresh_token`, `expires_at`, `scopes`, `status` (connected|revoked|expired), `created_at`, `updated_at`

R-OAUTH-05: Add docker-compose.yml in `/services` with PostgreSQL service (port 5432, volume for persistence)

### Backend OAuth Flow

**Test:** `npx vitest run services/auth-backend/src/oauth`

R-OAUTH-21: Modify `/oauth/:provider/start` to accept `user_id` query parameter (required)

R-OAUTH-22: Store `user_id` in the PKCE cookie alongside `state`, `codeVerifier`, `redirectUri`

R-OAUTH-23: Modify `/oauth/:provider/callback` to extract `user_id` from cookie and pass to repository

R-OAUTH-24: In callback, after successful token exchange, call `repository.saveToken(userId, providerId, tokens)` before redirecting

R-OAUTH-25: Inject `TokenRepository` into the Express app via dependency injection (constructor or middleware)

R-OAUTH-26: Return error if `user_id` is missing or invalid in `/start`

### Backend API Endpoints

**Test:** `npx vitest run services/auth-backend/src/api`

R-OAUTH-41: Add `GET /api/integrations` endpoint that returns list of connected providers for a user

R-OAUTH-42: Accept `user_id` as query parameter for `/api/integrations`

R-OAUTH-43: Response format: `{ integrations: [{ providerId, status, connectedAt, expiresAt }] }`

R-OAUTH-44: Add `GET /api/integrations/:providerId` endpoint to get single integration details

R-OAUTH-45: Add `DELETE /api/integrations/:providerId` endpoint to remove a connection

### Frontend Updates

**Test:** `npx vitest run apps/auth/src/hooks`

R-OAUTH-61: Create `useIntegrations(userId)` hook that fetches from backend `/api/integrations`

R-OAUTH-62: Hook exposes: `integrations`, `loading`, `connect(providerId)`, `disconnect(providerId)`, `refresh()`

R-OAUTH-63: `connect()` redirects to `BACKEND_URL/oauth/:provider/start?user_id=X&redirect_uri=Y`

R-OAUTH-64: On mount, check `window.location.hash` for OAuth callback result using `parseOAuthHash()` from auth-domain

R-OAUTH-65: If hash contains success, show toast and call `refresh()`; if error, show error toast

R-OAUTH-66: Clear hash from URL after processing

R-OAUTH-67: Refactor `ConnectOAuthButton` to use `useIntegrations` hook instead of direct OAuth

R-OAUTH-68: Remove localStorage token storage from frontend (tokens are server-side now)

### Infrastructure

**Test:** Manual verification

R-OAUTH-81: docker-compose.yml in `/services` with: postgres:16 image, port 5432, volume `pgdata`, env vars for user/password/db

R-OAUTH-82: Add `.env.example` in `services/auth-backend` documenting required env vars including `DATABASE_URL`

R-OAUTH-83: Update `services/auth-backend/package.json` with `postgres` (postgres.js) dependency

## Dependencies

- **Depends on:** @massivoto/auth-domain (types, PKCE utilities)
- **Blocks:** Token refresh feature, revocation UI, integration usage in workflows

## Open Questions

- [x] ~~Should `user_id` be validated?~~ No, trusted string (e.g., "john_doe")
- [x] ~~What PostgreSQL client library?~~ postgres.js
- [x] ~~Should we add a `status` column?~~ Yes: `connected | revoked | expired`

## Acceptance Criteria

- [x] `docker-compose up` starts PostgreSQL
- [x] Unit tests pass with mock repository (11 tests in auth-backend, 20 tests in auth frontend)
- [ ] Manual test: click Connect in frontend -> backend OAuth flow -> token saved to DB -> redirect to dashboard with success hash
- [x] `GET /api/integrations` returns the saved connection
- [x] Frontend shows connected state after refresh
