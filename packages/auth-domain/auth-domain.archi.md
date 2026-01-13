# Architecture: OAuth System

**Last updated:** 2026-01-13

## Parent

- [Platform Root](../../root.archi.md) (not yet created)

## Children

- [auth-backend service](../../services/auth-backend/auth-backend.archi.md) (planned)
- [auth app](../../apps/auth/auth.archi.md) (not yet created)

## Overview

The OAuth system enables users to connect third-party providers (Google, GitHub, etc.) to the Massivoto platform. It uses the **Authorization Code flow with PKCE** for security, with the backend handling token exchange and storage. The frontend initiates the flow and receives completion notifications via URL hash redirect.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OAuth System Components                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     @massivoto/auth-domain                          │   │
│  │                     (Shared Domain Logic)                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  providers.ts   │  oauth.ts    │  tokens.ts   │  storage.ts        │   │
│  │  - ProviderKind │  - PKCE      │  - Token     │  - TokenSaver      │   │
│  │  - Provider     │  - State     │    types     │  - TokenLoader     │   │
│  │  - OAuthConfig  │  - URL build │  - Status    │  - TokenStore      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│              ┌───────────────┴───────────────┐                             │
│              ▼                               ▼                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │     apps/auth       │         │  services/auth-     │                   │
│  │    (Frontend)       │         │     backend         │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ - Initiates OAuth   │         │ - Receives callback │                   │
│  │ - Generates PKCE    │         │ - Exchanges code    │                   │
│  │ - Stores state      │         │ - Saves tokens      │                   │
│  │ - Handles redirect  │         │ - Redirects to FE   │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

The complete OAuth Authorization Code + PKCE flow:

```
┌────────┐      ┌────────┐      ┌──────────┐      ┌─────────┐      ┌────────┐
│  User  │      │Frontend│      │ Provider │      │ Backend │      │   DB   │
└───┬────┘      └───┬────┘      └────┬─────┘      └────┬────┘      └───┬────┘
    │               │                │                 │               │
    │ 1. Click      │                │                 │               │
    │   "Connect"   │                │                 │               │
    ├──────────────►│                │                 │               │
    │               │                │                 │               │
    │               │ 2. Generate:   │                 │               │
    │               │    - state     │                 │               │
    │               │    - verifier  │                 │               │
    │               │    - challenge │                 │               │
    │               ├──┐             │                 │               │
    │               │  │ Store in    │                 │               │
    │               │◄─┘ sessionStorage               │               │
    │               │                │                 │               │
    │ 3. Redirect   │                │                 │               │
    │◄──────────────┤                │                 │               │
    │               │                │                 │               │
    │ 4. Auth at provider            │                 │               │
    ├───────────────────────────────►│                 │               │
    │                                │                 │               │
    │ 5. Approve scopes              │                 │               │
    ├───────────────────────────────►│                 │               │
    │                                │                 │               │
    │                                │ 6. Redirect     │               │
    │                                │    with code    │               │
    │                                ├────────────────►│               │
    │                                │                 │               │
    │                                │                 │ 7. Exchange   │
    │                                │                 │    code for   │
    │                                │                 │    tokens     │
    │                                │                 ├──────────────►│
    │                                │◄────────────────┤               │
    │                                │  tokens         │               │
    │                                │                 │               │
    │                                │                 │ 8. Save       │
    │                                │                 │    tokens     │
    │                                │                 ├──────────────►│
    │                                │                 │               │
    │               │ 9. Redirect with hash            │               │
    │               │◄─────────────────────────────────┤               │
    │               │  #provider=x&status=success      │               │
    │               │                │                 │               │
    │               │ 10. Parse hash │                 │               │
    │               │     Show toast │                 │               │
    │               │     Refresh UI │                 │               │
    │               ├──┐             │                 │               │
    │               │  │             │                 │               │
    │               │◄─┘             │                 │               │
    │               │                │                 │               │
    │ 11. Success!  │                │                 │               │
    │◄──────────────┤                │                 │               │
    │               │                │                 │               │
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `ProviderKind` | auth-domain/providers.ts | Enum: OAUTH2_PKCE, API_KEY, etc. |
| `OAuthProviderConfig` | auth-domain/providers.ts | Backend config for a provider |
| `OAuthState` | auth-domain/oauth.ts | State stored during OAuth flow |
| `generateCodeVerifier()` | auth-domain/oauth.ts | PKCE verifier (random string) |
| `generateCodeChallenge()` | auth-domain/oauth.ts | PKCE challenge (SHA-256 hash) |
| `buildAuthorizeUrl()` | auth-domain/oauth.ts | Constructs provider auth URL |
| `parseOAuthHash()` | auth-domain/oauth.ts | Parses success redirect hash |
| `buildOAuthRedirectHash()` | auth-domain/oauth.ts | Backend builds redirect hash |
| `IntegrationToken` | auth-domain/tokens.ts | Stored token with metadata |
| `TokenStore` | auth-domain/storage.ts | Interface for token persistence |

## Interfaces

### OAuthState (Frontend stores before redirect)

```typescript
interface OAuthState {
  state: string          // Random string for CSRF protection
  codeVerifier: string   // PKCE verifier (kept secret)
  redirectUri: string    // Where provider redirects after auth
  providerId: string     // Which provider (google, github, etc.)
  createdAt: number      // Timestamp for expiry check
}
```

### OAuthProviderConfig (Backend configuration)

```typescript
interface OAuthProviderConfig {
  id: string
  displayName: string
  authorizeUrl: string      // Provider's auth endpoint
  tokenUrl: string          // Provider's token endpoint
  scopes: string[]          // Default scopes to request
  clientId: string          // Public client ID
  clientSecret?: string     // Secret (backend only!)
  redirectUri: string       // Backend callback URL
  usePKCE: boolean          // Whether to use PKCE
  extraAuthParams?: Record<string, string>
  extraTokenParams?: Record<string, string>
}
```

### IntegrationToken (Stored after successful OAuth)

```typescript
interface IntegrationToken {
  integrationId: string
  kind: ProviderKind
  accessToken?: TokenSecret
  refreshToken?: TokenSecret | null
  idToken?: TokenSecret | null
  expiresAt: string | null
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  revoked: boolean
}
```

## Frontend-Backend Sync Mechanism

After the backend saves the token, it notifies the frontend by redirecting with a hash:

```
Backend redirects to:
  https://app.massivoto.com/dashboard#provider=google&status=success

