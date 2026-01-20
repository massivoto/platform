# PRD: Variable Resolution & Scope

**Status:** APPROVED
**Last updated:** 2026-01-20

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: ExecutionContext Changes | Not Started | 0/4 |
| Requirements: Variable Resolution | Not Started | 0/5 |
| Requirements: Output Targeting | Not Started | 0/4 |
| Requirements: Scope Lifecycle | Not Started | 0/4 |
| Requirements: Evaluator Changes | Not Started | 0/3 |
| Requirements: Nested Scope Chain | Not Started | 0/4 |
| Acceptance Criteria | Not Started | 0/16 |
| Theme | Defined | - |
| **Overall** | **APPROVED** | **0%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Variable Resolution & Scope

## Child PRDs

- None

## Context

The current evaluator and interpreter work with a flat `context.data` namespace. All variables exist in one map, which causes problems:

1. **No scoping**: Variables declared inside blocks leak out
2. **forEach collision**: Iterator variables would overwrite each other in nested loops
3. **No shadowing**: Cannot have a local variable shadow an outer one

The ROADMAP defines three variable levels:

| Level | Source | Lifetime | Example |
|-------|--------|----------|---------|
| **scope** | `output=scope.x`, forEach iterator | Within block | Deleted when block exits |
| **data** | `output=x` (default) | Across program | Deleted at program end |
| **store** | `output=store.x` | Persistent | Survives across executions |

**Resolution rule:** `scope` wins on collision with `data`.

**v0.5 scope:** Only `scope` and `data` are implemented. `store` is deferred.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Scope implementation | **Scope chain (Option A)** | JS-like semantics, clean model |
| 2026-01-20 | Default output target | **data** | `output=x` writes to `context.data.x` |
| 2026-01-20 | Store implementation | **Deferred** | Not needed for v0.5 |
| 2026-01-20 | Block scope creation | **forEach only** | Conditional blocks do NOT create scope per access-rules.md |

## Scope

**In scope:**
- Add `scope` property to `ExecutionContext`
- Variable resolution: check `scope` first, then `data`
- Output targeting: `output=x` → data, `output=scope.x` → scope
- Scope lifecycle: forEach creates child scope, block does not
- Evaluator changes: resolve identifiers through scope chain
- Interpreter changes: handle output target parsing

**Out of scope:**
- `store` namespace (deferred to later)
- `env`, `user`, `meta`, `cost` write access (read-only, by design)

## Requirements

### ExecutionContext Changes

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/domain/execution-context.spec.ts`
**Progress:** 0/4 (0%)

- [ ] R-SCOPE-01: Add `scopeChain: ScopeChain` to `ExecutionContext` interface
- [ ] R-SCOPE-02: `createEmptyExecutionContext()` initializes `scopeChain` to `{ current: {} }`
- [ ] R-SCOPE-03: `cloneExecutionContext()` deep-clones `scopeChain` (preserves parent chain)
- [ ] R-SCOPE-04: `fromPartialContext()` handles optional `scopeChain` property

### Variable Resolution

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 0/5 (0%)

- [ ] R-SCOPE-21: Bare identifier `user` resolves via scope chain first, then `context.data.user`
- [ ] R-SCOPE-22: Scope chain lookup walks from current to root, returns first match
- [ ] R-SCOPE-23: Explicit `scope.user` resolves via scope chain only (not data)
- [ ] R-SCOPE-24: Explicit `data.user` always resolves to `context.data.data.user` (no special meaning)
- [ ] R-SCOPE-25: Member expression `user.name` uses same resolution for root (`user`)

### Output Targeting

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/interpreter.spec.ts`
**Progress:** 0/4 (0%)

- [ ] R-SCOPE-41: `output=user` writes to `context.data.user`
- [ ] R-SCOPE-42: `output=scope.user` writes to `context.scopeChain.current.user`
- [ ] R-SCOPE-43: `output=data.user` writes to `context.data.data.user` (no special casing)
- [ ] R-SCOPE-44: Parse output target to determine namespace (`scope.` prefix detection)

