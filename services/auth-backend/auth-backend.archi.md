# Architecture: Auth Backend

**Last updated:** 2026-01-14

## Parent

- [Platform Root](../../root.archi.md)

## Children

- None

## Overview

The Auth Backend (`services/auth-backend`) is an Express.js API that handles OAuth 2.0 Authorization Code flow with PKCE for secure third-party provider integration. It manages the OAuth redirect dance, token exchange, and secure token storage. The service supports multiple providers (GitHub, Google services) and includes a mock mode for testing the full redirect chain without external dependencies.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AUTH-BACKEND (services/auth-backend)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Express Application                           │   │
│  │                           (src/index.ts)                             │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         │                         │                         │              │
│         ▼                         ▼                         ▼              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────────┐      │
│  │ OAuth Routes│         │  API Routes │         │  Mock Routes    │      │
│  │             │         │             │         │  (test mode)    │      │
│  │/oauth/:prov │         │/api/integr  │         │/mock/authorize  │      │
│  │  /start     │         │  GET list   │         │/mock/sessions   │      │
│  │  /callback  │         │  GET one    │         │                 │      │
│  │             │         │  DELETE     │         │                 │      │
│  └──────┬──────┘         └──────┬──────┘         └────────┬────────┘      │
│         │                       │                          │               │
│         └───────────────────────┼──────────────────────────┘               │
│                                 │                                          │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Provider Registry                               │   │
│  │                    (src/providers/registry.ts)                       │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│       ┌───────────────────────────┼───────────────────────────┐            │
│       │                           │                           │            │
│       ▼                           ▼                           ▼            │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │   GitHub    │         │   Google    │         │    Mock     │          │
│  │   Driver    │         │   Driver    │         │   Driver    │          │
│  │             │         │             │         │             │          │
│  │github.prov  │         │google.prov  │         │mock.prov    │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│                                                                             │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Token Repository                                 │   │
│  │                        (src/db/)                                     │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│              ┌────────────────────┼────────────────────┐                   │
│              ▼                                         ▼                   │
│  ┌───────────────────────┐               ┌───────────────────────┐        │
│  │ InMemoryTokenRepository│               │PostgresTokenRepository│        │
│  │   (testing/dev)       │               │    (production)       │        │
│  └───────────────────────┘               └───────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## OAuth Flow

