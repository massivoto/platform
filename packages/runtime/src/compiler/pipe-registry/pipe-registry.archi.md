# Architecture: Pipe Registry

**Last updated:** 2026-01-22

## Parent

- [Runtime](../../../runtime.archi.md)

## Children

- None

## Overview

The Pipe Registry provides data transformation functions (pipes) for expression evaluation. Pipes are chained in expressions like `{users | filter:active | map:name | join:', '}`. Following the established registry pattern from `@massivoto/kit`, it wraps `BaseComposableRegistry<PipeFunction>` and provides `CorePipesBundle` with 9 built-in pipes.

## Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PIPE REGISTRY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PipeRegistry                            │  │
│  │         wraps BaseComposableRegistry<PipeFunction>         │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  addBundle(bundle)  → register pipe bundle                 │  │
│  │  reload()           → load bundles, detect conflicts       │  │
│  │  get(pipeId)        → RegistryEntry<PipeFunction>          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   CorePipesBundle                          │  │
│  │                     bundleId: 'core'                       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  filter  │ array + [propName] → filtered array            │  │
│  │  map     │ array + [propName] → property values           │  │
│  │  first   │ array → first element                          │  │
│  │  last    │ array → last element                           │  │
│  │  join    │ array + [separator?] → string                  │  │
│  │  length  │ array/string/object → count                    │  │
│  │  flatten │ nested array → flat array                      │  │
│  │  reverse │ array → reversed copy                          │  │
│  │  unique  │ array → deduplicated array                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Responsibility |
|-----------|----------------|
| `PipeFunction` | Interface extending `RegistryItem` with `execute(input, args)` |
| `BasePipeFunction` | Abstract class with default `init()`/`dispose()` |
| `PipeRegistry` | Registry wrapper with `addBundle`, `reload`, `get` |
| `CorePipesBundle` | Built-in pipes: filter, map, first, last, join, length, flatten, reverse, unique |
| `PipeError` | Base error with `pipeId` |
| `PipeArgumentError` | Error for invalid arguments |
| `PipeTypeError` | Error for input type mismatch |

## Data Flow

```
Expression: {users | filter:active | map:name}

┌────────────┐    ┌────────────┐    ┌────────────┐
│   users    │───►│   filter   │───►│    map     │───► ['Emma','Bob']
│  (array)   │    │  :active   │    │   :name    │
└────────────┘    └────────────┘    └────────────┘
                       │                  │
                       ▼                  ▼
              execute(input,       execute(input,
                ['active'])          ['name'])
```

## Dependencies

- **Depends on:** `@massivoto/kit` (BaseComposableRegistry, RegistryItem, RegistryBundle)
- **Used by:** pipe-evaluator (evaluator integration, separate PRD)
