# Architecture: Auth Frontend

**Last updated:** 2026-01-14

## Parent

- [Platform Root](../../root.archi.md)

## Children

- None

## Overview

The Auth Frontend is a React single-page application that provides user interface for OAuth integrations. Built with Vite, React 18, and TailwindCSS, it allows users to connect their accounts to third-party providers (Google, GitHub, etc.) through a visual dashboard. The app uses React Query for data fetching, Radix UI primitives for accessible components, and Sonner for toast notifications.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTH FRONTEND (apps/auth)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          App.tsx (Root)                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  QueryClientProvider  │  TooltipProvider  │  Sonner (Toasts)        │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     app-router.tsx (Routes)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  /           → Landing                                               │   │
│  │  /dashboard  → Dashboard (shows integrations)                        │   │
│  │  /providers/:id/connect  → ProviderConnectPage                       │   │
│  │  /providers/:id/settings → ProviderSettingsPage                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐     │
│  │     Hooks         │   │    Components     │   │     Layouts       │     │
│  ├───────────────────┤   ├───────────────────┤   ├───────────────────┤     │
│  │ useIntegrations   │   │ ProviderCard      │   │ RootLayout        │     │
│  │ useOAuthStorage   │   │ TokenStateBadge   │   │ ErrorBoundary     │     │
│  │ use-toast         │   │ ScopePicker       │   │ NotFound          │     │
│  └───────────────────┘   │ ConnectOAuthBtn   │   └───────────────────┘     │
│           │              └───────────────────┘                              │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    @massivoto/auth-domain                            │   │
│  │              (parseOAuthHash, Provider types, PKCE)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `App.tsx` | src/App.tsx | Root component with providers (Query, Tooltip, Toast) |
| `useIntegrations` | src/hooks/useIntegrations.ts | Hook for OAuth: connect, disconnect, refresh, hash parsing |
| `Dashboard` | src/routes/dashboard/Dashboard.tsx | Main view showing all provider integrations |
| `ProviderCard` | src/components/ProviderCard.tsx | Card displaying a single provider's connection status |
| `TokenStateBadge` | src/components/TokenStateBadge.tsx | Badge showing connected/expired/revoked state |
| `ConnectOAuthButton` | src/components/integration/ | Button that initiates OAuth flow |

## Data Flow

```
┌─────────────┐    1. Click     ┌─────────────────┐
│    User     │    "Connect"    │ ConnectOAuthBtn │
└──────┬──────┘                 └────────┬────────┘
       │                                 │
       │                                 │ 2. connect(providerId)
       │                                 ▼
       │                        ┌─────────────────┐
       │                        │ useIntegrations │
       │                        └────────┬────────┘
       │                                 │
       │                                 │ 3. window.location = backend/oauth/start
       │                                 ▼
       │                        ┌─────────────────┐
       │                        │  auth-backend   │
       │                        └────────┬────────┘
       │                                 │
       │                                 │ 4. OAuth provider → callback → redirect
       │                                 ▼
       │  5. Page loads with    ┌─────────────────┐
       │     #provider=x&status │    Dashboard    │
       │                        └────────┬────────┘
       │                                 │
       │                                 │ 6. useEffect: parseOAuthHash()
       │                                 ▼
       │                        ┌─────────────────┐
       │                        │  toast.success  │
       │                        │    refresh()    │
       │                        └────────┬────────┘
       │                                 │
       ◄─────────────────────────────────┘ 7. UI updated
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Framework | React 18, Vite 5 |
| Styling | TailwindCSS 4, Radix UI primitives |
| State | React Query, useState hooks |
| Routing | React Router 6 |
| Forms | React Hook Form, Zod validation |
| Testing | Vitest, Testing Library, axe-core (a11y) |
| Docs | Storybook 10 |

## UI Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT LIBRARY                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │   src/components/ui/   (Radix + shadcn/ui primitives)               │
│  ├─────────────────┤                                                    │
│  │ button, card, dialog, dropdown-menu, toast, tooltip, etc.           │
│  │ (40+ reusable primitives from shadcn/ui)                            │
│  └─────────────────┘                                                    │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │   src/components/      (Custom business components)                 │
│  ├─────────────────┤                                                    │
│  │ ProviderCard        - Provider connection card                      │
│  │ TokenStateBadge     - Status indicator (connected/expired/revoked)  │
│  │ ScopePicker         - OAuth scope selection                         │
│  │ ConnectOAuthButton  - Initiates OAuth flow                          │
│  │ ConnectApiKeyButton - API key connection form                       │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:** @massivoto/auth-domain (OAuth types, hash parsing)
- **Used by:** End users via browser
- **Backend:** services/auth-backend (OAuth API)
