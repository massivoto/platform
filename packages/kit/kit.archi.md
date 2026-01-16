# Architecture: Kit (Shared Utilities)

**Last updated:** 2026-01-14

## Parent

- [Platform Root](../../root.archi.md)

## Children

- None

## Overview

The Kit package (`@massivoto/kit`) is a collection of shared utilities used across the Massivoto monorepo. It provides common functionality including error handling, network utilities, testing helpers, and time/timestamp operations. The package is published as an ESM module with TypeScript types and is a dependency of both the runtime and other packages.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      @massivoto/kit (packages/kit)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                          src/index.ts                                 │ │
│  │                     (Single entry point)                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│       ┌────────────────┬───────────┼───────────┬────────────────┐          │
│       │                │           │           │                │          │
│       ▼                ▼           ▼           ▼                ▼          │
│  ┌─────────┐    ┌─────────┐  ┌─────────┐  ┌─────────┐    ┌───────────┐    │
│  │ errors/ │    │network/ │  │testing/ │  │  time/  │    │  caching/ │    │
│  └────┬────┘    └────┬────┘  └────┬────┘  └────┬────┘    └─────┬─────┘    │
│       │              │            │            │                │          │
│       ▼              ▼            ▼            ▼                ▼          │
│  ┌─────────┐    ┌─────────┐  ┌─────────┐  ┌─────────┐    ┌───────────┐    │
│  │error-to-│    │cuid-    │  │skip-    │  │timestamp│    │localStorage│   │
│  │string   │    │validator│  │describe │  │  utils  │    │  adapters  │   │
│  │         │    │         │  │         │  │         │    │            │   │
│  │assertions│   │get-proxy│  │         │  │         │    │            │   │
│  │         │    │         │  │         │  │         │    │            │   │
│  │         │    │serialize│  │         │  │         │    │            │   │
│  └─────────┘    └─────────┘  └─────────┘  └─────────┘    └───────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `errors/` | src/errors/ | Error conversion, assertions |
| `network/` | src/network/ | CUID validation, proxy utilities, serialization |
| `testing/` | src/testing/ | Test utilities like `skipDescribe` |
| `time/` | src/time/ | Timestamp utilities: `nowTs()`, `toReadableDate()` |
| `caching/` | src/caching/ | localStorage adapters for Node and browser |

## Module Exports

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PUBLIC API                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  errors/                                                                │
│  ├── errorToString(err: unknown): string                               │
│  └── assertDefined<T>(value: T): asserts value is Exclude<T, undef>    │
│                                                                         │
│  network/                                                               │
│  ├── isCuid(id: string): boolean                                       │
│  ├── getProxy(): string | undefined                                    │
│  └── isSerializable(value: unknown): boolean                           │
│                                                                         │
│  testing/                                                               │
│  └── skipDescribe(name: string, fn: () => void): void                  │
│                                                                         │
│  time/                                                                  │
│  ├── nowTs(): number                                                   │
│  └── toReadableDate(ts: number): string                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## LocalStorage Adapters

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LOCALSTORAGE ADAPTERS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │             ILocalStorage (Interface)                             │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  getItem(key: string): string | null                              │ │
│  │  setItem(key: string, value: string): void                        │ │
│  │  removeItem(key: string): void                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│              │                                │                         │
│              ▼                                ▼                         │
│  ┌───────────────────────┐      ┌───────────────────────┐             │
│  │  SimpleLocalStorage   │      │   NodeLocalStorage    │             │
│  │  (Browser window.*)   │      │ (Map-based for tests) │             │
│  └───────────────────────┘      └───────────────────────┘             │
│              │                                │                         │
│              └────────────────┬───────────────┘                         │
│                               ▼                                         │
│                  ┌───────────────────────┐                              │
│                  │   SafeLocalStorage    │                              │
│                  │ (SSR-safe with guards)│                              │
│                  └───────────────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:** None (zero external dependencies)
- **Used by:**
  - @massivoto/runtime (timestamp utilities)
  - apps/auth (localStorage adapters)
  - services/auth-backend (indirectly via auth-domain)
