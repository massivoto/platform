# Architecture: Kit (Shared Utilities)

**Last updated:** 2026-01-21

## Parent

- [Platform Root](../../root.archi.md)

## Children

- [Registry](./src/registry/registry.archi.md)
- [Applets](./src/applets/applet.archi.md)

## Overview

The Kit package (`@massivoto/kit`) is a collection of contracts between pieces of the platform, as well as the shared utilities used
across the Massivoto monorepo, or error management.

The package is published as an ESM module with TypeScript types and is the core dependency of all packages.

## Contracts

- runtime:
  - Interpreter: how to execute a oto program, given as a string
  - Result: output of an execution of a oto program or a single action
  - ScopeChain: the scope needed for program execution
  - ExecutionContext: the extended context representing all data accessible for the evaluation, including database, secrets, action output, etc.
  - CommandHandler: a javascript function that executes an action
- applets:
  - AppletDefinition: an applet is a program spawned by an oto action. For exemple a website waiting for a human validation of AI generation.
  - Docker: a suite of utilities to create and manage docker containers for applets 
- registries:
  - Registry: a shared interface for all kind of registries 
  - CommandRegistry: list of CommandHandlers, aka the list of available actions for an oto program
  - AppletRegistry: list of applets that can spawn from an oto program
- stores
  - StoreProvider: a function that allows an oto program to connect to a datasource, mostly postgres, MongoDB or vectorized database for RAG applications.


The contracts for authentication, including ProviderRegistry, are inside packages/auth-domain, so that they can evolve more freely.

Good to know about authentication: 
    * ServiceProvider: a service requiring an authentication (e.g. Gmail, Github, etc.)
    * ProviderRegistry: list of service providers requiring an authentication (e.g. Gmail, Github, etc.)

## Diagram

TODO: create a diagram with contracts and their related dependencies


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

Example of implementation of a Registry with the CommandRegistry

```typescript
export class CoreCommandRegistry
    extends BaseComposableRegistry<CommandHandler>
    implements CommandRegistry {}
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
