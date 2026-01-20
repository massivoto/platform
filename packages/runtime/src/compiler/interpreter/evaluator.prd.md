# PRD: Expression Evaluator (Complete Node Coverage)

**Status:** IMPLEMENTED
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
| Requirements: Literal Nodes | Complete | 2/2 |
| Requirements: Member Access | Complete | 3/3 |
| Requirements: Unary Operators | Complete | 4/4 |
| Requirements: Binary Operators | Complete | 4/4 |
| Requirements: Logical Operators | Complete | 3/3 |
| Requirements: Array Literals | Complete | 2/2 |
| Requirements: Error Handling | Complete | 3/3 |
| Acceptance Criteria | Complete | 16/16 |
| Theme | Defined | - |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Evaluator

## Child PRDs

- None

## Context

The `ExpressionEvaluator` transforms AST expression nodes into runtime values. Currently, it only handles identifiers and basic literals (string, number, boolean). The parser produces a rich set of expression types (member access, unary, binary, logical, arrays) that the evaluator cannot process, causing runtime errors.

This gap blocks:
1. **Conditional execution**: `if={count > 5}` requires binary expression evaluation
2. **Complex arguments**: `msg={user.profile.name}` requires member access
3. **Computed values**: `total={price * quantity}` requires arithmetic evaluation

Completing node coverage enables the full expression language to work end-to-end.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Pipe evaluation | **Deferred** | Requires mapping functions (tweets->id), separate PRD |
| 2026-01-20 | Error strategy | **Throw with context** | LLM-readable errors with node type and path |
| 2026-01-20 | Null handling | **JavaScript semantics** | Follow JS behavior for null in operations |
| 2026-01-20 | Type coercion | **Strict for comparisons** | `5 == "5"` is false (no implicit coercion) |

## Scope

**In scope:**
- `literal-null` evaluation
- `member` expression (property access: `user.name`, `data.items.0`)
- `unary` operators: `!`, `-`, `+`
- `binary` operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `+`, `-`, `*`, `/`, `%`
- `logical` operators: `&&`, `||`
- `array-literal` evaluation
- Error messages with node context

**Out of scope:**
- `pipe` expressions (deferred - requires mapping infrastructure)
- Computed member access `obj[expr]` (AST has `computed: false`): no support for Computed member access, always keep `computed: false`
- Conditional expressions `a ? b : c` (commented out in AST)
- Type coercion for comparisons (strict equality only)

## Requirements

### Literal Nodes

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 2/2 (100%)

- [x] R-EVAL-01: Evaluate `literal-null` node -> returns `null`
- [x] R-EVAL-02: All existing literal tests still pass (string, number, boolean)

### Member Access

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-EVAL-21: Evaluate `member` node with identifier object -> `context.data.user.name` from `user.name`
- [x] R-EVAL-22: Evaluate `member` node with nested path -> `user.profile.settings.theme` works
- [x] R-EVAL-23: Return `undefined` for missing properties (don't throw)

### Unary Operators

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-EVAL-41: Evaluate `!` operator -> logical NOT on truthy/falsy values
- [x] R-EVAL-42: Evaluate `-` operator -> numeric negation
- [x] R-EVAL-43: Evaluate `+` operator -> numeric coercion (unary plus)
- [x] R-EVAL-44: Nested unary: `!!value` and `--5` work correctly

### Binary Operators

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-EVAL-61: Evaluate comparison operators: `==`, `!=`, `<`, `<=`, `>`, `>=`
  - Strict equality: `5 == "5"` is `false`
  - Null comparisons: `null == null` is `true`, `null == undefined` is `false`
- [x] R-EVAL-62: Evaluate arithmetic operators: `+`, `-`, `*`, `/`, `%`
  - String concatenation: `"hello" + " world"` -> `"hello world"`
  - Division by zero: returns `Infinity` or `-Infinity` (JS semantics)
- [x] R-EVAL-63: Evaluate nested binary: `(a + b) * c` respects AST structure
- [x] R-EVAL-64: Evaluate mixed: `count > 0 && count < 100` (binary inside logical)

### Logical Operators

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-EVAL-81: Evaluate `&&` operator -> short-circuit: returns first falsy or last value
- [x] R-EVAL-82: Evaluate `||` operator -> short-circuit: returns first truthy or last value
- [x] R-EVAL-83: Evaluate nested logical: `a && b || c` respects AST precedence

### Array Literals

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 2/2 (100%)

- [x] R-EVAL-101: Evaluate `array-literal` -> returns array of evaluated elements
- [x] R-EVAL-102: Evaluate nested arrays: `[[1, 2], [3, 4]]` works

### Error Handling

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/evaluator.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-EVAL-121: Unknown node type throws `EvaluationError` with node type in message
- [x] R-EVAL-122: Error messages are LLM-readable: include expression context, not just "failed"
- [x] R-EVAL-123: Create `EvaluationError` class extending `Error` with `nodeType` and `expression` properties

## Dependencies

- **Depends on:** Parser (AST types) - IMPLEMENTED
- **Blocks:**
  - CommandRegistry (needs evaluated args for routing)
  - Interpreter (needs evaluated conditions for `if=`)

## Open Questions

- [x] Type coercion for `==`? -> No, strict equality only
- [x] Null handling? -> JS semantics
- [x] Division by zero? -> JS semantics (Infinity)
- [x] Should `undefined` properties throw or return `undefined`? -> Return undefined (lenient)

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](../../parser/dsl-0.5-parser.prd.md)

