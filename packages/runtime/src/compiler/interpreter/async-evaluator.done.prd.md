# PRD: Async Expression Evaluator

**Status:** IMPLEMENTED **Last updated:** 2026-01-22

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section                     | Status          | Progress |
| --------------------------- | --------------- | -------- |
| Context                     | Complete        | -        |
| Scope                       | Complete        | -        |
| Requirements: Core Async    | Complete        | 4/4      |
| Requirements: Store Access  | Complete        | 4/4      |
| Requirements: StoreProvider | Complete        | 3/3      |
| Requirements: Migration     | Complete        | 3/3      |
| Acceptance Criteria         | Complete        | 8/8      |
| Theme                       | Defined         | -        |
| **Overall**                 | **IMPLEMENTED** | **100%** |

## Parent PRD

- [evaluator.prd.md](./evaluator.prd.md) - Expression Evaluator (sync,
  IMPLEMENTED)
- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Async evaluator

## Child PRDs

- None

## Context

The current `ExpressionEvaluator.evaluate()` is synchronous. This blocks
integration with async data sources like databases, remote APIs, or cloud
storage. The ROADMAP identifies this as a requirement for v0.5: "evaluate() must
be async to support store.x lookups (store is async)".

The store represents persistent data that commands read/write during execution.
Future stores (PostgreSQL, S3, Redis) require async I/O. Making the evaluator
async now enables these integrations without breaking changes later.

## Decision Log

| Date       | Option                 | Decision                 | Rationale                                                          |
| ---------- | ---------------------- | ------------------------ | ------------------------------------------------------------------ |
| 2026-01-21 | All async vs selective | **All async (Option C)** | Uniform API, future-proof, minimal overhead with Promise.resolve() |
| 2026-01-21 | Store access syntax    | **store.customers**      | Explicit like scope.x, no magic resolution                         |
| 2026-01-21 | Resolution priority    | **scope -> data only**   | Store requires explicit store.x, no implicit lookup                |
| 2026-01-21 | Store caching          | **No caching**           | Each store.x triggers fresh read, simplicity over optimization     |

## Scope

**In scope:**

- Convert `evaluate()` to return `Promise<any>`
- Add `store.x` member expression handling (like `scope.x`)
- Convert `StoreProvider.get()` to async
- Update all callers to await evaluate()
- Maintain backward compatibility for all existing tests

**Out of scope:**

- Store write operations (`store.x = value`) - handled by commands
- Computed store access (`store[dynamic]`) - not needed for v0.5
- Store result caching - simplicity first
- Implicit store resolution (bare `customers` won't check store)

## Requirements

### Core Async

**Last updated:** 2026-01-22 **Test:**
`npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-ASYNC-01: `evaluate()` returns `Promise<any>` for all expression types
- [x] R-ASYNC-02: Literal evaluation resolves immediately (no unnecessary async
      overhead)
- [x] R-ASYNC-03: All existing evaluator tests pass with async/await
- [x] R-ASYNC-04: Nested expressions await inner results before computing outer

### Store Access

**Last updated:** 2026-01-22 **Test:**
`npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-STORE-21: `store.customers` resolves via
      `StoreProvider.get("customers")`
- [x] R-STORE-22: `store.nested.path` resolves via
      `StoreProvider.get("nested.path")`
- [x] R-STORE-23: Missing store key returns `undefined` (no throw)
- [x] R-STORE-24: Store access works in complex expressions: `store.count > 5`

### StoreProvider Interface

**Last updated:** 2026-01-22 **Test:**
`npx vitest run packages/runtime/src/runner/local-file-store.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-PROVIDER-41: `StoreProvider.get()` returns `Promise<any>`
- [x] R-PROVIDER-42: `LocalFileStore` implements async get (can use fs.promises)
- [x] R-PROVIDER-43: ExecutionContext includes optional `store?: StoreProvider`

### Migration

**Last updated:** 2026-01-22 **Test:** `npx vitest run packages/runtime`
**Progress:** 3/3 (100%)

- [x] R-MIGRATE-61: All interpreter code awaits evaluate() calls
- [x] R-MIGRATE-62: All command handlers await expression evaluation
- [x] R-MIGRATE-63: Test helpers updated for async evaluation

## Dependencies

- **Depends on:**
  - evaluator.prd.md (IMPLEMENTED) - current sync evaluator
  - StoreProvider interface (exists)
- **Blocks:**
  - Local Runner (needs async evaluation for store access)
  - Database stores (PostgreSQL, Redis)

## Open Questions

- [x] All async or selective? -> All async (Option C)
- [x] Store syntax? -> `store.customers` (explicit)
- [x] Resolution priority? -> scope -> data only, store explicit
- [x] Cache store lookups? -> No, fresh read each time
- [ ] Error handling for store failures? (network error, permission denied)

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [evaluator.prd.md](./evaluator.prd.md)

### Criteria

**Async Basics:**

- [x] AC-ASYNC-01: Given expression `42`, when evaluated, then
      `await evaluate()` returns `42`
- [x] AC-ASYNC-02: Given expression `user.name` with context
      `{ user: { name: "Emma" } }`, when evaluated, then `await evaluate()`
      returns `"Emma"`

**Store Access:**

- [x] AC-ASYNC-03: Given store with `{ followers: 1500 }`, when evaluating
      `store.followers`, then result is `1500`
- [x] AC-ASYNC-04: Given store with `{ user: { name: "Carlos" } }`, when
      evaluating `store.user.name`, then result is `"Carlos"`
- [x] AC-ASYNC-05: Given empty store, when evaluating `store.missing`, then
      result is `undefined`

**Complex Expressions:**

- [x] AC-ASYNC-06: Given store `{ count: 10 }` and context `{ limit: 5 }`, when
      evaluating `store.count > limit`, then result is `true`
- [x] AC-ASYNC-07: Given store `{ price: 10 }` and context `{ qty: 3 }`, when
      evaluating `store.price * qty`, then result is `30`

**General:**

- [x] AC-ASYNC-08: All existing evaluator tests (112) pass with async conversion

## Implementation Notes

### Signature Change

```typescript
// Before
evaluate(expr: ExpressionNode, context: ExecutionContext): any

// After
evaluate(expr: ExpressionNode, context: ExecutionContext): Promise<any>
```

### Store Member Handling

Similar to existing `scope.x` handling:

```typescript
// In evaluateMember()
if (expr.object.type === 'identifier' && expr.object.value === 'store') {
  const path = expr.path.join('.')
  return context.store?.get(path) ?? Promise.resolve(undefined)
}
```

### StoreProvider Change

```typescript
// Before
export interface StoreProvider {
  get(path: string): any
  // ...
}

// After
export interface StoreProvider {
  get(path: string): Promise<any>
  // ...
}
```

### LocalFileStore Change

```typescript
// Use fs.promises instead of sync
import { readFile } from 'fs/promises'

async get(path: string): Promise<any> {
  const raw = JSON.parse(await readFile(this.filePath, 'utf8'))
  return lodashGet(raw, path)
}
```
