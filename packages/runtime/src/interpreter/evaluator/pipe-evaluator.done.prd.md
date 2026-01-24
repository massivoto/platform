# PRD: Pipe Expression Evaluator

**Status:** IMPLEMENTED
**Last updated:** 2026-01-23
**Target Version:** 0.5

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: Core Pipes | ✅ Complete | 6/6 |
| Requirements: Additional Pipes | ✅ Complete | 4/4 |
| Requirements: Pipe Arguments | ✅ Complete | 4/4 |
| Requirements: Chaining | ✅ Complete | 3/3 |
| Requirements: Error Handling | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 17/17 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [evaluator.prd.md](./evaluator.prd.md) - Expression Evaluator (IMPLEMENTED)
- [core-pipes.prd.md](../pipe-registry/core-pipes.prd.md) - PipeRegistry + CorePipesBundle (IMPLEMENTED)
- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Pipe evaluation

## Child PRDs

- None

## Context

The parser produces `PipeExpressionNode` for expressions like `{users | filter:active:true | map:name}`.
The evaluator currently throws "Pipe expressions not yet supported" for this node type.

Pipe expressions are essential for data transformation in automation workflows:

```oto
@utils/set output=activeNames value={users | filter:active:true | map:name}
@utils/set output=summary value={items | first}
@email/send body={messages | join:"\n"}
```

Without pipe support, users must write verbose intermediate steps or rely on commands
for simple transformations.

## Decision Log

| Date | Option | Decision                 | Rationale |
|------|--------|--------------------------|-----------|
| 2026-01-22 | Built-in vs registry | **Registry done**        |  |
| 2026-01-22 | Argument semantics | **Two-arg for filter** | `filter:propName:value` - property name and value to match |
| 2026-01-22 | Predicate functions | **NO**                   | Complex predicates like `filter:x => x > 5` not needed |
| 2026-01-22 | Async pipes | **All pipes async**      | Consistent with async evaluator, enables future async pipes |
| 2026-01-22 | join default | **","** | Default separator is comma if omitted |
| 2026-01-22 | slice indices | **Positive only** | Negative indices deferred, keep simple for v0.5 |
| 2026-01-22 | unique comparison | **Set-based** | Uses JavaScript Set internally; primitives by value, objects by reference |

## Scope


- PipeRegistry pattern: done
- 
**In scope:**
- Evaluate `pipe-expression` nodes
- Built-in pipes: `filter`, `map`, `first`, `last`, `join`, `length`, `flatten`, `reverse` and others
- Pipe chaining (result of one pipe feeds into next) : not sure it's possible form the parser, to be defined
- Error handling with context

**Out of scope:**
- Custom user pipes (v1.0)
- Predicate functions `filter:x => x.count > 5` (v1.0)
- Async data-fetching pipes (v1.0)
- `sort` pipe (requires comparator, defer to later)
- Mapper expressions in pipe arguments `filter:active->true` (v1.5)

## Requirements

### Core Pipes

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/evaluator.spec.ts`
**Progress:** 6/6 (100%)

- [x] R-PIPE-01: `filter:propName:value` - returns array of items where `item[propName]` equals `value`
- [x] R-PIPE-02: `map:propName` - returns array of `item[propName]` for each item
- [x] R-PIPE-03: `first` - returns first element of array, or `undefined` if empty
- [x] R-PIPE-04: `last` - returns last element of array, or `undefined` if empty
- [x] R-PIPE-05: `join:separator` - joins array elements with separator (default: `","` if omitted)
- [x] R-PIPE-06: `length` - returns length of array (or string)

### Additional Pipes

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-PIPE-21: `flatten` - flattens one level of nested arrays
- [x] R-PIPE-22: `reverse` - returns reversed array (new array, not mutate)
- [x] R-PIPE-23: `slice:start:end` - returns array slice; `end` optional; positive integers only (v0.5)
- [x] R-PIPE-24: `unique` - returns array with duplicates removed (primitives by value, objects by reference)

### Pipe Arguments

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/evaluator.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-PIPE-41: Pipe arguments are evaluated as expressions before being passed to pipe
- [x] R-PIPE-42: `filter:active:true` - first arg is property name, second is value to match
- [x] R-PIPE-43: Identifier args resolve from context: `filter:field:expected` uses `field` and `expected` values
- [x] R-PIPE-44: Multiple arguments supported: `slice:0:5` passes `[0, 5]` to slice pipe

### Chaining

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/evaluator.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-PIPE-61: Pipes chain left-to-right: `{a | p1 | p2}` = `p2(p1(a))`
- [x] R-PIPE-62: Input to first pipe is evaluated expression
- [x] R-PIPE-63: Each subsequent pipe receives output of previous pipe

### Error Handling

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/evaluator.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-PIPE-81: Unknown pipe name throws `EvaluationError` with pipe name in message
- [x] R-PIPE-82: Type mismatch (e.g., `filter` on non-array) throws descriptive error
- [x] R-PIPE-83: Missing required argument throws error with pipe signature hint

## Implementation

### Evaluator Integration

```typescript
// evaluators.ts - add to evaluate() switch
case 'pipe-expression':
  return this.evaluatePipe(expr, context)

