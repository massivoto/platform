# PRD: Block Parsing

**Status:** IMPLEMENTED
**Last updated:** 2026-01-19

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
| Requirements: Tokens | ✅ Complete | 3/3 |
| Requirements: Block Parser | ✅ Complete | 6/6 |
| Requirements: Statement Parser | ✅ Complete | 4/4 |
| Requirements: Program Parser | ✅ Complete | 4/4 |
| Requirements: Error Handling | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 10/10 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [DSL 0.5 Parser](./dsl-0.5-parser.prd.md)

## Child PRDs

- None

## Context

The current parser handles single instructions only. To support complex workflows, we need:

1. **Program parsing**: Multiple statements separated by newlines
2. **Block parsing**: Grouped statements with `@block/begin` ... `@block/end`
3. **Statement parsing**: Abstraction over instructions and blocks

Blocks enable:
- Logical grouping of related instructions
- Scoping for variables (future)
- Conditional execution of multiple statements (`if=`)
- Foundation for `@forEach`, `@if`, `@while` control flow (future PRDs)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Current vs Target                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CURRENT:  Source ──► Instruction Parser ──► InstructionNode           │
│                                                                         │
│  TARGET:   Source ──► Program Parser ──► ProgramNode                   │
│                              │               └── body: StatementNode[] │
│                              │                         ├── Instruction │
│                              │                         └── Block       │
│                              │                               └── body  │
│                              └── Statement Parser (recursive)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-19 | `@begin/block` vs `@block/begin` | **`@block/begin`** | Consistent with OTO `@package/action` pattern |
| 2026-01-19 | Statement separator | **Newline** | Python-like readability, no semicolons |
| 2026-01-19 | Block nesting | **Allowed** | Required for complex workflows |
| 2026-01-19 | Block naming | **Optional `name=` arg** | Standard OTO syntax, useful for debugging |
| 2026-01-19 | Conditional blocks | **`if=` supported** | Consistent with instruction-level `if=` |
| 2026-01-19 | Comments | **Deferred** | Separate PRD for `//` and `/* */` |

## Scope

**In scope:**
- `@block/begin` and `@block/end` action tokens
- Optional `name="label"` argument on `@block/begin`
- Optional `if=expression` argument on `@block/begin` (conditional block)
- Newline-separated statements within blocks
- Nested blocks (blocks containing blocks)
- Empty blocks (valid edge case)
- `ProgramNode` as root AST node
- `StatementNode` union type (instruction | block)
- Error reporting for unclosed blocks with line numbers

**Out of scope:**
- Line comments `//` (separate PRD)
- Block comments `/* */` (separate PRD)
- `@forEach/begin` ... `@forEach/end` (separate PRD, depends on this)
- `@if/begin` ... `@if/end` (separate PRD, depends on this)
- `@while/begin` ... `@while/end` (separate PRD, depends on this)
- Semicolon as statement separator
- Inline blocks `{ statement; statement }`

## Requirements

### AST Types

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 3/3 (100%)

- ✅ R-BLK-01: Update `BlockNode` interface to include optional `name` field:
  ```typescript
  interface BlockNode {
    type: 'block'
    name?: string              // from name="label" argument
    condition?: ExpressionNode // from if=expression argument
    body: StatementNode[]
  }
  ```

- ✅ R-BLK-02: `StatementNode` union type already exists: `InstructionNode | BlockNode | TemplateNode`
  - Verified exported and usable by parsers

- ✅ R-BLK-03: `ProgramNode` interface already exists:
  ```typescript
  interface ProgramNode {
    type: 'program'
    body: StatementNode[]
  }
  ```
  - Verified exported and usable by parsers

### Tokens

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-BLK-21: Detect `@block/begin` via ActionNode filtering
  - Recognized as ActionNode with `package: "block"`, `name: "begin"`
  - Uses existing ACTION token, detected via `isBlockBegin()` helper

- ✅ R-BLK-22: Detect `@block/end` via ActionNode filtering
  - Recognized as ActionNode with `package: "block"`, `name: "end"`
  - `@block/end` takes no arguments (closes nearest open block)

