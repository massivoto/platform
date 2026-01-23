# PRD: Reserved Arguments (output, if)

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
| Requirements: AST Types | ✅ Complete | 3/3 |
| Requirements: Parser Tokens | ✅ Complete | 2/2 |
| Requirements: Reserved Arg Parsers | ✅ Complete | 4/4 |
| Requirements: Instruction Integration | ✅ Complete | 4/4 |
| Acceptance Criteria | ✅ Complete | 8/8 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Reserved Arguments & Output

## Child PRDs

- None

## Context

The DSL has "reserved arguments" that behave differently from regular arguments:

| Argument | Purpose | Value Type | Current State |
|----------|---------|------------|---------------|
| `output` | Store result in variable | Identifier only | Works via post-processing hack |
| `if` | Conditional execution | Expression (condition) | **Broken** - can't parse |

**The Problem:**

Reserved words like `if` are filtered out of the identifier parser to protect them for future control flow syntax. However, this also prevents them from being used as argument keys:

```typescript
// shared-parser.ts
const reservedWords = ['if', 'forEach', ...]
export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
  .filter((s) => !reservedWords.includes(s))  // <-- blocks if=
```

This means:
- `@cmd/run if=isActive` → Parser error (can't parse `if` as identifier)

**The Solution:**

Treat reserved arguments as **first-class parser constructs** with dedicated tokens and parsers. They are parsed with higher priority than regular arguments, have explicit type validation, and attach directly to `InstructionNode` in dedicated fields.

**Syntax Rule:** No spaces around `=` for any arguments. `key=value` is valid, `key = value` is rejected. This applies to both reserved args (`if=`, `output=`, `forEach=`) and regular args. See ROADMAP.md v0.5 "Syntax Strictness".

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-17 | A: Special tokens vs B: Two identifier types vs C: Remove from reserved | **A selected** | Clean separation, explicit validation, protects future control flow |
| 2026-01-17 | Store in args array vs dedicated fields | **Dedicated fields** | Type safety, no post-processing needed |
| 2026-01-17 | Allow spaces around `=` | **No spaces** | Strict syntax: `if=cond` only, reject `if = cond`. Simplifies parsing, no ambiguity. |
| 2026-01-17 | forEach reserved arg | **Deferred** | Requires MapperParser and IterationNode work first |
| 2026-01-17 | Gaps discovered | **Document and iterate** | output validation and strict whitespace need GenLex changes |

## Scope

**In scope:**
- New AST types for reserved arguments (`output`, `if`)
- Parser tokens for `output=`, `if=`
- Dedicated parsers with type validation
- InstructionNode fields for reserved args
- Remove post-processing from instruction-parser.ts

**Out of scope:**
- `forEach` reserved argument (requires MapperParser and IterationNode work)
- Block syntax `{ }` (separate PRD)
- Control flow statements `@if`, `@forEach` (separate PRD)
- New reserved arguments beyond output/if

## Requirements

### AST Types

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 3/3 (100%)

- ✅ R-RES-01: Add `OutputArgNode` type:
  ```typescript
  interface OutputArgNode {
    type: 'output-arg'
    target: IdentifierNode  // variable name to store result
  }
  ```

- ✅ R-RES-02: Add `IfArgNode` type:
  ```typescript
  interface IfArgNode {
    type: 'if-arg'
    condition: ExpressionNode  // any expression evaluating to boolean
  }
  ```

- ✅ R-RES-03: Add `ReservedArgNode` union type:
  ```typescript
  type ReservedArgNode = OutputArgNode | IfArgNode
  ```

### Parser Tokens

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 2/2 (100%)

- ✅ R-RES-21: Add `OUTPUT_KEY` token to `InstructionTokens`: `C.string('output=')` with priority 500
- ✅ R-RES-22: Add `IF_KEY` token to `InstructionTokens`: `C.string('if=')` with priority 500

> **Strict syntax:** Tokens use `C.string()` for literal matching (no whitespace). Priority 500 ensures they are tried BEFORE `IDENTIFIER` (1000) which would reject reserved words.

### Reserved Arg Parsers

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser/reserved-args.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-RES-41: `outputArg` parser: `OUTPUT_KEY` followed by `IDENTIFIER` only (reject expressions)
  > Fixed: Added `output` to reserved words in `shared-parser.ts`. Now `output=123` fails full parse.
- ✅ R-RES-42: `ifArg` parser: `IF_KEY` followed by any `expression`
- ✅ R-RES-43: `reservedArg` parser combines both with `F.try()` for backtracking
- ✅ R-RES-44: Reserved args have **higher priority** than regular args in instruction parsing

### Instruction Integration

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/compiler/parser/instruction-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-RES-61: Update `InstructionNode` with optional reserved arg fields:
  ```typescript
  interface InstructionNode {
    type: 'instruction'
    action: ActionNode
    args: ArgumentNode[]        // regular args only
    output?: IdentifierNode     // from OutputArgNode.target
    condition?: ExpressionNode  // from IfArgNode.condition
  }
  ```

- ✅ R-RES-62: Instruction parser tries `reservedArg` before `regularArg`
- ✅ R-RES-63: Reserved args extracted during parsing, not post-processing
- ✅ R-RES-64: Remove `extractOutputFromArgs()` function from instruction-parser.ts


## Dependencies

- **Depends on:** DSL 0.5 Parser (IMPLEMENTED)
- **Blocks:** Block parsing, Control flow statements

## Open Questions

- [ ] Should multiple reserved args be allowed? e.g., `@cmd/run if=cond output=result`
  - Proposal: Yes, order doesn't matter
- [ ] Error messages for invalid reserved arg values?
  - `output=123` → "output requires a variable name, got number"
  - `if="string"` → "if requires a condition expression"

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-RES-01: Given `@twitter/post message="hello" output=result`, when parsed, then `InstructionNode.output` is `IdentifierNode { value: "result" }` and `args` contains only `message`
- [x] AC-RES-02: Given `@twitter/post message="hello" if=isVerified`, when parsed, then `InstructionNode.condition` is `IdentifierNode { value: "isVerified" }`
- [x] AC-RES-03: Given `@twitter/post message="hello" if={followers > 100}`, when parsed, then `InstructionNode.condition` is `BinaryExpressionNode`
- [x] AC-RES-04: Given `@twitter/post output=123`, when parsed, then parser rejects (output must be identifier)
  > Fixed: `output` added to reserved words, full parse fails
- [x] AC-RES-05: Given `@twitter/post if = isActive` (with spaces), when parsed, then parser rejects (no spaces around `=`)
  > Works: `if` is reserved word, can't be used as regular arg key
- [x] AC-RES-06: Given `@twitter/post output =result` (space before `=`), when parsed, then parser rejects
  > Works: `output` is reserved word, can't be used as regular arg key
- [x] All automated tests pass (17 passing in reserved-args.spec.ts)

## Implementation Notes

### Token Architecture

Reserved arg tokens belong in `InstructionTokens` (not `ArgTokens`), following the same pattern as `ACTION`:

```typescript
// instruction-parser.ts
import { C } from '@masala/parser'

export interface InstructionTokens extends ArgTokens {
  ACTION: SingleParser<ActionNode>
  // Reserved argument tokens - match keyword+= as single token (no whitespace)
  OUTPUT_KEY: SingleParser<'output='>
  IF_KEY: SingleParser<'if='>
}

function getInstructionTokens(genlex: IGenLex): InstructionTokens {
  const actionParser = buildActionParser()

  return {
    ...createArgumentTokens(genlex),
    // ACTION has priority 3000
    ACTION: genlex.tokenize(actionParser, 'ACTION', 3000).map(leanToken),

    // Reserved args: priority 500 (lower = higher priority, tried before IDENTIFIER at 1000)
    // C.string() ensures no whitespace - literal match only
    OUTPUT_KEY: genlex.tokenize(C.string('output='), 'OUTPUT_KEY', 500).map(leanToken),
    IF_KEY: genlex.tokenize(C.string('if='), 'IF_KEY', 500).map(leanToken),
  }
}
```

### Priority Rationale

| Token | Priority | Why |
|-------|----------|-----|
| `OUTPUT_KEY` | 500 | Must be tried BEFORE IDENTIFIER (1000) rejects `output` |
| `IF_KEY` | 500 | Must be tried BEFORE IDENTIFIER (1000) rejects `if` |
| `IDENTIFIER` | 1000 | Regular identifiers (filters reserved words) |

Lower number = higher priority = tried first. Same pattern as `LTE` (500) vs `LT` (1000).

### Grammar Integration

```typescript
// In instruction parser
const outputArg = OUTPUT_KEY.drop().then(IDENTIFIER).map(buildOutputArgNode)
const ifArg = IF_KEY.drop().then(expression).map(buildIfArgNode)

const reservedArg = F.try(outputArg).or(ifArg)
const regularArg = createArgGrammar(tokens)

const anyArg = F.try(reservedArg).or(regularArg)
const instruction = ACTION.then(anyArg.optrep())
```

### Migration Path

1. Add new AST types to `ast.ts` (non-breaking)
2. Add reserved arg tokens to `InstructionTokens`
3. Create reserved arg parsers in instruction-parser.ts
4. Update instruction grammar to use reserved args
5. Update `InstructionNode` with dedicated fields
6. Update normalizers to read from new fields
7. Remove `extractOutputFromArgs()` function
8. Remove arg-searching logic from normalizers

### Test File Structure

```
packages/runtime/src/compiler/parser/
├── ast.ts                        # ✅ Updated: add ReservedArgNode types
├── instruction-parser.ts         # ✅ Updated: add tokens + parsers
├── instruction-parser.spec.ts    # Existing instruction tests
├── reserved-args.spec.ts         # ✅ New: dedicated reserved arg tests (17 tests passing)
├── shared-parser.ts              # ✅ Updated: added 'output' to reserved words
└── args-details/
    └── full-expression-parser.ts # ✅ Updated: added braced expression for if={expr}
```
