# PRD: ForEach Reserved Argument

**Status:** DRAFT
**Last updated:** 2026-01-20

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: AST Types | ❌ Not Started | 0/4 |
| Requirements: Parser Tokens | ❌ Not Started | 0/2 |
| Requirements: Reserved Arg Parser | ❌ Not Started | 0/4 |
| Requirements: Block Integration | ❌ Not Started | 0/3 |
| Requirements: Interpreter | ❌ Not Started | 0/5 |
| Acceptance Criteria | ❌ Not Started | 0/12 |
| Theme | ✅ Defined | - |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [Mapper Expression](./mapper.prd.md) (IMPLEMENTED)

## Child PRDs

- None

## Context

The `forEach` construct enables iteration over collections in OTO programs. Unlike traditional loop syntax (`for item in items`), OTO uses the mapper expression (`->`) combined with a reserved argument on blocks:

```oto
@block/begin forEach=users -> user
  @api/call endpoint={"/users/" + user.id} output=response
  @log/print message=response.status
@block/end
```

The mapper expression `users -> user` provides:
- **Left side** (`users`): The iterable collection (any expression)
- **Right side** (`user`): The iterator variable name (`SingleStringNode`)

This design:
1. **Reuses existing syntax** - mapper expression is already implemented
2. **Follows reserved arg pattern** - like `if=`, `output=`
3. **Integrates with blocks** - natural scoping via `@block/begin` / `@block/end`
4. **Enables scope isolation** - iterator variable lives in child scope per iteration

### Dependency on Variable Scope

ForEach **requires** the scope chain from [variable-scope.prd.md](../interpreter/variable-scope.prd.md):
- Each iteration creates a child scope
- Iterator variable (`user`) is written to `scopeChain.current`
- Child scope is popped after each iteration
- Nested forEach creates nested scope chain

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Syntax: `forEach="item of items"` vs `forEach=items -> item` | **Mapper syntax** | Reuses implemented mapper parser, consistent with expression grammar |
| 2026-01-20 | Location: instruction arg vs block arg | **Block arg** | forEach wraps multiple statements, block is natural container |
| 2026-01-20 | Index variable | **Optional `index=` arg** | Common need, clean syntax: `index=i` |
| 2026-01-20 | Empty collection | **Skip block** | `forEach=[] -> x` executes 0 iterations, no error |
| 2026-01-20 | Non-iterable | **Runtime error** | `forEach=42 -> x` throws "Cannot iterate over number" |

## Scope

**In scope:**
- `forEach=` reserved argument accepting mapper expression
- `index=` optional reserved argument for iteration index
- Update `BlockNode` with `forEach` and `index` fields
- Parser integration (token, grammar)
- Interpreter support (iteration, scope push/pop)
- Nested forEach support (via scope chain)

**Out of scope:**
- `break` / `continue` statements (future PRD)
- Parallel iteration (`forEach=a, b -> [x, y]`)
- Object iteration (`forEach=obj.entries() -> [key, value]`)
- Async iteration / streaming
- Old normalizer cleanup (separate task at end of v0.5)

## Requirements

### AST Types

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 0/4 (0%)

- ❌ R-FE-01: Add `ForEachArgNode` type to `ast.ts`:
  ```typescript
  interface ForEachArgNode {
    type: 'forEach-arg'
    iterable: ExpressionNode   // left side of mapper (users)
    iterator: SingleStringNode // right side of mapper (user)
  }
  ```

- ❌ R-FE-02: Add `IndexArgNode` type to `ast.ts`:
  ```typescript
  interface IndexArgNode {
    type: 'index-arg'
    variable: SingleStringNode // iteration index variable name
  }
  ```

- ❌ R-FE-03: Update `ReservedArgNode` union type:
  ```typescript
  type ReservedArgNode = OutputArgNode | IfArgNode | ForEachArgNode | IndexArgNode
  ```

- ❌ R-FE-04: Update `BlockNode` with forEach fields:
  ```typescript
  interface BlockNode {
    type: 'block'
    name?: string
    condition?: ExpressionNode  // from if=
    forEach?: ForEachArgNode    // NEW: from forEach=
    index?: IndexArgNode        // NEW: from index=
    body: StatementNode[]
  }
  ```

