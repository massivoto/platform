# Architecture: Registry (Common Registry Interface)

**Last updated:** 2026-01-19

## Parent

- [Kit Package](../../../kit.archi.md)

## Children

- None

## Overview

The Registry module provides a composable registry pattern for loading items from multiple sources. It is the foundation for `CommandRegistry`, `ProviderRegistry`, and `AppletRegistry` in the runtime package. The design emphasizes testability through explicit lifecycle management, conflict detection for duplicate keys, and source provenance tracking.

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
│  │  addSource(source: RegistrySource<V>): void                           │ │
│  │  reload(): Promise<void>                                              │ │
│  │  getSources(): RegistrySource<V>[]                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                              │
│                              │ implements                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  BaseComposableRegistry<V> (Class)                    │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  - Composes multiple RegistrySource<V>                                │ │
│  │  - Detects conflicts (same key in multiple sources)                   │ │
│  │  - Manages lifecycle (init/dispose)                                   │ │
│  │  - Tracks source provenance                                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `RegistryItem` | types.ts | Base interface for all registry items (id, kind, init, dispose) |
| `Registry<V>` | types.ts | Readonly async lookup interface |
| `ComposableRegistry<V>` | types.ts | Mutable interface with source composition |
| `RegistrySource<V>` | types.ts | Interface for loadable sources |
| `RegistryEntry<V>` | types.ts | Lookup result with value and sourceId |
| `BaseComposableRegistry<V>` | base-composable-registry.ts | Implementation with conflict detection and lifecycle |
| `ModuleSource<V>` | module-source.ts | Source that loads from JS modules via dynamic import |
| `RegistryConflictError` | errors.ts | Thrown when same key exists in multiple sources |
| `RegistryNotLoadedError` | errors.ts | Thrown when accessing registry before reload() |
| `ModuleLoadError` | errors.ts | Thrown when module import fails |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGISTRY RELOAD FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  addSource(source1)                                                         │
│  addSource(source2)                                                         │
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
│  │  3. Detect conflicts (same key in multiple sources)                 │   │
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
│  ModuleSource<V>                                                            │
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
│  sourceId: string                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### RegistrySource<V>

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RegistrySource<V>                                │
├─────────────────────────────────────────────────────────────────────────┤
│  readonly id: string                                                     │
│  load(): Promise<Map<string, V>>                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Error Handling

| Error | When Thrown | Resolution |
|-------|-------------|------------|
| `RegistryNotLoadedError` | Accessing registry before `reload()` | Call `await registry.reload()` first |
| `RegistryConflictError` | Same key in multiple sources | Use namespaced keys or remove duplicate |
| `ModuleLoadError` | Module import fails | Check module path and exports |

## Dependencies

- **Depends on:** None (zero external dependencies)
- **Used by:**
  - `@massivoto/runtime` CommandRegistry
  - `@massivoto/runtime` ProviderRegistry (planned)
  - `@massivoto/runtime` AppletRegistry (planned)
