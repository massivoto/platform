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
| Requirements: System Variables Convention | ❌ Not Started | 0/3 |
| Requirements: AST Types | ❌ Not Started | 0/3 |
| Requirements: Parser Tokens | ❌ Not Started | 0/1 |
| Requirements: Reserved Arg Parser | ❌ Not Started | 0/3 |
| Requirements: Block Integration | ❌ Not Started | 0/2 |
| Requirements: Interpreter | ❌ Not Started | 0/6 |
| Acceptance Criteria | ❌ Not Started | 0/16 |
| Theme | ✅ Defined | - |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [Mapper Expression](./mapper.prd.md) (IMPLEMENTED)

## Child PRDs

- None

## Context

The `forEach` construct enables iteration over collections in OTO programs. It uses the mapper expression (`->`) combined with a reserved argument on blocks:

```oto
@block/begin forEach=users -> user
  @log/print message={_index + ": " + user.name}
  @log/print message={_first ? "First!" : ""}
@block/end
```

The mapper expression `users -> user` provides:
- **Left side** (`users`): The iterable collection (any expression)
- **Right side** (`user`): The iterator variable name (`SingleStringNode`)

### System Variables

Inside a forEach block, the runtime automatically injects **system variables** prefixed with `_`:

| Variable | Type | Description |
|----------|------|-------------|
| `_index` | number | Current iteration index (0-based) |
| `_count` | number | Current iteration count (1-based, equals `_index + 1`) |
| `_length` | number | Total collection length |
| `_first` | boolean | `true` on first iteration (`_index === 0`) |
| `_last` | boolean | `true` on last iteration (`_index === _length - 1`) |
| `_odd` | boolean | `true` if `_index` is odd |
| `_even` | boolean | `true` if `_index` is even |

The `_` prefix convention reserves these identifiers for system use. User-defined variables should not start with `_`.

### Dependency on Variable Scope

ForEach **requires** the scope chain from [variable-scope.prd.md](../interpreter/variable-scope.prd.md):
- Each iteration creates a child scope
- Iterator variable and system variables are written to `scopeChain.current`
- Child scope is popped after each iteration
- Nested forEach creates nested scope chain

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Syntax: `forEach="item of items"` vs `forEach=items -> item` | **Mapper syntax** | Reuses implemented mapper parser, consistent with expression grammar |
| 2026-01-20 | Location: instruction arg vs block arg | **Block arg** | forEach wraps multiple statements, block is natural container |
| 2026-01-20 | Index variable: explicit `index=i` vs implicit | **Implicit `_index`** | Simpler syntax, no extra AST types needed |
| 2026-01-20 | System variable prefix | **`_` (underscore)** | Common convention for internal/system variables |
| 2026-01-20 | Empty collection | **Skip block** | `forEach=[] -> x` executes 0 iterations, no error |
| 2026-01-20 | Non-iterable | **Runtime error** | `forEach=42 -> x` throws "Cannot iterate over number" |

## Scope

**In scope:**
- `_` prefix convention for system variables
- `forEach=` reserved argument accepting mapper expression
- System variables: `_index`, `_count`, `_length`, `_first`, `_last`, `_odd`, `_even`
- Update `BlockNode` with `forEach` field
- Parser integration (token, grammar)
- Interpreter support (iteration, scope push/pop, system variable injection)
- Nested forEach support (via scope chain)

**Out of scope:**
- `break` / `continue` statements (future PRD): no, never
- Parallel iteration (`forEach=a, b -> [x, y]`), no but streaming maybe
- Object iteration (`forEach=obj.entries() -> [key, value]`) , probably not, would collide to {expr|pipe}
- Async iteration / streaming : yes, future PRD
- Error handling inside block (future PRD)
- Old normalizer cleanup (separate task at end of v0.5)

## Requirements

### System Variables Convention

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/shared-parser.spec.ts`
**Progress:** 0/3 (0%)

- ❌ R-FE-01: Document `_` prefix convention: identifiers starting with `_` are reserved for system use
  - User-defined variables should not start with `_`
  - Parser does NOT enforce this (allows `_` prefix) - it's a convention
  - Interpreter may overwrite user's `_index` inside forEach scope

- ❌ R-FE-02: Verify identifier parser allows `_` prefix: regex `[a-zA-Z_][a-zA-Z0-9_-]*`
  - `_index`, `_first`, `_myVar` are all valid identifiers
  - Add test cases for `_` prefixed identifiers

- ❌ R-FE-03: Document system variables in DSL specification
  - Add section to `dsl-0.5.md` listing forEach system variables
  - Note that these are only available inside forEach blocks

### AST Types

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 0/3 (0%)

- ❌ R-FE-21: Add `ForEachArgNode` type to `ast.ts`:
  ```typescript
  interface ForEachArgNode {
    type: 'forEach-arg'
    iterable: ExpressionNode   // left side of mapper (users)
    iterator: SingleStringNode // right side of mapper (user)
  }
  ```

- ❌ R-FE-22: Update `ReservedArgNode` union type:
  ```typescript
  type ReservedArgNode = OutputArgNode | IfArgNode | ForEachArgNode
  ```

- ❌ R-FE-23: Update `BlockNode` with forEach field:
  ```typescript
  interface BlockNode {
    type: 'block'
    name?: string
    condition?: ExpressionNode  // from if=
    forEach?: ForEachArgNode    // NEW: from forEach=
    body: StatementNode[]
  }
  ```

### Parser Tokens

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/reserved-args.spec.ts`
**Progress:** 0/1 (0%)

