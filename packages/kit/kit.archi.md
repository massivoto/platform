# Architecture: Kit (Shared Utilities)

**Last updated:** 2026-01-21

## Parent

- [Platform Root](../../root.archi.md)

## Children

- [Registry](./src/registry/registry.archi.md)
- [Applets](./src/applets/applet.archi.md)

## Overview

The Kit package (`@massivoto/kit`) is a collection of shared utilities used
across the Massivoto monorepo. It provides common functionality including error
handling, network utilities, testing helpers, time/timestamp operations, and a
composable registry pattern. The package is published as an ESM module with
TypeScript types and is a dependency of both the runtime and other packages.

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
│    ┌──────────┬──────────┬─────────┼─────────┬──────────┬──────────┐       │
│    │          │          │         │         │          │          │       │
│    ▼          ▼          ▼         ▼         ▼          ▼          ▼       │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────────┐ ┌────────┐  │
│ │errors/│ │network│ │testing│ │ time/ │ │caching│ │registry/│ │strings/│  │
│ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └────┬────┘ └───┬────┘  │
│     │         │         │         │         │          │          │        │
│     ▼         ▼         ▼         ▼         ▼          ▼          ▼        │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────────┐ ┌────────┐  │
│ │error- │ │cuid-  │ │skip-  │ │timest-│ │local- │ │Compos-  │ │base-64 │  │
│ │ToString│ │valid. │ │Descr. │ │amp    │ │Storage│ │ableReg- │ │obfusc. │  │
│ │assert │ │proxy  │ │       │ │       │ │Adapter│ │istry    │ │        │  │
│ │       │ │serial │ │       │ │       │ │       │ │ModuleBdl│ │        │  │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────────┘ └────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component   | Location      | Responsibility                                      |
| ----------- | ------------- | --------------------------------------------------- |
| `errors/`   | src/errors/   | Error conversion, assertions                        |
| `network/`  | src/network/  | CUID validation, proxy utilities, serialization     |
| `testing/`  | src/testing/  | Test utilities like `skipDescribe`                  |
| `time/`     | src/time/     | Timestamp utilities: `nowTs()`, `toReadableDate()`  |
| `caching/`  | src/caching/  | localStorage adapters for Node and browser          |
| `registry/` | src/registry/ | Composable registry pattern with conflict detection |
| `strings/`  | src/strings/  | Base64, obfuscation utilities                       |

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
│  registry/                                                              │
│  ├── RegistryItem (interface)                                          │
│  ├── Registry<V> (interface)                                           │
│  ├── ComposableRegistry<V> (interface)                                 │
│  ├── RegistryBundle<V> (interface)                                     │
│  ├── RegistryEntry<V> (type)                                           │
│  ├── BaseComposableRegistry<V> (class)                                 │
│  ├── ModuleBundle<V> (class)                                           │
│  ├── RegistryConflictError (class)                                     │
│  ├── RegistryNotLoadedError (class)                                    │
│  └── ModuleLoadError (class)                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Registry Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPOSABLE REGISTRY PATTERN                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      RegistryItem (Base)                          │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  id: string, type: string, init(), dispose()                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              ▲                                          │
│       ┌──────────────────────┼──────────────────────┐                  │
│       │                      │                      │                  │
│  ┌─────────┐           ┌─────────┐           ┌─────────┐              │
│  │Command  │           │Provider │           │Applet   │              │
│  │Handler  │           │Driver   │           │Defn     │              │
│  └─────────┘           └─────────┘           └─────────┘              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │              BaseComposableRegistry<V>                            │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  addBundle(bundle)   // Add JS module bundle                      │ │
│  │  reload()            // Load all, detect conflicts, init items    │ │
│  │  get(key)            // Returns { value, bundleId }               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                      │
│           │                  │                  │                      │
│           ▼                  ▼                  ▼                      │
│    ┌────────────┐    ┌────────────┐    ┌────────────┐                 │
│    │ModuleBundle│    │ModuleBundle│    │RemoteBundle│                 │
│    │  (core)    │    │ (@acme/*)  │    │  (future)  │                 │
│    └────────────┘    └────────────┘    └────────────┘                 │
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
  - @massivoto/runtime (timestamp utilities, registry pattern)
  - apps/auth (localStorage adapters)
  - services/auth-backend (indirectly via auth-domain)
