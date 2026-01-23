# PRD: Mapper Expression

**Status:** IMPLEMENTED
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
| Requirements: AST | ✅ Complete | 3/3 |
| Requirements: Token | ✅ Complete | 2/2 |
| Requirements: Parser | ✅ Complete | 4/4 |
| Requirements: Integration | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 8/8 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [DSL 0.5 Parser](./dsl-0.5-parser.prd.md)

## Child PRDs

- [forEach Reserved Argument](./foreach.prd.md) (planned - depends on this)

## Context

The mapper expression (`->`) is a first-class expression that serves two purposes:

1. **Property extraction** (array mapping): `users -> name` extracts the `name` property from each element
2. **Iterator binding** (forEach): `forEach=users -> user` binds `user` as the loop variable

The syntax `source -> target` creates a `MapperExpressionNode` where:
- `source` is any expression (array, identifier, pipe result)
- `target` is a `SingleStringNode` (literal property/variable name)

```oto
# Property extraction - produces new array
@set/value names=users -> name           # ["Alice", "Bob", "Carol"]
@set/value ids={users|filter:active} -> id

# Iterator binding - used with forEach
@batch/process forEach=users -> user
  @api/call endpoint={"/users/" + user.id}
@block/end
```

The evaluator interprets the mapper differently based on context:
- As expression value: map operation (extract property from each element)
- As forEach argument: iteration binding (bind variable for each iteration)

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Operator symbol | **`->`** | Arrow is intuitive for "maps to" or "becomes" |
| 2026-01-20 | Precedence | **Lowest (below pipe)** | `users\|filter:x -> name` = `(users\|filter:x) -> name` |
| 2026-01-20 | Right side type | **SingleStringNode only** | No expressions for now; dynamic access in roadmap 1.5 |
| 2026-01-20 | Chaining | **Not allowed** | `a -> b -> c` is invalid; use pipes for complex transforms |

## Scope

**In scope:**
- `MapperExpressionNode` AST type
- `ARROW` token (`->`)
- Mapper parser with higher precedence (means low number in Masala)
- Integration with expression parser
- Add `MapperExpressionNode` to `ExpressionNode` union

**Out of scope:**
- forEach reserved argument - separate PRD
- Evaluator implementation - separate concern
- Chained mappers `a -> b -> c` - roadmap 1.5 (flatMap semantics)
- Dynamic right side `a -> {expr}` - roadmap 1.5
- Nested property access `a -> settings.theme` - roadmap 1.5

## Requirements

### AST

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/mapper-parser.spec.ts`
**Progress:** 0/3 (0%)

- ✅ R-MAP-01: Add `MapperExpressionNode` interface to `ast.ts`:
  ```typescript
  interface MapperExpressionNode {
    type: 'mapper'
    source: ExpressionNode  // left side of ->
    target: SingleStringNode // right side of ->
  }
  ```

- ✅ R-MAP-02: Add `MapperExpressionNode` to `ExpressionNode` union type
  - Mapper is a valid expression anywhere an expression is expected

- ✅ R-MAP-03: Do NOT add `MapperExpressionNode` to `SimpleExpressionNode`
  - Mapper contains pipe expressions, so it's not "simple"

### Token

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/mapper-parser.spec.ts`
**Progress:** 0/2 (0%)

- ✅ R-MAP-21: Add `ARROW` token to `ArgTokens` interface:
  ```typescript
  ARROW: SingleParser<'->'>
  ```

- ✅ R-MAP-22: Register `ARROW` token in `createArgumentTokens()`:
  ```typescript
  // Registered via keywords() to ensure proper tokenization before MINUS
  const [ARROW] = genlex.keywords(['->'])
  ```

### Parser

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/mapper-parser.spec.ts`
**Progress:** 0/5 (0%)

- ✅ R-MAP-41: Create `mapperParser` that parses `expression -> singleString`
  - Left side: full expression (including pipes)
  - Right side: SingleStringNode only

- ✅ R-MAP-42: Mapper has **lowest precedence** in expression hierarchy
  ```
  mapperExpression (LOWEST)
    └── pipeExpression
          └── logicalOr
                └── ... (rest of precedence ladder)
  ```

- ✅ R-MAP-43: Mapper does NOT chain - only one `->` per expression
  - `users -> friends -> name` is invalid
  - For nested access, use pipes: `{users -> friends | flatten} -> name`
  - Chaining with flatMap semantics deferred to roadmap 1.5 (see Open Questions)

- ✅ R-MAP-44: Export `mapperParser` and integrate with full expression parser

### Integration

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 0/3 (0%)

- ✅ R-MAP-61: Update `full-expression-parser.ts` to use mapper as top-level
  ```typescript
  // Before: fullExpression = pipeExpression | simpleExpression
  // After:  fullExpression = mapperExpression
  //         mapperExpression = (pipeExpression | simpleExpression) (-> singleString)?
  ```

- ✅ R-MAP-62: Mapper works with all expression types on left side:
  - Identifier: `users -> name`
  - Pipe: `{users|filter:active} -> id`
  - Member: `data.users -> email`
  - Array: `[a, b, c] -> value` (unusual but valid)

- ✅ R-MAP-63: Existing expression tests continue to pass
  - Expressions without `->` parse unchanged

## Precedence Ladder (Updated)

```
LOWEST    mapper       ->           users -> name
          pipe         |            data | filter:x
          logical OR   ||           a || b
          logical AND  &&           a && b
          equality     == !=        a == b
          comparison   < <= > >=    a < b
          additive     + -          a + b
          multiplicative * / %      a * b
          unary        ! - +        !a, -5
