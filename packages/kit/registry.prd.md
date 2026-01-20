# PRD: Common Registry Interface

**Status:** IMPLEMENTED **Last updated:** 2026-01-20

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section                           | Status          | Progress |
| --------------------------------- | --------------- | -------- |
| Context                           | Complete        | -        |
| Scope                             | Complete        | -        |
| Requirements: Core Interfaces     | Complete        | 7/7      |
| Requirements: Base Implementation | Complete        | 7/7      |
| Requirements: Module Source       | Complete        | 4/4      |
| Requirements: Error Handling      | Complete        | 3/3      |
| Acceptance Criteria               | Complete        | 9/9      |
| Theme                             | Defined         | -        |
| **Overall**                       | **IMPLEMENTED** | **100%** |

## Parent PRD

- [Platform Root](../../root.archi.md)

## Child PRDs

- None

## Context

Three registries in the Massivoto platform share the same extension pattern:
`CommandRegistry`, `ProviderRegistry`, and `AppletRegistry`. Each needs to:

1. Compose entries from multiple sources (core built-ins, npm modules, remote
   APIs)
2. Detect conflicts when the same key appears in multiple sources
3. Support async loading for remote resources
4. Be fully testable with fixture modules

Rather than duplicate this logic three times, we extract a **Common Registry
Interface** into `@massivoto/kit`. This provides reusable interfaces and a base
implementation that runtime can extend for each specific registry type.

## Decision Log

| Date       | Option                                         | Decision                       | Rationale                                                                   |
| ---------- | ---------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| 2026-01-19 | Override: silent vs namespace vs error         | **Conflict error**             | Same namespace/name from different sources is a bug, must fail fast         |
| 2026-01-19 | Key type: string vs generic                    | **String**                     | Matches ActionNode path format (`@package/name`)                            |
| 2026-01-19 | Get semantics: sync vs async                   | **Async**                      | Resources may be remote, need Promise                                       |
| 2026-01-19 | Reload: explicit vs lazy                       | **Explicit with error**        | Must call `reload()` before `get()`, easier to test                         |
| 2026-01-19 | Watch/hot reload                               | **Deferred**                   | Not needed for v0.5, add later                                              |
| 2026-01-19 | Test utilities: InMemorySource vs ModuleSource | **ModuleSource with fixtures** | Tests should mirror production; use real JS fixture files                   |
| 2026-01-19 | Reload behavior: idempotent vs one-shot        | **Idempotent**                 | Can call `reload()` multiple times; re-fetches all sources each time        |
| 2026-01-19 | Source provenance: track or not                | **Track provenance**           | `get()` returns `{ value, sourceId }` for debugging                         |
| 2026-01-19 | Common item interface                          | **RegistryItem base**          | All items implement `id`, `type`, `init()`, `dispose()` for testability     |
| 2026-01-19 | Item type field                                | **String**                     | Future-proof for client extensions, kit doesn't control enum                |
| 2026-01-19 | Lifecycle methods                              | **Required**                   | `init()` and `dispose()` are mandatory, not optional                        |
| 2026-01-20 | Discriminator naming                           | **`type` not `kind`**          | More natural English, consistent with AST node `type` discriminator pattern |

## Scope

**In scope:**

- `Registry<V>` readonly interface
- `ComposableRegistry<V>` mutable interface with source composition
- `RegistrySource<V>` interface for loadable sources
- `BaseComposableRegistry<V>` class with conflict detection
- `ModuleSource<V>` for loading entries from JS modules
- `RegistryConflictError` and `RegistryNotLoadedError`
- Test fixtures as real JS modules

**Out of scope:**

- Hot reload / watch functionality (deferred)
- `RemoteSource` / `HttpRegistrySource` implementation (consumers provide)
- Specific registry implementations (CommandRegistry stays in runtime)

## Requirements

### Core Interfaces

**Last updated:** 2026-01-20 **Test:**
`npx vitest run packages/kit/src/registry` **Progress:** 7/7 (100%)

- [x] R-REG-01: Define `Registry<V>` interface with async methods:
      `get(key: string): Promise<RegistryEntry<V> | undefined>`,
      `has(key: string): Promise<boolean>`, `keys(): Promise<string[]>`,
      `entries(): Promise<Map<string, RegistryEntry<V>>>`
- [x] R-REG-02: Define `ComposableRegistry<V>` interface extending `Registry<V>`
      with: `addSource(source: RegistrySource<V>): void`,
      `reload(): Promise<void>`, `getSources(): RegistrySource<V>[]`
- [x] R-REG-03: Define `RegistrySource<V>` interface with: `id: string`,
      `load(): Promise<Map<string, V>>`
- [x] R-REG-04: Define `RegistryEntry<V>` type with: `key: string`, `value: V`,
      `sourceId: string`
- [x] R-REG-05: Define `RegistryItem` base interface with: `id: string`
      (readonly), `type: string` (readonly), `init(): Promise<void>`,
      `dispose(): Promise<void>`