- ❌ R-FE-41: Add `FOREACH_KEY` token to `InstructionTokens`:
  ```typescript
  FOREACH_KEY: genlex.tokenize(C.string('forEach='), 'FOREACH_KEY', 500)
  ```

### Reserved Arg Parser

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/reserved-args.spec.ts`
**Progress:** 0/3 (0%)

- ❌ R-FE-61: `forEachArg` parser: `FOREACH_KEY` followed by `mapperExpression`
  - Validates result is MapperExpressionNode (has `->`)
  - Rejects non-mapper: `forEach=users` fails with "forEach requires 'collection -> variable' syntax"

- ❌ R-FE-62: Update `reservedArg` parser to include forEach:
  ```typescript
  const reservedArg = F.try(outputArg)
    .or(F.try(ifArg))
    .or(forEachArg)
  ```

- ❌ R-FE-63: Ensure `forEach` is in reserved words in `shared-parser.ts`
  - Prevents `forEach` from being used as regular argument key

### Block Integration

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 0/2 (0%)

- ❌ R-FE-81: Block parser extracts `forEach=` from `@block/begin` arguments
  - Populates `BlockNode.forEach` field

- ❌ R-FE-82: Validation: `forEach=` and `if=` are mutually exclusive on same block
  - Error: "Block cannot have both forEach= and if= arguments"
  - Rationale: Use nested blocks for conditional forEach

### Interpreter

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/foreach.spec.ts`
**Progress:** 0/6 (0%)

- ❌ R-FE-101: `executeBlock()` detects `block.forEach` and calls `executeForEach()`

- ❌ R-FE-102: `executeForEach()` implementation:
  ```typescript
  async executeForEach(block: BlockNode, context: ExecutionContext): Promise<ExecutionContext> {
    const { iterable, iterator } = block.forEach!
    const collection = this.evaluator.evaluate(iterable, context)

    if (!Array.isArray(collection)) {
      throw new Error(`Cannot iterate over ${typeof collection}`)
    }

    const length = collection.length
    let currentContext = context

    for (let i = 0; i < length; i++) {
      // Push child scope
      currentContext = pushScope(currentContext)

      // Inject iterator variable
      currentContext.scopeChain.current[iterator.value] = collection[i]

      // Inject system variables
      currentContext.scopeChain.current['_index'] = i
      currentContext.scopeChain.current['_count'] = i + 1
      currentContext.scopeChain.current['_length'] = length
      currentContext.scopeChain.current['_first'] = i === 0
      currentContext.scopeChain.current['_last'] = i === length - 1
      currentContext.scopeChain.current['_odd'] = i % 2 === 1
      currentContext.scopeChain.current['_even'] = i % 2 === 0

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

- ❌ R-FE-103: Empty collection skips block body (0 iterations, no error)

- ❌ R-FE-104: Nested forEach creates nested scope chain
  - Outer iterator and system variables remain accessible via scope chain walk
  - Inner `_index` shadows outer `_index` (expected behavior)

- ❌ R-FE-105: Data changes inside forEach persist after loop
  - `output=data.result` writes to `context.data`, survives scope pop

- ❌ R-FE-106: System variables are only available inside forEach scope
  - Accessing `_index` outside forEach returns `undefined` (not an error)

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
- [x] Index variable syntax? -> **Implicit `_index`** (system variable)
- [ ] Should we support object iteration? -> Deferred to roadmap 1.0
- [ ] Should accessing `_index` outside forEach throw an error? -> Currently returns undefined

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

**Parsing:**
- [ ] AC-FE-01: Given `@block/begin forEach=users -> user`, when parsed, then `BlockNode.forEach` is `{ iterable: Identifier(users), iterator: SingleString(user) }`
- [ ] AC-FE-02: Given `@block/begin forEach={users|filter:active} -> user`, when parsed, then `forEach.iterable` is `PipeExpressionNode`
- [ ] AC-FE-03: Given `@block/begin forEach=users` (no arrow), when parsed, then parser rejects with "forEach requires 'collection -> variable' syntax"
- [ ] AC-FE-04: Given `@block/begin forEach=users -> user if=cond`, when parsed, then parser rejects with "Block cannot have both forEach= and if="

**System Variables:**
- [ ] AC-FE-05: Given forEach over 3-element array, when `_index` accessed, then values are 0, 1, 2
- [ ] AC-FE-06: Given forEach over 3-element array, when `_count` accessed, then values are 1, 2, 3
- [ ] AC-FE-07: Given forEach over 3-element array, when `_length` accessed, then value is always 3
- [ ] AC-FE-08: Given forEach over array, when `_first` accessed on first iteration, then value is `true`
- [ ] AC-FE-09: Given forEach over array, when `_last` accessed on last iteration, then value is `true`
- [ ] AC-FE-10: Given forEach over array, when `_odd` and `_even` accessed, then they alternate correctly

**Execution:**
- [ ] AC-FE-11: Given `users = [{name: "Emma"}, {name: "Carlos"}]` and forEach block logging `user.name`, when executed, then logs show "Emma" then "Carlos"
- [ ] AC-FE-12: Given `users = []` (empty) and forEach block, when executed, then block body executes 0 times (no error)
- [ ] AC-FE-13: Given `users = "not-array"` and forEach block, when executed, then runtime error "Cannot iterate over string"
- [ ] AC-FE-14: Given nested forEach (users -> user, user.tweets -> tweet), when executed, then both `user` and `tweet` are resolvable in inner block
- [ ] AC-FE-15: Given forEach that sets `output=data.count` inside loop, when loop completes, then `context.data.count` reflects final value
- [ ] AC-FE-16: Given forEach with iterator `user`, when loop completes, then `user` and `_index` are no longer resolvable (scope popped)

**General:**
- [ ] All automated tests pass
- [ ] Edge cases covered in `foreach.edge.spec.ts`

## Implementation Notes

### Syntax Examples

```oto
# Basic iteration with system variables
@block/begin forEach=users -> user
  @log/print message={_count + " of " + _length + ": " + user.name}
