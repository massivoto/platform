# PRD: Block Parsing

**Status:** DRAFT
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
| Requirements: AST Types | ❌ Not Started | 0/3 |
| Requirements: Tokens | ❌ Not Started | 0/3 |
| Requirements: Block Parser | ❌ Not Started | 0/6 |
| Requirements: Statement Parser | ❌ Not Started | 0/4 |
| Requirements: Program Parser | ✅ Complete | 4/4 |
| Requirements: Error Handling | ❌ Not Started | 0/3 |
| Acceptance Criteria | ⏳ In Progress | 2/10 |
| **Overall** | **DRAFT** | **0%** |

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
**Progress:** 0/3 (0%)

- ❌ R-BLK-01: Update `BlockNode` interface to include optional `name` field:
  ```typescript
  interface BlockNode {
    type: 'block'
    name?: string              // from name="label" argument
    condition?: ExpressionNode // from if=expression argument
    body: StatementNode[]
  }
  ```

- ❌ R-BLK-02: `StatementNode` union type already exists: `InstructionNode | BlockNode | TemplateNode`
  - Verify it's exported and usable by parsers

- ❌ R-BLK-03: `ProgramNode` interface already exists:
  ```typescript
  interface ProgramNode {
    type: 'program'
    body: StatementNode[]
  }
  ```
  - Verify it's exported and usable by parsers

### Tokens

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 0/3 (0%)

- ❌ R-BLK-21: Add `BLOCK_BEGIN` token matching `@block/begin` action pattern
  - Must be recognized as an ActionNode with `package: "block"`, `name: "begin"`
  - Priority must be same as regular ACTION token

- ❌ R-BLK-22: Add `BLOCK_END` token matching `@block/end` action pattern
  - Must be recognized as an ActionNode with `package: "block"`, `name: "end"`
  - `@block/end` takes no arguments (closes nearest open block)

- ❌ R-BLK-23: Add `NEWLINE` token for statement separation
  - Matches `\n` or `\r\n`
  - Multiple consecutive newlines treated as single separator
  - Leading/trailing newlines in program are optional

### Block Parser

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/block-parser.spec.ts`
**Progress:** 0/6 (0%)

- ❌ R-BLK-41: `@block/begin` starts a block, `@block/end` closes it
  ```oto
  @block/begin
    @api/call endpoint="/users" output=users
    @log/print msg=users
  @block/end
  ```

- ❌ R-BLK-42: `@block/begin` accepts optional `name="label"` argument
  ```oto
  @block/begin name="setup"
    @api/call endpoint="/config" output=config
  @block/end
  ```
  - `name` must be a string literal, not an expression

- ❌ R-BLK-43: `@block/begin` accepts optional `if=expression` argument for conditional execution
  ```oto
  @block/begin name="admin-section" if=isAdmin
    @admin/dashboard
    @admin/stats output=stats
  @block/end
  ```
  - `if` follows same rules as instruction-level `if=`

- ❌ R-BLK-44: Blocks can be nested to arbitrary depth
  ```oto
  @block/begin name="outer"
    @setup/init
    @block/begin name="inner"
      @process/data input=raw output=processed
    @block/end
    @cleanup/finalize
  @block/end
  ```

- ❌ R-BLK-45: Empty blocks are valid
  ```oto
  @block/begin name="placeholder"
  @block/end
  ```

- ❌ R-BLK-46: Block parser uses `F.lazy()` for recursive statement parsing

### Statement Parser

**Last updated:** 2026-01-19
**Test:** `npx vitest run packages/runtime/src/compiler/parser/statement-parser.spec.ts`
**Progress:** 0/4 (0%)

- ❌ R-BLK-61: Statement is either a block or an instruction
  ```typescript
  const statement = F.try(block).or(instruction)
  ```

- ❌ R-BLK-62: Statements are separated by one or more newlines
  ```oto
  @first/action arg=1
  @second/action arg=2

  @third/action arg=3
  ```
  - Multiple blank lines between statements are valid

- ❌ R-BLK-63: Whitespace (spaces, tabs) within a line does not affect parsing
  - Indentation is cosmetic, not semantic (unlike Python)

- ❌ R-BLK-64: Statement parser handles mixed instructions and blocks
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
**Progress:** 0/3 (0%)

> **Note:** Line/column tracking is deferred to v1.5 (LSP integration). For now, errors describe the problem without source positions.

- ❌ R-BLK-101: Unclosed block produces descriptive error
  ```
  Error: Unclosed block (missing @block/end)
  ```

- ❌ R-BLK-102: Unexpected `@block/end` without matching `@block/begin` produces error
  ```
  Error: Unexpected @block/end (no matching @block/begin)
  ```

- ❌ R-BLK-103: `@block/begin` with invalid arguments produces clear error
  ```oto
  @block/begin name=123
  ```
  ```
  Error: @block/begin name must be a string literal, got number
  ```

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
- [ ] AC-BLK-02: Given `@block/begin` followed by instruction and `@block/end`, when parsed, then `BlockNode` contains the instruction in `body`
- [ ] AC-BLK-03: Given `@block/begin name="setup"`, when parsed, then `BlockNode.name` is `"setup"`
- [ ] AC-BLK-04: Given `@block/begin if=isAdmin`, when parsed, then `BlockNode.condition` is `IdentifierNode { value: "isAdmin" }`
- [ ] AC-BLK-05: Given nested blocks, when parsed, then outer `BlockNode.body` contains inner `BlockNode`
- [ ] AC-BLK-06: Given empty block, when parsed, then `BlockNode.body` is empty array
- [ ] AC-BLK-07: Given `@block/begin` without `@block/end`, when parsed, then error mentions "Unclosed block" and line number
- [ ] AC-BLK-08: Given `@block/end` without `@block/begin`, when parsed, then error mentions "Unexpected @block/end"
- [ ] AC-BLK-09: Given program with mixed instructions and blocks, when parsed, then `ProgramNode.body` contains both types in order
- [x] AC-BLK-10: Given single instruction (no blocks), when parsed, then result is backwards-compatible `ProgramNode` with one instruction
- [ ] All automated tests pass
- [ ] Edge cases covered in `block-parser.edge.spec.ts`

## Implementation Notes

### File Structure

```
packages/runtime/src/compiler/parser/
├── ast.ts                        # Update BlockNode
├── program-parser.ts             # NEW: entry point for multi-statement parsing
├── program-parser.spec.ts        # NEW: program-level tests
├── statement-parser.ts           # NEW: statement = block | instruction
├── statement-parser.spec.ts      # NEW: statement-level tests
├── block-parser.ts               # NEW: @block/begin ... @block/end
├── block-parser.spec.ts          # NEW: block-level tests
├── block-parser.edge.spec.ts     # NEW: edge cases
└── instruction-parser.ts         # UNCHANGED
```

### Grammar Sketch

```typescript
// program-parser.ts
const program = statement
  .then(NEWLINE.rep().then(statement).optrep())
  .then(NEWLINE.optrep())  // trailing newlines
  .map(buildProgramNode)

// statement-parser.ts
const statement = F.lazy(() => F.try(block).or(instruction))

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