### Scope Lifecycle

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/scope-lifecycle.spec.ts`
**Progress:** 0/4 (0%)

- [ ] R-SCOPE-61: Conditional block (`@start/block if=...`) does NOT create new scope
- [ ] R-SCOPE-62: forEach block creates child scope for iterator variable
- [ ] R-SCOPE-63: Child scope is cleared/popped when forEach iteration ends
- [ ] R-SCOPE-64: Scope variables do not leak to parent after block exit

### Evaluator Changes

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 0/3 (0%)

- [ ] R-SCOPE-81: `ExpressionEvaluator.evaluate()` uses new resolution logic
- [ ] R-SCOPE-82: `IdentifierNode` resolution: walk scope chain, then data
- [ ] R-SCOPE-83: `MemberExpressionNode` resolution: apply scope chain logic to root object

### Nested Scope Chain

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/scope-chain.spec.ts`
**Progress:** 0/4 (0%)

- [ ] R-SCOPE-101: Create `ScopeChain` type with `current: Record<string, any>` and `parent?: ScopeChain`
- [ ] R-SCOPE-102: `pushScope()` creates child scope with current as parent
- [ ] R-SCOPE-103: `popScope()` returns to parent scope (discards current)
- [ ] R-SCOPE-104: `lookup(name)` walks chain from current to root, returns first match

## Dependencies

- **Depends on:**
  - Evaluator (IMPLEMENTED) - needs modification
  - Interpreter (IMPLEMENTED) - needs modification
  - Parser (IMPLEMENTED) - no changes needed

- **Blocks:**
  - forEach implementation (needs scope for iterator binding)
  - Nested blocks (needs scope cleanup on exit)

## Open Questions

- [x] Default output target? → `data`
- [x] Conditional blocks create scope? → No, per access-rules.md
- [x] forEach creates scope? → Yes, for iterator variable
- [x] Should `env.X` be writable? → No, read-only by design
- [x] Nested scope chains? → Yes, needed for nested forEach

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](../../parser/dsl-0.5-parser.prd.md)

### Criteria

**Variable Resolution:**
- [ ] AC-SCOPE-01: Given `context.data.user = "Emma"` and empty scope, when evaluating `user`, then result is `"Emma"`
- [ ] AC-SCOPE-02: Given `context.data.user = "Emma"` and `context.scope.user = "Carlos"`, when evaluating `user`, then result is `"Carlos"` (scope wins)
- [ ] AC-SCOPE-03: Given `context.scope.user = "Carlos"`, when evaluating `scope.user`, then result is `"Carlos"`
- [ ] AC-SCOPE-04: Given `context.data.data = { user: "Emma" }`, when evaluating `data.user`, then result is `"Emma"` (no special meaning)

**Output Targeting:**
- [ ] AC-SCOPE-05: Given instruction `@api/call output=user`, when executed with result `{ name: "Emma" }`, then `context.data.user` equals `{ name: "Emma" }`
- [ ] AC-SCOPE-06: Given instruction `@api/call output=scope.user`, when executed with result `{ name: "Carlos" }`, then `context.scope.user` equals `{ name: "Carlos" }`
- [ ] AC-SCOPE-07: Given instruction `@api/call output=data.user`, when executed, then `context.data.data.user` is set (no special casing)

**Scope Lifecycle:**
- [ ] AC-SCOPE-08: Given conditional block `@start/block if=true` with `@utils/set key="x" value="inside"`, when block exits, then `context.data.x` equals `"inside"` (no scope created)
- [ ] AC-SCOPE-09: Given forEach with `item="tweet"`, when iteration runs, then `context.scope.tweet` is set to current item
- [ ] AC-SCOPE-10: Given forEach that set `scope.tweet`, when forEach completes, then `context.scope.tweet` is cleared

**Member Expressions:**
- [ ] AC-SCOPE-11: Given `context.scope.user = { name: "Carlos", followers: 5000 }`, when evaluating `user.followers`, then result is `5000` (scope resolution for root)