```
┌────────┐   ┌───────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐
│Frontend│   │auth-backend│   │/mock/authorize│  │ Provider │   │   DB     │
└───┬────┘   └─────┬─────┘   │ (or real)    │   └────┬─────┘   └────┬─────┘
    │              │          └──────┬───────┘        │              │
    │ 1. /oauth/github/start       │                │              │
    │    ?user_id=xxx&redirect=... │                │              │
    ├─────────────►│               │                │              │
    │              │               │                │              │
    │              │ 2. Generate state, verifier    │              │
    │              │    Set PKCE cookie             │              │
    │              │               │                │              │
    │  3. 302 to authorize URL     │                │              │
    │◄─────────────┤               │                │              │
    │              │               │                │              │
    │ 4. User redirected           │                │              │
    ├─────────────────────────────►│ or ──────────►│              │
    │                              │                │              │
    │                              │  5. User       │              │
    │                              │     approves   │              │
    │                              │                │              │
    │  6. 302 to /callback?code=...&state=...      │              │
    │◄─────────────────────────────┤◄──────────────┤              │
    │              │               │                │              │
    │ 7. /callback with code       │                │              │
    ├─────────────►│               │                │              │
    │              │               │                │              │
    │              │ 8. Verify state, read cookie   │              │
    │              │    Exchange code for tokens ──────────────────┤
    │              │◄──────────────────────────────────────────────┤
    │              │               │                │              │
    │              │ 9. Save token ───────────────────────────────►│
    │              │               │                │              │
    │  10. 302 to frontend#provider=github&status=success         │
    │◄─────────────┤               │                │              │
    │              │               │                │              │
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `createApp()` | src/index.ts | Express app factory with routes and middleware |
| `ProviderDriver` | src/types/oauth.ts | Interface for OAuth provider implementations |
| `buildProviderRegistry()` | src/providers/registry.ts | Creates provider drivers based on auth mode |
| `TokenRepository` | src/db/token-repository.ts | Interface for token persistence |
| `InMemoryTokenRepository` | src/db/in-memory-token-repository.ts | Map-based storage for tests |
| `PostgresTokenRepository` | src/db/postgres-token-repository.ts | Production database storage |
| `MockDriver` | src/providers/mock/ | Simulates OAuth for integration tests |

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ENDPOINTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OAuth Flow:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ GET /oauth/:provider/start?user_id=xxx&redirect_uri=...             │   │
│  │     → Sets PKCE cookie, redirects to provider authorize URL         │   │
│  │                                                                      │   │
│  │ GET /oauth/:provider/callback?code=xxx&state=xxx                    │   │
│  │     → Exchanges code for tokens, saves to DB, redirects to frontend │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Integration API:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ GET    /api/integrations?user_id=xxx                                │   │
│  │        → List all connected providers for user                      │   │
│  │                                                                      │   │
│  │ GET    /api/integrations/:providerId?user_id=xxx                    │   │
│  │        → Get single integration status                              │   │
│  │                                                                      │   │
│  │ DELETE /api/integrations/:providerId?user_id=xxx                    │   │
│  │        → Disconnect provider                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Mock Endpoints (AUTH_MODE=mock only):                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ GET  /mock/authorize?state=&redirect_uri=&scenario=                 │   │
│  │      → Simulates OAuth provider authorize page                      │   │
│  │                                                                      │   │
│  │ GET  /mock/sessions         → List all mock sessions                │   │
│  │ GET  /mock/sessions/:id     → Get session by ID                     │   │
│  │ POST /mock/sessions/:id/state  → Update session state               │   │
│  │ DELETE /mock/sessions/:id   → Delete session                        │   │
│  │ DELETE /mock/sessions       → Clear all sessions                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Provider Driver Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROVIDER DRIVER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  interface ProviderDriver {                                                │
│    config: {                                                               │
│      id: string              // "github", "google-gmail"                   │
│      displayName: string     // "GitHub", "Google Gmail"                   │
│      authorizeUrl: string    // Provider's auth endpoint                   │
│      tokenUrl: string        // Provider's token endpoint                  │
│      scopes: string[]        // Default scopes                             │
│    }                                                                       │
│                                                                            │
│    buildAuthorizeUrl(opts: {                                              │
│      state: string                                                        │
│      codeChallenge: string                                                │
│    }): string                                                             │
│                                                                            │
│    exchangeCode(opts: {                                                   │
│      code: string                                                         │
│      codeVerifier: string                                                 │
│    }): Promise<TokenResponse>                                             │
│  }                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mock Scenarios

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOCK SCENARIOS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario     │ Description                  │ Final Redirect Hash         │
│  ─────────────┼──────────────────────────────┼─────────────────────────────│
│  success      │ Normal successful auth       │ #provider=x&status=success  │
│  expired      │ Token with past expiry       │ #provider=x&status=success  │
│  revoked      │ Token marked as revoked      │ #provider=x&status=success  │
│  denied       │ User clicks "Deny"           │ #provider=x&error=access_denied │
│  error        │ Provider server error        │ #provider=x&error=server_error  │
│                                                                             │
│  Usage: /oauth/github/start?user_id=xxx&scenario=denied                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## PKCE Cookie Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PKCE COOKIE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Cookie Name: oauth_ctx_{providerId}                                       │
│  Path:        /oauth/{providerId}                                          │
│  Max Age:     10 minutes                                                   │
│  HttpOnly:    true                                                         │
│  Secure:      true (production only)                                       │
│  SameSite:    lax                                                          │
│                                                                             │
│  Content (JSON):                                                           │
│  {                                                                         │
│    "state": "random-csrf-token",                                          │
│    "codeVerifier": "pkce-verifier-string",                                │
│    "redirectUri": "https://frontend.com/dashboard",                       │
│    "userId": "user-123",                                                  │
│    "scenario": "success"  // mock mode only                               │
│  }                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:**
  - @massivoto/auth-domain (token types, session store, status utilities)
  - express, cors, cookie-parser
  - dotenv (environment configuration)
- **Used by:**
  - apps/auth (frontend calls OAuth and API endpoints)
- **Database:**
  - PostgreSQL (production token storage)
