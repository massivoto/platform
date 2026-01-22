# PRD: Applet Registry and Definitions

**Status:** DRAFT
**Last updated:** 2026-01-22
**Target Version:** 0.5
**Location:** `packages/kit/src/applets/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Types Migration | ❌ Not Started | 0/3 |
| AppletRegistry | ❌ Not Started | 0/4 |
| CoreAppletsBundle | ❌ Not Started | 0/4 |
| Runtime Integration | ❌ Not Started | 0/2 |
| Acceptance Criteria | ❌ Not Started | 0/6 |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [Kit Package](../../kit.archi.md)

## Child PRDs

- [LocalAppletLauncher](../../../runtime/src/applets/local/local-applet-launcher.prd.md) (in runtime)

## Context

The applet system needs shared types that can be used by multiple runtimes (LocalRuntime, CloudRuntime, ContainerRuntime). Currently, `AppletDefinition` and `AppletRegistry` interface live in `@massivoto/runtime`, but they should be in `@massivoto/kit` to:

1. Follow the established pattern (CommandRegistry is in kit)
2. Allow CloudRuntime and other runtimes to share the same definitions
3. Have AppletDefinition extend RegistryItem for consistency
4. Keep runtime-specific implementations (LocalAppletLauncher) in runtime

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-22 | kit vs runtime for types | **kit selected** | Enables reuse by CloudRuntime, follows CommandRegistry pattern |
| 2026-01-22 | Generation applet model selection | **Optional with default** | `model?: string` in input, falls back to runtime config. Flexible for different providers/budgets. |

## Scope

**In scope:**
- Move `AppletDefinition` to kit, extend `RegistryItem`
- Implement `AppletRegistry` class wrapping `BaseComposableRegistry`
- Create `CoreAppletsBundle` with definitions for confirm, grid, generation
- Update runtime to import from kit

**Out of scope:**
- Actual applet packages (confirm, grid, generation) - separate PRDs
- LocalAppletLauncher changes (already done, just needs import update)
- CloudAppletLauncher (v1.0)
- @human/validation command integration

## Requirements

### Types Migration

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/kit/src/applets/`
**Progress:** 0/3 (0%)

- ❌ R-APP-01: Define `AppletDefinition` interface extending `RegistryItem` with `inputSchema`, `outputSchema`, `packageName?`, `timeoutMs?`
- ❌ R-APP-02: Export `AppletDefinition` from `@massivoto/kit`
- ❌ R-APP-03: Update `@massivoto/runtime` to import `AppletDefinition` from kit (remove local definition)

### AppletRegistry

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/kit/src/applets/applet-registry.spec.ts`
**Progress:** 0/4 (0%)

- ❌ R-APP-21: Implement `AppletRegistry` class wrapping `BaseComposableRegistry<AppletDefinition>`
- ❌ R-APP-22: Implement `addBundle(bundle)` to register applet bundles
- ❌ R-APP-23: Implement `reload()` to load all bundles with conflict detection
- ❌ R-APP-24: Implement `get(appletId)` returning `RegistryEntry<AppletDefinition> | undefined`

### CoreAppletsBundle

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/kit/src/applets/core-applets-bundle.spec.ts`
**Progress:** 0/4 (0%)

- ❌ R-APP-41: Implement `CoreAppletsBundle` as `RegistryBundle<AppletDefinition>`
- ❌ R-APP-42: Define `confirm` applet: inputSchema `{ message: string, title?: string }`, outputSchema `{ approved: boolean }`
- ❌ R-APP-43: Define `grid` applet: inputSchema `{ items: array, labelKey?: string }`, outputSchema `{ selected: string[] }`
- ❌ R-APP-44: Define `generation` applet: inputSchema `{ items: array, prompt?: string, model?: string }`, outputSchema `{ results: { id: string, text: string }[] }`. Model defaults to runtime configuration if not provided.

### Runtime Integration

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/runtime/src/applets/`
**Progress:** 0/2 (0%)

- ❌ R-APP-61: Update `LocalAppletLauncher` to import `AppletDefinition` from `@massivoto/kit`
- ❌ R-APP-62: Remove duplicate `AppletDefinition` and `AppletRegistry` interface from runtime (keep only launcher interfaces)

## Implementation

### AppletDefinition (extends RegistryItem)

```typescript
// packages/kit/src/applets/types.ts
import type { ZodSchema } from 'zod'
import type { RegistryItem } from '../registry/types.js'

export interface AppletDefinition extends RegistryItem {
  /** Always "applet" */
  readonly type: 'applet'

  /** Zod schema for validating input data */
  readonly inputSchema: ZodSchema

  /** Zod schema for validating response data */
  readonly outputSchema: ZodSchema

  /** npm package name, defaults to @massivoto/applet-{id} */
  readonly packageName?: string

  /** Per-applet timeout in ms, falls back to launcher default */
  readonly timeoutMs?: number
}
```

### AppletRegistry

```typescript
// packages/kit/src/applets/applet-registry.ts
import { BaseComposableRegistry, RegistryBundle, RegistryEntry } from '../registry/index.js'
import type { AppletDefinition } from './types.js'