HIGHEST   primary      literals, identifiers, member, array, parentheses
```

## Dependencies

- **Depends on:** [Single String Parser](./single-string.prd.md) (IMPLEMENTED)
- **Blocks:** forEach PRD, Evaluator mapper support

## Open Questions

- [x] Should `->` be allowed in braces? `data={users -> name}` → **Yes**, mapper is a full expression
- [x] Multiple mappers? `a -> b -> c` → **No**, not supported for now
- [x] Should empty source be allowed? `-> name` → **No**, source is required

### Roadmap 1.5: Chaining with flatMap

For nested property access like `users -> friends -> name`, we may add **flatMap chaining** in roadmap 1.5:

```oto
# Roadmap 1.5 - NOT current scope
users -> friends -> name
# Semantics: flatMap chain (like JSON path queries or GraphQL)
# = users.flatMap(u => u.friends).map(f => f.name)
# = ["Alice", "Bob", "Carol"]
```

Inspiration:
- **JSON Path**: `$.users[*].friends[*].name`
- **GraphQL**: `{ users { friends { name } } }`
- **LINQ**: `users.SelectMany(u => u.Friends).Select(f => f.Name)`

This would enable intuitive traversal of nested arrays without explicit flatten pipes.

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-MAP-01: Given `users -> name`, when parsed, then result is `MapperExpressionNode { source: Identifier(users), target: SingleString(name) }`
- [x] AC-MAP-02: Given `{users|filter:active} -> id`, when parsed, then source is `PipeExpressionNode` and target is `SingleString(id)`
- [x] AC-MAP-03: Given `data.users -> email`, when parsed, then source is `MemberExpressionNode`
- [x] AC-MAP-04: Given `users -> 123`, when parsed, then parser rejects (right side must be SingleString)
- [x] AC-MAP-05: Given `users -> settings.theme`, when parsed, then parser rejects (no dots in SingleString)
- [x] AC-MAP-06: Given `{users|filter:x} -> name`, when parsed, then source is entire pipe expression (precedence test)
- [x] AC-MAP-07: Given `count=42` (no arrow), when parsed, then result is `LiteralNumberNode` (backwards compatible)
- [x] AC-MAP-08: Given `{users -> name}`, when parsed inside braces, then result is `MapperExpressionNode`
- [x] All automated tests pass (22 tests in mapper-parser.spec.ts)
- [x] Edge cases covered in `mapper-parser.spec.ts` (chaining, empty target, reserved words)

## Implementation Notes

### File Structure

```
packages/runtime/src/compiler/parser/
├── ast.ts                           # UPDATE: add MapperExpressionNode
├── args-details/
│   ├── mapper-parser.ts             # NEW: mapper expression parser
│   ├── mapper-parser.spec.ts        # NEW: mapper tests
│   ├── full-expression-parser.ts    # UPDATE: integrate mapper
│   ├── single-string-parser.ts      # EXISTS: used by mapper
│   └── tokens/
│       └── argument-tokens.ts       # UPDATE: add ARROW token
```

### Parser Structure

```typescript
// mapper-parser.ts
import { F } from '@masala/parser'
import { singleStringParser } from './single-string-parser.js'
import { MapperExpressionNode, ExpressionNode } from '../ast.js'

export function createMapperParser(baseExpression: Parser<ExpressionNode>, tokens: ArgTokens) {
  const { ARROW } = tokens

  // mapper = baseExpression (-> singleString)?
  return baseExpression
    .then(
      ARROW.drop()
        .then(singleStringParser)
        .opt()
    )
    .map(([source, target]) => {
      if (target === undefined) {
        return source // no arrow, return base expression unchanged
      }
      return {
        type: 'mapper',
        source,
        target,
      } as MapperExpressionNode
    })
}
```

### Integration with Full Expression

```typescript
// full-expression-parser.ts (updated)
export function createExpressionWithPipe(tokens: ArgTokens): SingleParser<ExpressionNode> {
  const pipeOrSimple = createPipeExpression(tokens) // existing

  // Wrap with mapper (lowest precedence)
  return createMapperParser(pipeOrSimple, tokens)
}
```

### Token Addition

```typescript
// argument-tokens.ts
export interface ArgTokens extends UnaryTokens {
  // ... existing tokens ...
  ARROW: SingleParser<'->'>
}

export function createArgumentTokens(genlex: IGenLex): ArgTokens {
  // ... existing code ...
  const ARROW = genlex.tokenize('->', 'ARROW', 100) // low priority

  return {
    // ... existing tokens ...
    ARROW: ARROW.map(leanToken) as SingleParser<'->'>,
  }
}
```
