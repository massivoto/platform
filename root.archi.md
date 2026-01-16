# Architecture: Massivoto Platform

**Last updated:** 2026-01-14

## Parent

- (none - this is the root)

## Children

- [apps/auth](./apps/auth/auth.archi.md)
- [packages/auth-domain](./packages/auth-domain/auth-domain.archi.md)
- [packages/kit](./packages/kit/kit.archi.md)
- [packages/runtime](./packages/runtime/runtime.archi.md)
- [services/auth-backend](./services/auth-backend/auth-backend.archi.md)

## Overview

Massivoto Platform is a monorepo for the Massivoto Automation Programming Language (APL). It provides an execution runtime for DSL-based automation workflows, along with authentication infrastructure (OAuth/PKCE) shared between a React frontend and Express backend. The platform uses Yarn workspaces, strict TypeScript, and ESM modules throughout.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MASSIVOTO PLATFORM                                 │
│                    Automation Programming Language                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│       apps/         │   │     packages/       │   │     services/       │
│   (Frontend Apps)   │   │  (Shared Libraries) │   │  (Backend Services) │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
           │                         │                         │
           ▼                         │                         ▼
┌─────────────────────┐              │              ┌─────────────────────┐
│       auth          │              │              │    auth-backend     │
│   React + Vite UI   │              │              │  Express OAuth API  │
│   (Storybook, a11y) │              │              └─────────────────────┘
└─────────────────────┘              │                         ▲
           │                         │                         │
           │       ┌─────────────────┼─────────────────┐       │
           │       │                 │                 │       │
           ▼       ▼                 ▼                 ▼       │
    ┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
    │   auth-domain   │   │         kit         │   │     runtime     │
    │  OAuth, Tokens  │   │      Utilities      │   │  APL Execution  │
    │      PKCE       │   │      Logging        │   │   Interpreter   │
    └─────────────────┘   └─────────────────────┘   └─────────────────┘
```

## Key Components

| Component | Responsibility |
|-----------|----------------|
| apps/auth | React + Vite frontend for OAuth integrations, with Storybook and mock data layer |
| packages/auth-domain | Shared OAuth utilities: PKCE, token validation, provider types |
| packages/kit | Common utilities, logging, and error handling |
| packages/runtime | APL execution: interpreter, command registry, expression evaluation |
| services/auth-backend | Express API for OAuth code exchange and secure token storage |

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    OAuth Code    ┌─────────────────┐    Token Exchange    ┌───────────────┐
│  auth (UI)  │─────────────────►│  auth-backend   │────────────────────►│ OAuth Provider │
│   React     │                  │     Express     │                      │ (Google, etc)  │
└─────────────┘                  └─────────────────┘                      └───────────────┘
       │                                │
       │                                │
       ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         @massivoto/auth-domain                           │
│              (PKCE generation, token validation, types)                  │
└─────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                         AUTOMATION EXECUTION                              │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐   Parse    ┌─────────────────┐   Execute   ┌─────────────────┐
│   DSL Source    │───────────►│   Task (AST)    │────────────►│ ExecutionContext │
│  (@commands)    │            │  (Instructions) │             │     (State)      │
└─────────────────┘            └─────────────────┘             └─────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │   @massivoto/runtime    │
                          │      Interpreter        │
                          │   CommandRegistry       │
                          │   Expression Eval       │
                          └─────────────────────────┘
```

## Dependency Graph

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          INTERNAL DEPENDENCIES                             │
└───────────────────────────────────────────────────────────────────────────┘

    ┌───────────┐         ┌─────────────────┐
    │   auth    │────────►│   auth-domain   │◄────────┌───────────────┐
    │  (React)  │         │   (OAuth/PKCE)  │         │ auth-backend  │
    └───────────┘         └─────────────────┘         │  (Express)    │
                                                      └───────────────┘

    ┌───────────┐
    │  runtime  │────────►┌───────────┐
    │  (APL)    │         │    kit    │
    └───────────┘         │(Utilities)│
                          └───────────┘
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Build | Yarn workspaces, TypeScript (strict), ESM |
| Frontend | React 18, Vite, TailwindCSS, Radix UI, Storybook 10 |
| Backend | Node.js, Express 5, cookie-parser |
| Testing | Vitest, Testing Library, axe-core (a11y) |
| Validation | Zod |

## Commands

```bash
yarn install          # Install all dependencies
yarn build            # Build all packages (tsc --build)
yarn test             # Run all tests across workspaces
yarn dev              # Start all dev servers
yarn clean            # Remove dist folders and node_modules
yarn clean:claude     # Remove Claude temp files
yarn type-check       # TypeScript type checking
```

## Dependencies

- **Depends on:** (external) Google OAuth, Auth0
- **Used by:** (consumers of the platform)