- [x] R-REG-06: Registry generic constraint:
      `Registry<V extends RegistryItem>` - all registry items must implement
      `RegistryItem`
- [x] R-REG-07: Export all interfaces from `@massivoto/kit` main entry point

### Base Implementation

**Last updated:** 2026-01-20 **Test:**
`npx vitest run packages/kit/src/registry/base-composable-registry.spec.ts`
**Progress:** 7/7 (100%)

- [x] R-REG-21: Implement `BaseComposableRegistry<V>` class that implements
      `ComposableRegistry<V>`
- [x] R-REG-22: `reload()` must load all sources and detect conflicts: if same
      key exists in multiple sources, throw `RegistryConflictError`
- [x] R-REG-23: `get()`, `has()`, `keys()`, `entries()` must throw
      `RegistryNotLoadedError` if `reload()` was never called
- [x] R-REG-24: After successful `reload()`, `get(key)` returns
      `RegistryEntry<V>` with `value` and `sourceId` indicating which source
      provided it
- [x] R-REG-25: `reload()` is idempotent: calling it multiple times re-fetches
      all sources and rebuilds the cache
- [x] R-REG-26: On `reload()`, call `dispose()` on all existing items before
      loading new ones
- [x] R-REG-27: On `reload()`, call `init()` on all newly loaded items after
      successful load (before returning)

### Module Source

**Last updated:** 2026-01-20 **Test:**
`npx vitest run packages/kit/src/registry/module-source.spec.ts` **Progress:**
4/4 (100%)

- [x] R-REG-41: Implement `ModuleSource<V>` class implementing
      `RegistrySource<V>`
- [x] R-REG-42: `ModuleSource` constructor accepts `id: string`,
      `modulePath: string`, and `adapter: (exports: unknown) => Map<string, V>`
- [x] R-REG-43: `load()` performs dynamic `import(modulePath)` and passes
      exports to the adapter function
- [x] R-REG-44: If module import fails or adapter throws, `load()` rejects with
      a descriptive error including the module path

### Error Handling

**Last updated:** 2026-01-20 **Test:**
`npx vitest run packages/kit/src/registry/errors.spec.ts` **Progress:** 3/3
(100%)

- [x] R-REG-61: Implement `RegistryConflictError` with properties:
      `conflicts: Array<{ key: string, sourceIds: string[] }>`, human-readable
      `message`
- [x] R-REG-62: Implement `RegistryNotLoadedError` with `message` explaining
      that `reload()` must be called first
- [x] R-REG-63: Error messages must be LLM-readable: include the conflicting
      keys, source IDs, and suggested fix

## Registry Item Contract