// New method
private async evaluatePipe(
  expr: PipeExpressionNode,
  context: ExecutionContext,
): Promise<any> {
  // 1. Evaluate input expression
  let current = await this.evaluate(expr.input, context)

  // 2. Chain through each segment
  for (const segment of expr.segments) {
    const args = await Promise.all(
      segment.args.map(arg => this.evaluate(arg, context))
    )
    current = await this.applyPipe(segment.pipeName, current, args, context)
  }

  return current
}

private async applyPipe(
  pipeName: string,
  input: any,
  args: any[],
  context: ExecutionContext,
): Promise<any> {
  switch (pipeName) {
    case 'filter':
      return this.pipeFilter(input, args)
    case 'map':
      return this.pipeMap(input, args)
    case 'first':
      return Array.isArray(input) ? input[0] : undefined
    case 'last':
      return Array.isArray(input) ? input[input.length - 1] : undefined
    case 'join':
      return Array.isArray(input) ? input.join(args[0] ?? ',') : String(input)
    case 'length':
      return input?.length ?? 0
    case 'flatten':
      return Array.isArray(input) ? input.flat() : [input]
    case 'reverse':
      return Array.isArray(input) ? [...input].reverse() : input
    case 'slice':
      return this.pipeSlice(input, args)
    case 'unique':
      return this.pipeUnique(input)
    default:
      throw new EvaluationError(`Unknown pipe: ${pipeName}`, 'pipe-expression', ...)
  }
}

private pipeFilter(input: any[], args: any[]): any[] {
  if (!Array.isArray(input)) {
    throw new EvaluationError('filter requires array input', ...)
  }
  const [propName, expectedValue] = args
  if (typeof propName !== 'string') {
    throw new EvaluationError('filter requires property name as first argument', ...)
  }
  if (args.length < 2) {
    throw new EvaluationError('filter requires value as second argument', ...)
  }
  return input.filter(item => item?.[propName] === expectedValue)
}

private pipeMap(input: any[], args: any[]): any[] {
  if (!Array.isArray(input)) {
    throw new EvaluationError('map requires array input', ...)
  }
  const propName = args[0]
  if (typeof propName !== 'string') {
    throw new EvaluationError('map requires property name argument', ...)
  }
  return input.map(item => item?.[propName])
}

private pipeSlice(input: any[], args: any[]): any[] {
  if (!Array.isArray(input)) {
    throw new EvaluationError('slice requires array input', ...)
  }
  const start = args[0] ?? 0
  const end = args[1] // undefined means slice to end
  if (typeof start !== 'number' || (end !== undefined && typeof end !== 'number')) {
    throw new EvaluationError('slice requires numeric arguments', ...)
  }
  return input.slice(start, end)
}