- ✅ R-BLK-23: Newline handling via line splitting
  - Two-pass approach: split by `\r?\n`, parse each line
  - Multiple consecutive newlines (empty lines) skipped
  - Leading/trailing newlines handled correctly

### Block Parser

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 6/6 (100%)

- ✅ R-BLK-41: `@block/begin` starts a block, `@block/end` closes it
  ```oto
  @block/begin
    @api/call endpoint="/users" output=users
    @log/print msg=users
  @block/end
  ```

- ✅ R-BLK-42: `@block/begin` accepts optional `name="label"` argument
  ```oto
  @block/begin name="setup"
    @api/call endpoint="/config" output=config
  @block/end
  ```
  - `name` extracted from args, must be string literal

- ✅ R-BLK-43: `@block/begin` accepts optional `if=expression` argument for conditional execution
  ```oto
  @block/begin name="admin-section" if=isAdmin
    @admin/dashboard
    @admin/stats output=stats
  @block/end
  ```
  - `if` uses instruction.condition (reserved arg pattern)

- ✅ R-BLK-44: Blocks can be nested to arbitrary depth
  ```oto
  @block/begin name="outer"
    @setup/init
    @block/begin name="inner"
      @process/data input=raw output=processed
    @block/end
    @cleanup/finalize
  @block/end
  ```

- ✅ R-BLK-45: Empty blocks are valid
  ```oto
  @block/begin name="placeholder"
  @block/end
  ```

- ✅ R-BLK-46: Block parsing uses stack-based approach for nesting
  - BlockContext stack tracks open blocks
  - No F.lazy() needed - iterative line-by-line parsing

### Statement Parser

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-BLK-61: Statement is either a block or an instruction
  - Detected via `isBlockBegin()` / `isBlockEnd()` helpers
  - Blocks built via stack, instructions added directly

- ✅ R-BLK-62: Statements are separated by one or more newlines
  ```oto
  @first/action arg=1
  @second/action arg=2

  @third/action arg=3
  ```
  - Multiple blank lines between statements skipped

- ✅ R-BLK-63: Whitespace (spaces, tabs) within a line does not affect parsing
  - Lines trimmed before parsing, indentation is cosmetic

- ✅ R-BLK-64: Statement parser handles mixed instructions and blocks
  ```oto
  @setup/init
  @block/begin name="process"
    @process/data
  @block/end
  @cleanup/done
  ```

### Program Parser

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/program-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-BLK-81: Program is a sequence of newline-separated statements
  - Two-pass approach: split by newlines, parse each line as instruction

- ✅ R-BLK-82: Empty program (no statements) produces `ProgramNode` with empty `body`

- ✅ R-BLK-83: Program with single instruction produces `ProgramNode` with one `InstructionNode`
  - Backwards compatible with current single-instruction parsing

- ✅ R-BLK-84: Leading and trailing newlines are ignored
  ```oto

  @first/action
  @second/action

  ```
  - Produces 2 statements, not errors

### Error Handling

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 3/3 (100%)

> **Note:** Line/column tracking is deferred to v1.5 (LSP integration). Errors include line numbers where block started.

- ✅ R-BLK-101: Unclosed block produces descriptive error with line number
  ```
  Error: Unclosed block (missing @block/end) - block started at line 1
  ```

- ✅ R-BLK-102: Unexpected `@block/end` without matching `@block/begin` produces error
  ```
  Error: Unexpected @block/end at line 2 (no matching @block/begin)
  ```

- ✅ R-BLK-103: Parse errors include line number context
  - Leverages existing instruction parser error handling

## Dependencies

- **Depends on:**
  - DSL 0.5 Parser (IMPLEMENTED)
  - Reserved Arguments PRD (IMPLEMENTED) - reuse `if=` pattern
- **Blocks:**
  - `@forEach/begin` control flow
  - `@if/begin` control flow
  - `@while/begin` control flow
  - Comments parsing (can proceed in parallel)

## Open Questions

