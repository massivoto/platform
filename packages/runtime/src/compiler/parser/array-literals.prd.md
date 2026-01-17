# PRD: Array Literals

**Status:** IMPLEMENTED
**Last updated:** 2026-01-17

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Syntax | ✅ Complete | 4/4 |
| Requirements: Elements | ✅ Complete | 4/4 |
| Requirements: AST | ✅ Complete | 3/3 |
| Requirements: Parser Integration | ✅ Complete | 4/4 |
| Acceptance Criteria | ✅ Complete | 6/6 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [DSL 0.5 Parser](./dsl-0.5-parser.prd.md)

## Child PRDs

- None

## Context

DSL 0.5 lacks array literals, limiting the ability to pass lists of values to commands. Arrays are a fundamental data structure needed for batch operations, filtering, and data manipulation.

```oto
@twitter/post tags=["tech", "ai", "automation"]
@batch/process ids=[1, 2, 3, 4, 5]
@filter/users roles=[admin, moderator]
```

Arrays will be added to the `ExpressionNode` type and parsed as primary expressions (same precedence level as literals and identifiers).

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-17 | Syntax: `[...]` vs `{array:...}` | **`[...]` selected** | Universal, JS-like, intuitive |
| 2026-01-17 | Braces for array arg | **No braces** | Brackets provide clear boundaries |
| 2026-01-17 | Expressions in elements | **Full expressions allowed** | Commas and brackets delimit unambiguously |
| 2026-01-17 | Trailing comma | **Not allowed** | Cleaner syntax, no sparse arrays |
| 2026-01-17 | Nested depth | **Unlimited** | No artificial limits |
| 2026-01-17 | Element types | **Mixed allowed** | JS-like flexibility |
| 2026-01-17 | Classification | **NOT a LiteralNode** | Arrays are composite (contain expressions), not primitive values |

## Scope

**In scope:**
- Array literal syntax `[element, element, ...]`
- Mixed element types (numbers, strings, booleans, identifiers, expressions)
- Nested arrays `[[1, 2], [3, 4]]`
- Empty arrays `[]`
- Full expressions as elements (no inner braces needed)
- `ArrayLiteralNode` AST type
- Parser integration as primary expression

**Out of scope:**
- Array spread syntax `[...arr]`
- Array methods/pipes (already handled by pipe system)
- Computed property access `arr[index]` (deferred)
- Sparse arrays `[1, , 3]`

## Requirements

### Syntax

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/array-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-ARR-01: Array literals use bracket syntax: `[1, 2, 3]`
- ✅ R-ARR-02: Elements separated by commas with optional whitespace: `[1, 2, 3]` or `[1,2,3]`
- ✅ R-ARR-03: Empty arrays are valid: `[]`
- ✅ R-ARR-04: Trailing commas are **not** allowed: `[1, 2,]` is rejected

### Elements

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/array-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-ARR-21: Elements can be any expression type (literals, identifiers, member, unary, binary, logical)
- ✅ R-ARR-22: Mixed element types allowed: `[1, "two", true, user.name]`
- ✅ R-ARR-23: Nested arrays allowed: `[[1, 2], [3, 4]]`
- ✅ R-ARR-24: Sparse arrays rejected: `[1, , 3]` is invalid (no empty slots)

### AST

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/array-parser.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-ARR-41: Add `ArrayLiteralNode` type to `ast.ts`:
  ```typescript
  interface ArrayLiteralNode {
    type: 'array-literal'
    elements: ExpressionNode[]
  }
  ```
- ✅ R-ARR-42: Add `ArrayLiteralNode` to `ExpressionNode` union type
- ✅ R-ARR-43: Add `ArrayLiteralNode` to `SimpleExpressionNode` union type

> **Note:** Arrays are **NOT** added to `LiteralNode`. `LiteralNode` is for primitive atomic values (string, number, boolean, null). Arrays are composite structures containing expressions, so they belong in `ExpressionNode` and `SimpleExpressionNode` directly.

### Parser Integration

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 4/4 (100%)

- ✅ R-ARR-61: Add `LBRACKET` `[` and `RBRACKET` `]` tokens to `ArgTokens` in `argument-tokens.ts` (following LEFT/RIGHT for `()`, OPEN/CLOSE for `{}`)
- ✅ R-ARR-62: Array is a **primary** expression (same level as literals, identifiers, parenthesized)
- ✅ R-ARR-63: Array elements use `fullExpression` parser (allows binary, logical, pipes inside)
- ✅ R-ARR-64: Arrays do not require braces when used as argument value: `ids=[1, 2, 3]` is valid

## Expression Boundary Update

Per [expression-boundaries.prd.md](./expression-boundaries.prd.md), arrays are **simple expressions** (no braces needed):

| Expression Type | Example | Braces? | Why |
|-----------------|---------|---------|-----|
| Array literal | `[1, 2, 3]` | **No** | Brackets provide clear boundaries |

Update `expression-boundaries.prd.md` to include arrays in the simple expressions table.

## Dependencies

- **Depends on:** DSL 0.5 Parser, expression-boundaries.prd.md
- **Blocks:** None

## Open Questions