### Criteria

**Member Access:**
- [x] AC-EVAL-01: Given context `{ user: { name: "Emma", followers: 1500 } }`, when evaluating `user.name`, then result is `"Emma"`
- [x] AC-EVAL-02: Given context `{ user: {} }`, when evaluating `user.profile.name`, then result is `undefined` (no error)

**Logical NOT (truthy/falsy):**
- [x] AC-EVAL-03: Given context `{ isVerified: false }`, when evaluating `!isVerified`, then result is `true`
- [x] AC-EVAL-04: Given context `{ isVerified: true }`, when evaluating `!isVerified`, then result is `false`
- [x] AC-EVAL-05: Given context `{ count: 0 }`, when evaluating `!count`, then result is `true` (0 is falsy)
- [x] AC-EVAL-06: Given context `{ count: 42 }`, when evaluating `!count`, then result is `false` (non-zero is truthy)
- [x] AC-EVAL-07: Given context `{ message: "" }`, when evaluating `!message`, then result is `true` (empty string is falsy)
- [x] AC-EVAL-08: Given context `{ message: "hello" }`, when evaluating `!message`, then result is `false` (non-empty string is truthy)
- [x] AC-EVAL-09: Given context `{ value: null }`, when evaluating `!value`, then result is `true` (null is falsy)
- [x] AC-EVAL-10: Given context `{ items: [] }`, when evaluating `!items`, then result is `false` (arrays are truthy)

**Binary & Arithmetic:**
- [x] AC-EVAL-11: Given context `{ user: { followers: 1500 } }`, when evaluating `user.followers > 1000`, then result is `true`
- [x] AC-EVAL-12: Given context `{ price: 10, quantity: 5 }`, when evaluating `price * quantity`, then result is `50`

**Logical Operators:**
- [x] AC-EVAL-13: Given context `{ hasAccess: true, isActive: true }`, when evaluating `hasAccess && isActive`, then result is `true`
- [x] AC-EVAL-14: Given context `{ hasAccess: false, isActive: true }`, when evaluating `hasAccess || isActive`, then result is `true`

**Array Literals:**
- [x] AC-EVAL-15: Given expression `[1, 2, 3]`, when evaluated, then result is array `[1, 2, 3]`

**General:**
- [x] AC-EVAL-16: All automated tests pass (69 tests in evaluator.spec.ts)

## Implementation Notes

### Implementation Complete

The `ExpressionEvaluator` class in `evaluators.ts` now handles all expression node types:

```typescript
// evaluators.ts (implemented)
export class EvaluationError extends Error {
  readonly nodeType: string
  readonly expression: ExpressionNode
  // LLM-readable error with context
}

export class ExpressionEvaluator {
  evaluate(expr: ExpressionNode, context: ExecutionContext): any {
    switch (expr.type) {
      case 'identifier': return context.data[expr.value]
      case 'literal-string':
      case 'literal-number':
      case 'literal-boolean': return expr.value
      case 'literal-null': return null
      case 'member': return this.evaluateMember(expr, context)
      case 'unary': return this.evaluateUnary(expr, context)
      case 'binary': return this.evaluateBinary(expr, context)
      case 'logical': return this.evaluateLogical(expr, context)
      case 'array-literal': return this.evaluateArrayLiteral(expr, context)
      case 'pipe-expression':
        throw new EvaluationError('Pipe expressions not yet supported', ...)
      default:
        throw new EvaluationError(`Unknown expression type: ${type}`, ...)
    }
  }
}
```

### Test File Structure

```
packages/runtime/src/compiler/interpreter/
├── evaluators.ts              # ExpressionEvaluator class + EvaluationError
└── evaluator.spec.ts          # 69 tests covering all requirements
```