export class AppletRegistry {
  private readonly inner: BaseComposableRegistry<AppletDefinition>

  constructor() {
    this.inner = new BaseComposableRegistry<AppletDefinition>()
  }

  addBundle(bundle: RegistryBundle<AppletDefinition>): void {
    this.inner.addBundle(bundle)
  }

  async reload(): Promise<void> {
    await this.inner.reload()
  }

  async get(appletId: string): Promise<RegistryEntry<AppletDefinition> | undefined> {
    return this.inner.get(appletId)
  }

  async has(appletId: string): Promise<boolean> {
    return this.inner.has(appletId)
  }

  async keys(): Promise<string[]> {
    return this.inner.keys()
  }
}
```

### CoreAppletsBundle

```typescript
// packages/kit/src/applets/core-applets-bundle.ts
import { z } from 'zod'
import type { RegistryBundle } from '../registry/types.js'
import type { AppletDefinition } from './types.js'

function createAppletDefinition(
  id: string,
  inputSchema: z.ZodSchema,
  outputSchema: z.ZodSchema,
  options?: { packageName?: string; timeoutMs?: number }
): AppletDefinition {
  return {
    id,
    type: 'applet',
    inputSchema,
    outputSchema,
    packageName: options?.packageName,
    timeoutMs: options?.timeoutMs,
    init: async () => {},
    dispose: async () => {},
  }
}

export class CoreAppletsBundle implements RegistryBundle<AppletDefinition> {
  readonly id = 'core'

  async load(): Promise<Map<string, AppletDefinition>> {
    const map = new Map<string, AppletDefinition>()

    // Confirm applet
    map.set('confirm', createAppletDefinition(
      'confirm',
      z.object({ message: z.string(), title: z.string().optional() }),
      z.object({ approved: z.boolean() })
    ))

    // Grid applet
    map.set('grid', createAppletDefinition(
      'grid',
      z.object({ items: z.array(z.unknown()), labelKey: z.string().optional() }),
      z.object({ selected: z.array(z.string()) })
    ))

    // Generation applet
    map.set('generation', createAppletDefinition(
      'generation',
      z.object({ items: z.array(z.unknown()), prompt: z.string().optional() }),
      z.object({ results: z.array(z.object({ id: z.string(), text: z.string() })) })
    ))

    return map
  }
}
```

## File Structure

```
packages/kit/src/applets/
├── applet.archi.md           # Architecture (exists)
├── applet.prd.md             # This PRD
├── types.ts                  # AppletDefinition extends RegistryItem
├── types.spec.ts             # Type validation tests
├── applet-registry.ts        # AppletRegistry class
├── applet-registry.spec.ts   # Registry tests
├── core-applets-bundle.ts    # Built-in applet definitions
├── core-applets-bundle.spec.ts
└── index.ts                  # Re-exports

packages/runtime/src/applets/
├── types.ts                  # UPDATED: Only AppletLauncher, AppletInstance, AppletTerminator
│                             # Import AppletDefinition from @massivoto/kit
├── errors.ts                 # No changes
└── local/                    # No changes (import update only)
```

## Dependencies

- **Depends on:**
  - `@massivoto/kit/registry` (BaseComposableRegistry, RegistryItem, RegistryBundle)
  - `zod` (schema validation)

- **Blocks:**
  - Actual applet packages (confirm, grid, generation)
  - @human/validation command handler

## Open Questions

- [x] ~~Should AppletDefinition extend RegistryItem?~~ **Yes**, for consistency with CommandHandler pattern.
- [ ] Should CoreAppletsBundle define full Zod schemas or just placeholders? **Decision needed during implementation.**

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [local-applet-launcher.prd.md](../../../runtime/src/applets/local/local-applet-launcher.prd.md)
>
> Test scenarios use content approval workflows where human reviewers validate
> AI-generated social media posts before publishing.

### Criteria

- [ ] AC-APP-01: Given Emma imports AppletDefinition from @massivoto/kit,
      when she creates a custom applet definition, then it correctly extends RegistryItem with id, type, init(), dispose()
- [ ] AC-APP-02: Given Carlos creates an AppletRegistry and adds CoreAppletsBundle,
      when he calls `registry.get("confirm")`, then it returns the confirm applet definition with correct schemas
- [ ] AC-APP-03: Given the CoreAppletsBundle is loaded,
      when listing all applets with `registry.keys()`, then it returns `["confirm", "grid", "generation"]`
- [ ] AC-APP-04: Given Emma validates input against the confirm applet schema,
      when she passes `{ message: "Approve this post?" }`, then validation succeeds
- [ ] AC-APP-05: Given Carlos validates input against the grid applet schema,
      when he passes `{ items: [{ id: "1", text: "Post A" }, { id: "2", text: "Post B" }] }`, then validation succeeds
- [ ] AC-APP-06: Given the runtime imports AppletDefinition from kit,
      when LocalAppletLauncher uses it, then all existing tests continue to pass
- [ ] All automated tests pass
- [ ] Edge cases covered in `*.edge.spec.ts` files