### Parser Tokens

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/reserved-args.spec.ts`
**Progress:** 0/2 (0%)

- ❌ R-FE-21: Add `FOREACH_KEY` token to `InstructionTokens`:
  ```typescript
  FOREACH_KEY: genlex.tokenize(C.string('forEach='), 'FOREACH_KEY', 500)
  ```

- ❌ R-FE-22: Add `INDEX_KEY` token to `InstructionTokens`:
  ```typescript
  INDEX_KEY: genlex.tokenize(C.string('index='), 'INDEX_KEY', 500)
  ```

### Reserved Arg Parser

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/reserved-args.spec.ts`
**Progress:** 0/4 (0%)

- ❌ R-FE-41: `forEachArg` parser: `FOREACH_KEY` followed by `mapperExpression`
  - Validates right side is mapper (has `->`)
  - Rejects non-mapper expressions: `forEach=users` fails with "forEach requires 'collection -> variable' syntax"

- ❌ R-FE-42: `indexArg` parser: `INDEX_KEY` followed by `singleString`
  - Only accepts simple variable name: `index=i`
  - Rejects expressions: `index=i+1` fails

- ❌ R-FE-43: Update `reservedArg` parser to include forEach and index:
  ```typescript
  const reservedArg = F.try(outputArg)
    .or(F.try(ifArg))
    .or(F.try(forEachArg))
    .or(indexArg)
  ```

- ❌ R-FE-44: Add `forEach` to reserved words in `shared-parser.ts`
  - Prevents `forEach` from being used as regular identifier

### Block Integration

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 0/3 (0%)

- ❌ R-FE-61: Block parser extracts `forEach=` from `@block/begin` arguments
  - Populates `BlockNode.forEach` field

- ❌ R-FE-62: Block parser extracts `index=` from `@block/begin` arguments
  - Populates `BlockNode.index` field
  - `index=` without `forEach=` is an error

- ❌ R-FE-63: Validation: `forEach=` and `if=` are mutually exclusive on same block
  - Error: "Block cannot have both forEach= and if= arguments"
  - Rationale: Use nested blocks for conditional forEach