- [x] ~~Allow complex expressions inside arrays?~~ Yes, brackets delimit unambiguously
- [x] ~~Trailing comma?~~ No
- [x] ~~Sparse arrays?~~ No
- [x] ~~Should arrays be usable in pipe expressions?~~ Yes, `{[1,2,3]|filter:isEven}` works because arrays are primary expressions

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-ARR-01: Given `@twitter/post tags=["tech", "ai"]`, when parsed, then `tags` has `ArrayLiteralNode` with 2 string elements
- [x] AC-ARR-02: Given `@batch/process ids=[1, 2, 3]`, when parsed, then `ids` has `ArrayLiteralNode` with 3 number elements
- [x] AC-ARR-03: Given `@filter/users scores=[a + b, c * 2]`, when parsed, then array contains 2 `BinaryExpressionNode` elements
- [x] AC-ARR-04: Given `@set/matrix data=[[1, 2], [3, 4]]`, when parsed, then nested `ArrayLiteralNode` structure
- [x] AC-ARR-05: Given `@set/empty list=[]`, when parsed, then `ArrayLiteralNode` with empty elements array
- [x] AC-ARR-06: Given `@set/bad list=[1, 2,]`, when parsed, then parser rejects (trailing comma)
- [x] All automated tests pass (25 tests in array-parser.spec.ts)
- [ ] Edge cases in `array-parser.edge.spec.ts` (deferred)

## Implementation Context for LLM

### Required Reading

1. **Masala Parser Documentation** (parser combinator library):
   - https://raw.githubusercontent.com/masala/masala-parser/refs/heads/main/llm.txt
   - Key concepts: `F.try()`, `.then()`, `.or()`, `.drop()`, `.optrep()`, `.opt()`, `.map()`, `F.lazy()`, `leanToken`

2. **Expression Parser Architecture** - understand the precedence ladder:
   ```
   fullExpression
     └── pipeExpression | simpleExpression
           └── logicalOr → logicalAnd → equality → comparative → additive → multiplicative
                 └── postfix | unary
                       └── member | primary
                             └── atomic | parenthesizedExpr | **arrayLiteral** ← INSERT HERE
                                   └── IDENTIFIER | BOOLEAN | STRING | NUMBER
   ```

### Key Files to Read

| File | Purpose | What to Learn |
|------|---------|---------------|
| `ast.ts` | AST type definitions | How nodes are structured, union types |
| `argument-tokens.ts` | Token definitions | How to add LBRACKET/RBRACKET |
| `full-expression-parser.ts` | Expression entry point | Where `primary` is built (line 19-22) |
| `simple-expression-parser.ts` | Precedence ladder | How parsers chain together |
| `literals-parser.ts` | `atomicParser` | Current leaf parsers (not where arrays go) |
| `pipe-parser/pipe-parser.ts` | Pipe expressions | How complex parsers use `F.lazy()` |

### Expression Hierarchy (Current)

```typescript
// ast.ts
type LiteralNode = LiteralStringNode | LiteralNumberNode | LiteralBooleanNode | LiteralNullNode
type AtomicNode = IdentifierNode | LiteralNode  // primitives only
type SimpleExpressionNode = IdentifierNode | LiteralNode | MemberExpressionNode | UnaryExpressionNode | BinaryExpressionNode | LogicalExpressionNode
type ExpressionNode = SimpleExpressionNode | PipeExpressionNode
```

### Where Arrays Fit

Arrays are **primary expressions** but **NOT atomic/literals**:
- `LiteralNode` = primitive values (string, number, boolean, null) → **NO ARRAYS HERE**
- `AtomicNode` = leaf values (identifier, literal) → **NO ARRAYS HERE**
- `primary` in `full-expression-parser.ts` = atomic + parenthesized + **ARRAYS** → **ADD HERE**
- `SimpleExpressionNode` = all non-pipe expressions → **ADD ARRAYS HERE**
- `ExpressionNode` = all expressions → **ADD ARRAYS HERE**

### Critical Implementation Detail

In `full-expression-parser.ts`, the `primary` parser is built like this:

```typescript
const parenthesisExpression = F.lazy(() =>
  LEFT.drop().then(fullExpression).then(RIGHT.drop()),
).map((t) => t.single())

const atomic = atomicParser(tokens).or(parenthesisExpression)
const primary = atomic  // ← Arrays should be added here
```

Arrays need `F.lazy()` because they recursively contain `fullExpression`:

```typescript
const arrayLiteral = F.lazy(() =>
  LBRACKET.drop()
    .then(/* elements using fullExpression */)
    .then(RBRACKET.drop())
).map(buildArrayNode)

const primary = F.tryAll([arrayLiteral, parenthesisExpression, atomicParser(tokens)])
```

### Test File Location

Create: `packages/runtime/src/compiler/parser/args-details/array-parser.spec.ts`

Follow patterns from:
- `literals-parser.spec.ts` - token-level tests
- `full-expression-parser.spec.ts` - integration tests

## Implementation Notes

### Token Addition

```typescript
// In ArgTokens interface:
LBRACKET: SingleParser<'['>
RBRACKET: SingleParser<']'>

// In createArgumentTokens():
const [LBRACKET, RBRACKET] = genlex.keywords(['[', ']'])

// Return:
LBRACKET: LBRACKET.map(leanToken) as SingleParser<'['>,
RBRACKET: RBRACKET.map(leanToken) as SingleParser<']'>,
```

### Grammar Sketch

```typescript
const arrayLiteral = LBRACKET
  .drop()
  .then(
    fullExpression
      .then(COMMA.drop().then(fullExpression).optrep())
      .opt()  // handles empty array
  )
  .then(RBRACKET.drop())
  .map(buildArrayNode)
```

### Primary Expression Update

```typescript
const primary = F.try(arrayLiteral)
  .or(F.try(parenthesizedExpression))
  .or(literal)
  .or(identifier)
```