All items stored in a registry must implement `RegistryItem`. This provides a
common structure for metadata, lifecycle, and testability.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGISTRY ITEM INTERFACE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  interface RegistryItem {                                                   │
│    readonly id: string      // Unique identifier: "@utils/log", "github"   │
│    readonly type: string    // Item type: "command", "provider", "applet"  │
│                                                                             │
│    init(): Promise<void>    // Called once after loading (setup)           │
│    dispose(): Promise<void> // Called before unloading (cleanup)           │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Runtime extends this for specific types:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RUNTIME-SPECIFIC INTERFACES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // In @massivoto/runtime                                                   │
│                                                                             │
│  interface CommandHandler extends RegistryItem {                            │
│    type: 'command'                                                          │
│    run(args: Args, context: Context): Promise<ActionResult>                 │
│  }                                                                          │
│                                                                             │
│  interface ProviderDriver extends RegistryItem {                            │
│    type: 'provider'                                                         │
│    config: ProviderConfig                                                   │
│    buildAuthorizeUrl(opts: AuthOpts): string                                │
│    exchangeCode(opts: ExchangeOpts): Promise<TokenResponse>                 │
│  }                                                                          │
│                                                                             │
│  interface AppletDefinition extends RegistryItem {                          │
│    type: 'applet'                                                           │
│    start(config: AppletConfig): AppletInstance                              │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why `type` is a string (not enum):**

- Future-proof: clients can define custom types (e.g., `"validator"`,
  `"transformer"`)
- Kit doesn't need to know about runtime-specific types
- Type narrowing works via TypeScript discriminated unions in runtime

## Module Contract

Sources load JavaScript modules and convert exports to registry entries using an
**adapter function**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE SOURCE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ModuleSource<V>                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  id: "vinyl-classics"                                               │   │
│  │  modulePath: "./fixtures/vinyl-classics.js"                         │   │
│  │  adapter: (exports) => new Map(exports.albums.map(...))             │   │
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

**Example fixture module (with executable method):**

```typescript
// fixtures/vinyl-classics.ts
import { RegistryItem } from '@massivoto/kit'

interface Album extends RegistryItem {
  type: 'album'
  title: string
  year: number
  play(): Promise<{ status: 'playing'; track: string }>
}

let isInitialized = false

const abbeyRoad: Album = {
  id: '@classics/abbey-road',
  type: 'album',
  title: 'Abbey Road',
  year: 1969,
  init: async () => {
    isInitialized = true
  },
  dispose: async () => {
    isInitialized = false
  },
  play: async () => {
    if (!isInitialized) throw new Error('Album not initialized')
    return { status: 'playing', track: 'Come Together' }
  },
}

const letItBe: Album = {
  id: '@classics/let-it-be',
  type: 'album',
  title: 'Let It Be',
  year: 1970,
  init: async () => {},
  dispose: async () => {},
  play: async () => ({ status: 'playing', track: 'Let It Be' }),
}

export const albums = [
  { key: abbeyRoad.id, value: abbeyRoad },
  { key: letItBe.id, value: letItBe },
]
```

**Example adapter:**

```typescript
const adapter = (exports: { albums: Array<{ key: string; value: Album }> }) =>
  new Map(exports.albums.map(({ key, value }) => [key, value]))
```

This keeps `ModuleSource` generic while allowing each registry to define its own
module format.

**Lifecycle behavior:**

- `init()` is called on each item after `reload()` completes successfully
- `dispose()` is called on each item before a subsequent `reload()` (to clean up
  old items)
- For testing, fixtures can use no-op implementations: `init: async () => {}`

## Dependencies

- **Depends on:** None (kit has zero external dependencies)
- **Blocks:**
  - `@massivoto/runtime` CommandRegistry refactor
  - `@massivoto/runtime` ProviderRegistry implementation
  - `@massivoto/runtime` AppletRegistry implementation

## Open Questions

- [x] Override behavior? → Conflict error
- [x] Key type? → Strings
- [x] Sync vs async get? → Async
- [x] Explicit vs lazy reload? → Explicit with error
- [x] Test utilities? → ModuleSource with fixture files
- [x] Should `reload()` be idempotent (can call multiple times) or one-shot? →
      Idempotent
- [x] Should we track which source provided each entry for debugging? → Yes,
      `get()` returns `RegistryEntry<V>` with `sourceId`

## Acceptance Criteria

### Theme

> **Theme:** Record Store
>
> A vinyl record store with multiple suppliers. The store inventory (registry)
> combines records from different distributors (sources). Two distributors
> cannot ship the same album (conflict).
>
> New theme for this feature.

### Criteria

**Lookup & Conflict:**

- [x] AC-REG-01: Given distributor "Vinyl Classics" module provides album
      "@classics/abbey-road", when the store loads inventory, then
      "@classics/abbey-road" is available for lookup
- [x] AC-REG-02: Given distributor modules "Vinyl Classics" and "Retro Beats"
      both provide album "@shared/abbey-road", when the store loads inventory,
      then a conflict error lists both distributors
- [x] AC-REG-03: Given the store has not loaded inventory yet, when clerk Emma
      searches for "@classics/abbey-road", then she receives an error explaining
      inventory must be loaded first
- [x] AC-REG-04: Given distributor module "Local Indie" provides albums
      "@indie/blue-train" and "@indie/kind-of-blue", when the store loads
      inventory, then both albums are available
- [x] AC-REG-05: Given an empty store with no distributors, when the store loads
      inventory, then the inventory is empty but no error occurs

**Lifecycle & Execution:**

- [x] AC-REG-06: Given album "@classics/abbey-road" has `init()` that sets up
      playback, when the store loads inventory, then `init()` is called and the
      album can be played successfully
- [x] AC-REG-07: Given album "@classics/abbey-road" requires initialization
      before `play()`, when clerk Emma retrieves the album after `reload()`,
      then `play()` returns `{ status: 'playing', track: 'Come Together' }`
- [x] AC-REG-08: Given the store has loaded inventory and then calls `reload()`
      again, then `dispose()` is called on all existing albums before loading
      new ones

**General:**

- [x] AC-REG-09: All automated tests pass (47 tests passing)

## File Structure

```
packages/kit/src/registry/
├── index.ts                           # Public exports
├── types.ts                           # Registry<V>, ComposableRegistry<V>, RegistrySource<V>
├── base-composable-registry.ts        # BaseComposableRegistry<V> implementation
├── base-composable-registry.spec.ts   # Main test scenarios (uses fixtures)
├── base-composable-registry.edge.spec.ts  # Edge cases
├── module-source.ts                   # ModuleSource<V> implementation
├── module-source.spec.ts              # ModuleSource tests
├── errors.ts                          # RegistryConflictError, RegistryNotLoadedError
├── errors.spec.ts                     # Error tests
└── fixtures/                          # Test fixture modules
    ├── types.ts                       # Album interface extending RegistryItem with play()
    ├── vinyl-classics.ts              # Distributor with 2 playable albums (init required)
    ├── retro-beats.ts                 # Distributor with overlapping album (for conflict test)
    ├── local-indie.ts                 # Distributor with unique albums
    └── empty-distributor.ts           # Empty module (edge case)
```