### Interpreter

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/foreach.spec.ts`
**Progress:** 0/5 (0%)

- ❌ R-FE-81: `executeBlock()` detects `block.forEach` and calls `executeForEach()`

- ❌ R-FE-82: `executeForEach()` implementation:
  ```typescript
  async executeForEach(block: BlockNode, context: ExecutionContext): Promise<ExecutionContext> {
    const { iterable, iterator } = block.forEach!
    const collection = this.evaluator.evaluate(iterable, context)

    if (!Array.isArray(collection)) {
      throw new Error(`Cannot iterate over ${typeof collection}`)
    }

    let currentContext = context
    for (let i = 0; i < collection.length; i++) {
      // Push child scope
      currentContext = pushScope(currentContext)

      // Bind iterator variable to current scope
      currentContext.scopeChain.current[iterator.value] = collection[i]

      // Bind index if specified
      if (block.index) {
        currentContext.scopeChain.current[block.index.variable.value] = i
      }

      // Execute block body
      for (const statement of block.body) {
        currentContext = await this.executeStatement(statement, currentContext)
      }

      // Pop child scope (preserves data changes, discards scope variables)
      currentContext = popScope(currentContext)
    }

    return currentContext
  }
  ```

- ❌ R-FE-83: Empty collection skips block body (0 iterations, no error)

- ❌ R-FE-84: Nested forEach creates nested scope chain
  - Outer iterator remains accessible in inner loop via scope chain walk

- ❌ R-FE-85: Data changes inside forEach persist after loop
  - `output=data.result` writes to `context.data`, survives scope pop

## Dependencies

- **Depends on:**
  - [Mapper Expression](./mapper.prd.md) (IMPLEMENTED) - provides `->` syntax
  - [Reserved Arguments](./reserved-arguments.prd.md) (IMPLEMENTED) - provides pattern
  - [Block Parsing](./block-parsing.prd.md) (IMPLEMENTED) - provides block structure
  - [Variable Scope](../interpreter/variable-scope.prd.md) (APPROVED) - provides scope chain

- **Blocks:**
  - Control flow (`break`, `continue`)
  - Parallel execution

## Open Questions

- [x] Can forEach and if coexist on same block? -> **No**, use nested blocks
- [x] What happens with empty collection? -> **0 iterations, no error**
- [x] What happens with non-array? -> **Runtime error**
- [ ] Should we support object iteration? -> Deferred to roadmap 1.0
- [ ] Should we support `@forEach/begin` syntax in addition to `@block/begin forEach=`? -> Discuss

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

**Parsing:**
- [ ] AC-FE-01: Given `@block/begin forEach=users -> user`, when parsed, then `BlockNode.forEach` is `{ iterable: Identifier(users), iterator: SingleString(user) }`
- [ ] AC-FE-02: Given `@block/begin forEach={users|filter:active} -> user`, when parsed, then `forEach.iterable` is `PipeExpressionNode`
- [ ] AC-FE-03: Given `@block/begin forEach=users -> user index=i`, when parsed, then `BlockNode.index` is `{ variable: SingleString(i) }`
- [ ] AC-FE-04: Given `@block/begin forEach=users` (no arrow), when parsed, then parser rejects with "forEach requires 'collection -> variable' syntax"
- [ ] AC-FE-05: Given `@block/begin forEach=users -> user if=cond`, when parsed, then parser rejects with "Block cannot have both forEach= and if="

**Execution:**
- [ ] AC-FE-06: Given `users = [{name: "Emma"}, {name: "Carlos"}]` and forEach block logging `user.name`, when executed, then logs show "Emma" then "Carlos"
- [ ] AC-FE-07: Given `users = []` (empty) and forEach block, when executed, then block body executes 0 times (no error)
- [ ] AC-FE-08: Given `users = "not-array"` and forEach block, when executed, then runtime error "Cannot iterate over string"
- [ ] AC-FE-09: Given nested forEach (users -> user, user.tweets -> tweet), when executed, then both `user` and `tweet` are resolvable in inner block
- [ ] AC-FE-10: Given forEach with `index=i`, when executed on 3-element array, then `i` equals 0, 1, 2 respectively
- [ ] AC-FE-11: Given forEach that sets `output=data.count` inside loop, when loop completes, then `context.data.count` reflects final value
- [ ] AC-FE-12: Given forEach with iterator `user`, when loop completes, then `user` is no longer resolvable (scope popped)

**General:**
- [ ] All automated tests pass
- [ ] Edge cases covered in `foreach.edge.spec.ts`

## Implementation Notes

### Syntax Examples

```oto
# Basic iteration
@block/begin forEach=users -> user
  @log/print message=user.name
@block/end

# With index
@block/begin forEach=tweets -> tweet index=i
  @log/print message={"Tweet " + i + ": " + tweet.text}
@block/end

# With pipe expression
@block/begin forEach={users|filter:active|orderBy:name} -> user
  @api/call endpoint={"/notify/" + user.id}
@block/end

# Nested iteration
@block/begin forEach=users -> user
  @block/begin forEach=user.followers -> follower
    @log/print message={user.name + " is followed by " + follower.name}
  @block/end
@block/end

# Output inside loop (persists to data)
@block/begin forEach=items -> item
  @math/add a=total b=item.price output=data.total
@block/end
@log/print message=total  # accessible after loop
```

### File Structure

```
packages/runtime/src/compiler/
├── parser/
│   ├── ast.ts                    # UPDATE: ForEachArgNode, IndexArgNode, BlockNode
│   ├── shared-parser.ts          # UPDATE: add 'forEach' to reserved words
│   ├── instruction-parser.ts     # UPDATE: add FOREACH_KEY, INDEX_KEY tokens
│   ├── reserved-args.spec.ts     # UPDATE: add forEach/index tests
│   ├── block-parser.spec.ts      # UPDATE: add forEach block tests
│   └── foreach.prd.md            # THIS FILE
├── interpreter/
│   ├── interpreter.ts            # UPDATE: executeForEach()
│   ├── foreach.spec.ts           # NEW: forEach execution tests
│   └── variable-scope.prd.md     # DEPENDENCY: scope chain
└── normalizer/
    └── normalize-foreach.ts      # DEPRECATED: to be removed at end of v0.5
```

### Migration from Old Normalizer

The old `normalize-foreach.ts` used string parsing (`"item of items"`). This PRD replaces it with:
1. Proper reserved argument parsing
2. Mapper expression syntax
3. Block-level integration

The old normalizer should be removed at the end of v0.5 (see ROADMAP.md "Cleanup").