Frontend:
  1. parseOAuthHash(window.location.hash)
  2. If status=success: show toast, refresh provider list
  3. If error: show error message
  4. Clear hash from URL
```

The `buildOAuthRedirectHash()` function generates this hash:

```typescript
// Backend uses this after saving token
const hash = buildOAuthRedirectHash({
  provider: 'google',
  accessToken: '...',  // Optional: for display only
  expiresIn: 3600,
  scope: 'email profile'
})
// Returns: #provider=google&access_token=...&expires_in=3600&scope=email+profile
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. State Mismatch (CSRF attempt)                              │
│     Backend: Reject, redirect with #error=state_mismatch       │
│     Frontend: Show "Security error, please try again"          │
│                                                                 │
│  2. Token Exchange Failed                                       │
│     Backend: Log error, redirect with #error=token_exchange    │
│     Frontend: Show "Connection failed, please try again"       │
│                                                                 │
│  3. User Denied Access                                          │
│     Provider redirects with ?error=access_denied               │
│     Backend: Redirect with #error=access_denied                │
│     Frontend: Show "You denied access to {provider}"           │
│                                                                 │
│  4. State Expired (user took too long)                         │
│     Backend: Reject if state > 10 minutes old                  │
│     Frontend: Show "Session expired, please try again"         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **PKCE Required**: Always use PKCE for public clients (SPA)
2. **State Validation**: Backend must verify state matches
3. **Short State TTL**: States expire after 10 minutes
4. **No Secrets in Frontend**: client_secret stays in backend only
5. **Token Storage**: Tokens stored server-side, not in browser
6. **HTTPS Only**: All OAuth redirects must use HTTPS

## Dependencies

- **Depends on:** zod (schema validation)
- **Used by:** apps/auth (frontend), services/auth-backend (planned)

## What's Missing (Implementation Status)

| Component | Status |
|-----------|--------|
| auth-domain types | Done |
| auth-domain PKCE | Done |
| auth-domain URL builders | Done |
| Frontend OAuth initiation | Needs refactor (currently implicit flow) |
| Backend callback handler | Not started |
| Backend token exchange | Not started |
| Database token storage | Not started |
