# Architecture: Registry (Common Registry Interface)

**Last updated:** 2026-01-20

## Parent

- [Kit Package](../../../kit.archi.md)

## Children

- None

## Overview

The Registry module provides a composable registry pattern for loading items from multiple bundles. It is the foundation for `CommandRegistry`, `ProviderRegistry`, and `AppletRegistry` in the runtime package. The design emphasizes testability through explicit lifecycle management, conflict detection for duplicate keys, and bundle provenance tracking.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    @massivoto/kit/registry                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      RegistryItem (Base Interface)                    │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  id: string           // "@utils/log", "github"                       │ │
│  │  type: string         // "command", "provider", "applet"              │ │
│  │  init(): Promise      // Setup after loading                          │ │
│  │  dispose(): Promise   // Cleanup before unloading                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                              │
│                              │ extends                                      │
│         ┌────────────────────┼────────────────────┐                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│  │ CommandHdlr │      │ProviderDrvr │      │AppletDefn   │                │
│  │  (runtime)  │      │  (runtime)  │      │  (runtime)  │                │
│  └─────────────┘      └─────────────┘      └─────────────┘                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      Registry<V> (Interface)                          │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  get(key) → RegistryEntry<V> | undefined                              │ │
│  │  has(key) → boolean                                                   │ │
│  │  keys() → string[]                                                    │ │
│  │  entries() → Map<string, RegistryEntry<V>>                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                              │
│                              │ extends                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  ComposableRegistry<V> (Interface)                    │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  addBundle(source: RegistryBundle<V>): void                           │ │
│  │  reload(): Promise<void>                                              │ │
│  │  getBundles(): RegistryBundle<V>[]                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                              │
│                              │ implements                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  BaseComposableRegistry<V> (Class)                    │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  - Composes multiple RegistryBundle<V>                                │ │
│  │  - Detects conflicts (same key in multiple bundles)                   │ │
│  │  - Manages lifecycle (init/dispose)                                   │ │
│  │  - Tracks bundle provenance                                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `RegistryItem` | types.ts | Base interface for all registry items (id, type, init, dispose) |
| `Registry<V>` | types.ts | Readonly async lookup interface |
| `ComposableRegistry<V>` | types.ts | Mutable interface with bundle composition |
| `RegistryBundle<V>` | types.ts | Interface for loadable bundles |
| `RegistryEntry<V>` | types.ts | Lookup result with value and bundleId |
| `BaseComposableRegistry<V>` | base-composable-registry.ts | Implementation with conflict detection and lifecycle |
| `ModuleBundle<V>` | module-bundle.ts | Bundle that loads from JS modules via dynamic import |
| `ModuleAdapter<V>` | module-bundle.ts | Function type: converts module exports to Map<string, V> |
| `ModuleBundleConfig<V>` | module-bundle.ts | Config interface: id, modulePath, adapter |
| `RegistryConflictError` | errors.ts | Thrown when same key exists in multiple bundles |
| `RegistryConflict` | errors.ts | Type describing a single key conflict (key + bundleIds) |
| `RegistryNotLoadedError` | errors.ts | Thrown when accessing registry before reload() |
| `ModuleLoadError` | errors.ts | Thrown when module import fails (includes cause) |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGISTRY RELOAD FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  addBundle(source1)                                                         │
│  addBundle(source2)                                                         │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────┐                                                           │
│  │  reload()   │                                                           │
│  └──────┬──────┘                                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. dispose() on existing items (cleanup old)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  2. source.load() for each source                                   │   │
│  │     ┌─────────────┐    ┌─────────────┐                              │   │
│  │     │  source1    │    │  source2    │                              │   │
│  │     │ Map<k,v>    │    │ Map<k,v>    │                              │   │
│  │     └─────────────┘    └─────────────┘                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  3. Detect conflicts (same key in multiple bundles)                 │   │
│  │     → throws RegistryConflictError if found                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  4. init() on all new items (setup new)                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  5. Cache ready → get(), has(), keys() now work                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Source Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE SOURCE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ModuleBundle<V>                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  id: "core"                                                         │   │
│  │  modulePath: "./handlers.js"                                        │   │
│  │  adapter: (exports) => Map<string, V>                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  load():                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. const module = await import(modulePath)                         │   │
│  │  2. const entries = adapter(module)                                 │   │
│  │  3. return entries  // Map<string, V>                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Interfaces

### RegistryItem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RegistryItem                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  readonly id: string                                                     │
│  readonly type: string                                                   │
│  init(): Promise<void>                                                   │
│  dispose(): Promise<void>                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### RegistryEntry<V>

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RegistryEntry<V>                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  key: string                                                             │
│  value: V                                                                │
│  bundleId: string                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### RegistryBundle<V>

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RegistryBundle<V>                                │
├─────────────────────────────────────────────────────────────────────────┤
│  readonly id: string                                                     │
│  load(): Promise<Map<string, V>>                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Error Handling

| Error | When Thrown | Resolution |
|-------|-------------|------------|
| `RegistryNotLoadedError` | Accessing registry before `reload()` | Call `await registry.reload()` first |
| `RegistryConflictError` | Same key in multiple bundles | Use namespaced keys or remove duplicate |
| `ModuleLoadError` | Module import fails | Check module path and exports |

## Dependencies

- **Depends on:** None (zero external dependencies)
- **Used by:**
  - `@massivoto/runtime` CommandRegistry
  - `@massivoto/runtime` ProviderRegistry (planned)
  - `@massivoto/runtime` AppletRegistry (planned)