private pipeUnique(input: any[]): any[] {
  if (!Array.isArray(input)) {
    throw new EvaluationError('unique requires array input', ...)
  }
  // Set-based: primitives by value, objects by reference
  return [...new Set(input)]
}
```

## Dependencies

- **Depends on:**
  - Async evaluator (IMPLEMENTED)
  - Pipe parser (IMPLEMENTED)
  - PipeRegistry + CorePipesBundle (IMPLEMENTED)
- **Blocks:**
  - Complex automation workflows
  - Data transformation in OTO programs

## Parser Edge Cases

These cases were verified during implementation:

| Expression | Expected | Status |
|------------|----------|--------|
| `{items \| join:":"}` | Join with colon separator | ✅ Verified |
| `{items \| join:", "}` | Join with comma-space | ✅ Verified |
| `{items \| join:""}` | Join with empty string | ✅ Verified |
| `{items \| slice:0:5}` | Two numeric args | ✅ Verified |

## Open Questions

- [x] Should `filter:active` treat `active` as literal string or resolve from context?
  - **Resolved:** Use two-arg syntax `filter:propName:value`. Identifiers resolve from context.
- [x] Should pipes work on non-arrays? (e.g., `"hello" | length`)
  - **Resolved:** Yes, `length` works on strings and objects (key count). Other pipes (join, filter, etc.) throw descriptive type errors.
- [ ] Should we add `take:n` as alias for `slice:0:n`?
  - **Deferred to v1.0:** Nice-to-have, not critical for v0.5.

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [evaluator.prd.md](./evaluator.prd.md)

### Criteria

**Filter & Map:**
- [x] AC-PIPE-01: Given `users = [{name:"Emma",active:true},{name:"Bob",active:false}]`, when evaluating `{users | filter:active:true}`, then result is `[{name:"Emma",active:true}]`
- [x] AC-PIPE-02: Given same users, when evaluating `{users | map:name}`, then result is `["Emma", "Bob"]`
- [x] AC-PIPE-03: Given same users, when evaluating `{users | filter:active:true | map:name}`, then result is `["Emma"]`

**First & Last:**
- [x] AC-PIPE-04: Given `items = [1, 2, 3]`, when evaluating `{items | first}`, then result is `1`
- [x] AC-PIPE-05: Given same items, when evaluating `{items | last}`, then result is `3`
- [x] AC-PIPE-06: Given `items = []`, when evaluating `{items | first}`, then result is `undefined`

**Join & Length:**
- [x] AC-PIPE-07: Given `names = ["Alice", "Bob"]`, when evaluating `{names | join:", "}`, then result is `"Alice, Bob"`
- [x] AC-PIPE-08: Given same names, when evaluating `{names | length}`, then result is `2`
- [x] AC-PIPE-13: Given same names, when evaluating `{names | join}`, then result is `"Alice,Bob"` (default separator)
- [x] AC-PIPE-14: Given `parts = ["a", "b", "c"]`, when evaluating `{parts | join:":"}`, then result is `"a:b:c"`

**Slice & Unique:**
- [x] AC-PIPE-15: Given `items = [1, 2, 3, 4, 5]`, when evaluating `{items | slice:1:3}`, then result is `[2, 3]`
- [x] AC-PIPE-16: Given same items, when evaluating `{items | slice:2}`, then result is `[3, 4, 5]`
- [x] AC-PIPE-17: Given `items = [1, 2, 2, 3, 1]`, when evaluating `{items | unique}`, then result is `[1, 2, 3]`

**Chaining:**
- [x] AC-PIPE-09: Given users array, when evaluating `{users | filter:active:true | map:name | first}`, then result is `"Emma"`

**Errors:**
- [x] AC-PIPE-10: Given `count = 5`, when evaluating `{count | filter:x:true}`, then throws EvaluationError mentioning "filter requires array"
- [x] AC-PIPE-11: Given users, when evaluating `{users | unknownPipe}`, then throws EvaluationError mentioning "Unknown pipe: unknownPipe"

**General:**
- [x] AC-PIPE-12: All existing evaluator tests still pass (140 tests)

## Test File Structure

```
packages/runtime/src/interpreter/evaluator/
├── evaluators.ts              # UPDATE: add evaluatePipe method
├── evaluator.spec.ts          # UPDATE: add pipe evaluation tests
└── pipe-evaluator.prd.md      # NEW: this PRD
```