**Nested Scope Chain:**
- [ ] AC-SCOPE-12: Given outer forEach with `item="user"` and inner forEach with `item="tweet"`, when inner runs, then both `user` and `tweet` are resolvable
- [ ] AC-SCOPE-13: Given nested forEach where inner shadows `item="user"`, when inner runs, then inner `user` wins; when inner exits, outer `user` is restored
- [ ] AC-SCOPE-14: Given 3-level nesting (user -> tweet -> reply), when innermost runs, then all three variables are resolvable via chain walk
- [ ] AC-SCOPE-15: Given forEach that set `scope.x` in child scope, when forEach exits and scope pops, then `scope.x` is no longer resolvable

**General:**
- [ ] AC-SCOPE-16: All automated tests pass

## Implementation Notes

### Current ExecutionContext

```typescript
export interface ExecutionContext {
  env: Record<string, string>
  data: SerializableObject     // <-- currently all variables here
  extra: any
  meta: { ... }
  user: { ... }
  store: SerializableStorePointer
  prompts: string[]
  cost: { ... }
}
```

### Target ExecutionContext

```typescript
export interface ExecutionContext {
  env: Record<string, string>      // READ-ONLY
  data: SerializableObject         // program-wide variables
  scopeChain: ScopeChain           // <-- NEW: nested block-local variables
  extra: any
  meta: { ... }                    // READ-ONLY
  user: { ... }                    // READ-ONLY
  store: SerializableStorePointer
  prompts: string[]
  cost: { ... }                    // READ-ONLY
}

interface ScopeChain {
  current: Record<string, any>
  parent?: ScopeChain
}
```

### Resolution Logic

```typescript
// In ExpressionEvaluator
function resolveIdentifier(name: string, context: ExecutionContext): any {
  // Check if explicit namespace prefix
  if (name.startsWith('scope.')) {
    return lookup(name.slice(6), context.scopeChain)
  }
  if (name.startsWith('env.')) {
    return get(context.env, name.slice(4))  // READ-ONLY
  }
  // Add other read-only namespaces: user., meta., cost.

  // Default: scope chain wins on collision, then data
  const scopeValue = lookup(name, context.scopeChain)
  if (scopeValue !== undefined) {
    return scopeValue
  }
  return context.data[name]
}
```

### Output Target Parsing

```typescript
// In Interpreter
function parseOutputTarget(output: string): { namespace: 'data' | 'scope', key: string } {
  if (output.startsWith('scope.')) {
    return { namespace: 'scope', key: output.slice(6) }
  }
  // Default to data (not scope!)
  return { namespace: 'data', key: output }
}

function writeOutput(target: { namespace: 'data' | 'scope', key: string }, value: any, context: ExecutionContext): void {
  if (target.namespace === 'scope') {
    context.scopeChain.current[target.key] = value
  } else {
    set(context.data, target.key, value)
  }
}
```

### Scope Chain Operations

```typescript
interface ScopeChain {
  current: Record<string, any>
  parent?: ScopeChain
}

function createEmptyScopeChain(): ScopeChain {
  return { current: {} }
}

function pushScope(chain: ScopeChain): ScopeChain {
  return { current: {}, parent: chain }
}

function popScope(chain: ScopeChain): ScopeChain {
  if (!chain.parent) throw new Error('Cannot pop root scope')
  return chain.parent
}

function lookup(name: string, chain: ScopeChain): any {
  if (name in chain.current) return chain.current[name]
  if (chain.parent) return lookup(name, chain.parent)
  return undefined
}

function write(name: string, value: any, chain: ScopeChain): void {
  // Always write to current scope (no walking up)
  chain.current[name] = value
}
```

### Example: Nested forEach

```dsl
@utils/set key="users" value=[{name: "Emma", tweets: [1,2]}, {name: "Carlos", tweets: [3]}]

@start/forEach item="user" of=users           # push scope, set scope.user
  @start/forEach item="tweet" of=user.tweets  # push scope, set scope.tweet
    @utils/log message=user.name              # walks chain: tweet scope -> user scope
    @utils/log message=tweet                  # found in current scope
  @end/forEach                                # pop scope (tweet gone)
  @utils/log message=user.name                # still works (user scope)
@end/forEach                                  # pop scope (user gone)
```