- [x] Should blocks support `if=`? → **Yes**, confirmed
- [x] What error for unclosed blocks? → **"Unclosed block (missing @block/end)"** (no line numbers for now)
- [x] Comments in same PRD? → **No**, separate PRD
- [x] Should `@block/end` accept a name? → **No**, `@block/end` takes no arguments; closes nearest open block
- [x] Should we track column numbers for errors? → **Deferred to v1.5 LSP** (added to ROADMAP)

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-BLK-01: Given a program with two instructions separated by newline, when parsed, then `ProgramNode.body` has 2 `InstructionNode` elements
- [x] AC-BLK-02: Given `@block/begin` followed by instruction and `@block/end`, when parsed, then `BlockNode` contains the instruction in `body`
- [x] AC-BLK-03: Given `@block/begin name="setup"`, when parsed, then `BlockNode.name` is `"setup"`
- [x] AC-BLK-04: Given `@block/begin if=isAdmin`, when parsed, then `BlockNode.condition` is `IdentifierNode { value: "isAdmin" }`
- [x] AC-BLK-05: Given nested blocks, when parsed, then outer `BlockNode.body` contains inner `BlockNode`
- [x] AC-BLK-06: Given empty block, when parsed, then `BlockNode.body` is empty array
- [x] AC-BLK-07: Given `@block/begin` without `@block/end`, when parsed, then error mentions "Unclosed block" and line number
- [x] AC-BLK-08: Given `@block/end` without `@block/begin`, when parsed, then error mentions "Unexpected @block/end"
- [x] AC-BLK-09: Given program with mixed instructions and blocks, when parsed, then `ProgramNode.body` contains both types in order
- [x] AC-BLK-10: Given single instruction (no blocks), when parsed, then result is backwards-compatible `ProgramNode` with one instruction
- [x] All automated tests pass (29 tests: 14 program + 15 block)
- [ ] Edge cases covered in `block-parser.edge.spec.ts` (deferred)

## Implementation Notes

### File Structure (Actual)

```
packages/runtime/src/compiler/parser/
├── ast.ts                        # UPDATED: BlockNode with name, condition
├── program-parser.ts             # UPDATED: handles blocks via stack-based parsing
├── program-parser.spec.ts        # 14 tests for multi-line programs
├── block-parser.spec.ts          # 15 tests for block parsing
└── instruction-parser.ts         # UNCHANGED
```

Note: No separate `statement-parser.ts` or `block-parser.ts` needed - block detection integrated into `program-parser.ts` using a simpler two-pass approach.

### Implementation Approach

```typescript
// program-parser.ts - Stack-based block parsing
function parseStatements(lines: string[]): StatementNode[] {
  const blockStack: BlockContext[] = []

  for (const line of lines) {
    const instruction = parseInstruction(line)

    if (isBlockBegin(instruction)) {
      blockStack.push({ name, condition, body: [], startLine })
    } else if (isBlockEnd(instruction)) {
      const block = blockStack.pop()
      // Add to parent block or root
    } else {
      // Add to current block or root
    }
  }
}

// block-parser.ts
const blockBegin = ACTION.filter(isBlockBegin)
  .then(F.try(nameArg).opt())
  .then(F.try(ifArg).opt())

const blockEnd = ACTION.filter(isBlockEnd)

const block = blockBegin
  .then(NEWLINE.rep())
  .then(statement.then(NEWLINE.rep()).optrep())
  .then(blockEnd)
  .map(buildBlockNode)
```

### Token Detection

Rather than adding new token types, detect `@block/begin` and `@block/end` by filtering ActionNode:

```typescript
function isBlockBegin(action: ActionNode): boolean {
  return action.package === 'block' && action.name === 'begin'
}

function isBlockEnd(action: ActionNode): boolean {
  return action.package === 'block' && action.name === 'end'
}
```

### Error Handling (v0.5)

For v0.5, errors are descriptive but without source positions:

```typescript
// Simple error format for now
throw new Error('Unclosed block (missing @block/end)')
throw new Error('Unexpected @block/end (no matching @block/begin)')
```

Line/column tracking will be added in v1.5 with LSP integration (see ROADMAP.md).
