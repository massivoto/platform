# PRD: Single String Parser

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
| Requirements: AST | ✅ Complete | 2/2 |
| Requirements: Parser | ✅ Complete | 4/4 |
| Requirements: Integration | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 6/6 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [DSL 0.5 Parser](./dsl-0.5-parser.prd.md)

## Child PRDs

- [Mapper Expression](./mapper.prd.md) (planned - depends on this)

## Context

The DSL needs a way to represent **unquoted string literals** - strings that look like identifiers but are semantically literal values, not context references. This is critical for the upcoming mapper syntax:

```oto
users -> name      # 'name' is a SingleString (literal property name)
users -> user      # 'user' is a SingleString (iterator variable name)
```

Currently, `name` would parse as an `IdentifierNode`, which means "look up `name` in the execution context". But in mapper expressions, we want `name` to mean the literal string `"name"` - a property key to extract.

**The distinction matters for:**
1. **Evaluation**: IdentifierNode triggers context lookup; SingleStringNode is the literal value
2. **Editor coloring**: IdentifierNode = blue (variable); SingleStringNode = green (literal)
3. **Semantic clarity**: Makes the AST unambiguous about intent

The `SingleStringNode` type already exists in `ast.ts` (lines 45-48) but has no parser and is not included in expression unions.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Syntax: `'name'` vs `name` vs `:name` | **Unquoted `name`** | Cleaner syntax; context determines if it's SingleString or Identifier |
| 2026-01-20 | Standalone expression? | **No - context-sensitive only** | SingleString only valid after `->` operator; prevents ambiguity with Identifier |
| 2026-01-20 | Allow dots? `settings.theme` | **No** | SingleString is atomic; use chained mappers for nested access |
| 2026-01-20 | Allow reserved words? `-> true` | **No** | Too complex to debug; use `{arr\|mapping:"true"}` for reserved word properties |

## Scope

**In scope:**
- `SingleStringNode` AST type (already exists, verify/update)
- `singleString` parser combinator
- Integration point for mapper parser (export, not standalone)
- Token definition if needed

**Out of scope:**
- Mapper expression (`->` operator) - separate PRD
- forEach reserved argument - separate PRD
- Nested property access (`settings.theme`) - roadmap 1.5
- Dynamic property access (`-> {expr}`) - roadmap 1.5

## Requirements

### AST

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/interpreter/parser/args-details/single-string-parser.spec.ts`
**Progress:** 2/2 (100%)

- ✅ R-SS-01: Verify `SingleStringNode` interface in `ast.ts`:
  ```typescript
  interface SingleStringNode {
    type: 'single-string'
    value: string
  }
  ```

- ✅ R-SS-02: `SingleStringNode` is NOT added to `ExpressionNode` union
  - It's not a standalone expression
  - Only valid as part of `MapperExpressionNode.target`
  - This prevents accidental use as regular expression

### Parser

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/interpreter/parser/args-details/single-string-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-SS-21: Create `singleStringParser` that matches identifier pattern `[a-zA-Z_][a-zA-Z0-9_-]*`
  - Same pattern as identifier, produces `SingleStringNode`
  - DOES filter reserved words (same as identifier parser)
  - `true`, `false`, `if`, `output` are NOT valid SingleStrings
  - For reserved word properties, use pipe syntax: `{users|mapping:"if"}`

- ✅ R-SS-22: SingleString cannot contain dots
  - `name` ✓
  - `settings.theme` ✗ (rejected)
  - `user-name` ✓ (hyphens allowed, like identifiers)

- ✅ R-SS-23: SingleString cannot end with hyphen
  - `user-name` ✓
  - `user-` ✗ (same rule as identifiers)

- ✅ R-SS-24: Export `singleStringParser` for use by mapper parser
  - Not registered as standalone token in GenLex
  - Used compositionally by mapper parser

### Integration

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/interpreter/parser`
**Progress:** 3/3 (100%)

- ✅ R-SS-41: Create `single-string-parser.ts` in `args-details/` directory
  - Follows existing parser file organization

- ✅ R-SS-42: Export from parser index (if one exists) or directly importable

- ✅ R-SS-43: No changes to existing expression parsers
  - SingleString is deliberately NOT a valid standalone expression
  - Existing tests must continue to pass (173 tests passing)

## Why Not Just Reuse Identifier?

| Aspect | IdentifierNode | SingleStringNode |
|--------|----------------|------------------|
| **Semantics** | Context lookup | Literal value |
| **Evaluation** | `context.get(name)` | `name` itself |
| **Reserved words** | Filtered out | Filtered out (same) |
| **Editor color** | Blue (variable) | Green (literal) |
| **Use case** | `data=users` | `users -> name` |

The AST must distinguish these so the evaluator knows whether to look up a value or use it literally.

## Dependencies

- **Depends on:** None
- **Blocks:** Mapper Expression PRD, forEach PRD

## Open Questions

- [x] Should reserved words be valid SingleStrings? **No** - too complex to debug; use `{users|mapping:"if"}` for reserved word properties
- [x] Should we add syntax highlighting hints to the AST node? **Not yet**, for LSP later

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-SS-01: Given `singleStringParser.parse("name")`, when parsed, then result is `SingleStringNode { value: "name" }`
- [x] AC-SS-02: Given `singleStringParser.parse("user-name")`, when parsed, then result is `SingleStringNode { value: "user-name" }`
- [x] AC-SS-03: Given `singleStringParser.parse("true")`, when parsed, then parser rejects (reserved words not allowed)
- [x] AC-SS-04: Given `singleStringParser.parse("settings.theme")`, when parsed, then parser accepts "settings" only (stops before dot)
- [x] AC-SS-05: Given `singleStringParser.parse("user-")`, when parsed, then parser rejects (no trailing hyphen)
- [x] AC-SS-06: Existing identifier parser tests still pass (no regression - 173 tests passing)
- [x] All automated tests pass (13 single-string tests + 160 existing parser tests)
- [x] Edge cases covered in `single-string-parser.spec.ts`

## Implementation Notes

### Parser Structure

```typescript
// single-string-parser.ts
import { F } from '@masala/parser'
import { SingleStringNode } from '../ast.js'
import { identifier } from '../shared-parser.js'

// Reuse identifier parser (includes reserved word filtering)
// but map to SingleStringNode instead of IdentifierNode
export const singleStringParser = identifier
  .map((value): SingleStringNode => ({
    type: 'single-string',
    value,
  }))
```

### Key Difference from Identifier

The parser logic is identical - the difference is **semantic**:

```typescript
// IdentifierNode - evaluator looks up value in context
{ type: 'identifier', value: 'name' }  // -> context.get('name')

// SingleStringNode - evaluator uses the literal string
{ type: 'single-string', value: 'name' }  // -> "name"
```

Same syntax, different AST node, different evaluation behavior.

### Usage Preview (Mapper PRD)

```typescript
// In mapper parser (future)
const mapperExpression = expression
  .then(ARROW.drop())
  .then(singleStringParser)  // <-- uses SingleString, not identifier
  .map(buildMapperNode)
```