@block/end

# Conditional styling with _first/_last
@block/begin forEach=items -> item
  @html/render template={_first ? "<ul><li>" : "<li>"}
  @html/render template={item.name}
  @html/render template={_last ? "</li></ul>" : "</li>"}
@block/end

# Alternating row colors with _odd/_even
@block/begin forEach=rows -> row
  @html/render class={_even ? "bg-white" : "bg-gray-100"}
@block/end

# With pipe expression
@block/begin forEach={users|filter:active|orderBy:name} -> user
  @api/call endpoint={"/notify/" + user.id}
@block/end

# Nested iteration (inner _index shadows outer)
@block/begin forEach=users -> user
  @utils/set value=_index output=data.userIndex
  @block/begin forEach=user.followers -> follower
    @log/print message={data.userIndex + "." + _index + ": " + follower.name}
  @block/end
@block/end

# Output inside loop (persists to data)
@block/begin forEach=items -> item
  @math/add a=total b=item.price output=data.total
@block/end
@log/print message=total  # accessible after loop
```

### System Variables Reference

```
forEach=items -> item
  |
  v
+------------------+
| scopeChain.current |
+------------------+
| item    = items[i] |  <- iterator variable (user-defined name)
| _index  = 0, 1, 2  |  <- 0-based index
| _count  = 1, 2, 3  |  <- 1-based count
| _length = 3        |  <- total items
| _first  = T, F, F  |  <- first iteration?
| _last   = F, F, T  |  <- last iteration?
| _odd    = F, T, F  |  <- odd index?
| _even   = T, F, T  |  <- even index?
+------------------+
```

### File Structure

```
packages/runtime/src/compiler/
├── parser/
│   ├── ast.ts                    # UPDATE: ForEachArgNode, BlockNode.forEach
│   ├── shared-parser.ts          # VERIFY: forEach in reserved words, _ prefix allowed
│   ├── instruction-parser.ts     # UPDATE: add FOREACH_KEY token
│   ├── reserved-args.spec.ts     # UPDATE: add forEach tests
│   ├── block-parser.spec.ts      # UPDATE: add forEach block tests
│   └── foreach.prd.md            # THIS FILE
├── interpreter/
│   ├── interpreter.ts            # UPDATE: executeForEach()
│   ├── foreach.spec.ts           # NEW: forEach execution tests
│   └── variable-scope.prd.md     # DEPENDENCY: scope chain
├── documentation/
│   └── dsl-0.5.md                # UPDATE: document system variables
└── normalizer/
    └── normalize-foreach.ts      # DEPRECATED: to be removed at end of v0.5
```

### Migration from Old Normalizer

The old `normalize-foreach.ts` used string parsing (`"item of items"`). This PRD replaces it with:
1. Proper reserved argument parsing
2. Mapper expression syntax
3. Block-level integration
4. System variables instead of explicit `index=`

The old normalizer should be removed at the end of v0.5 (see ROADMAP.md "Cleanup").
