# PRD: Comments

**Status:** IMPLEMENTED
**Last updated:** 2026-01-20

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | 100% |
| Scope | Complete | 100% |
| Requirements: Line Comments | Complete | 3/3 |
| Requirements: Block Comments | Complete | 4/4 |
| Requirements: String Awareness | Complete | 3/3 |
| Requirements: Error Handling | Complete | 2/2 |
| Acceptance Criteria | Complete | 8/8 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [DSL 0.5 Parser](./dsl-0.5-parser.prd.md)

## Child PRDs

- None

## Context

OTO programs need comments for documentation and debugging. Two comment styles are standard:

1. **Line comments** (`//`): Ignore everything from `//` to end of line
2. **Block comments** (`/* */`): Ignore everything between delimiters, can span lines

The critical requirement is that comment markers inside string literals must NOT be treated as comments:

```oto
@log/print msg="Visit https://example.com"  // URL is NOT a comment
@log/print msg="a /* b */ c"                // Content preserved, not stripped
```

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | Regex vs State Machine | **State Machine** | Must respect string literal boundaries |
| 2026-01-20 | Nested block comments | **Not supported** | Standard behavior (C, Java, JS, etc.) |
| 2026-01-20 | Unclosed block comment | **Error** | Fail fast, don't silently ignore |
| 2026-01-20 | Implementation location | **Pre-processor** | Strip before line splitting in program-parser |

## Scope

**In scope:**
- Line comments: `// comment to end of line`
- Block comments: `/* comment across lines */`
- String-aware: comments inside `"..."` are NOT stripped
- Unclosed block comment detection
- Integration with program-parser

**Out of scope:**
- Doc comments (`/** ... */`) with special semantics
- Nested block comments (`/* /* */ */`)
- Comment preservation for LSP (deferred to v1.5)
- Single-quoted strings (OTO uses double quotes only)

## Requirements

### Line Comments

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/comments.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-CMT-01: `//` starts a line comment, everything after is ignored
  ```oto
  @api/call endpoint="/users"  // fetch all users
  ```
  Produces instruction without the comment.

- [x] R-CMT-02: Line with only comment produces no statement
  ```oto
  // This is a comment-only line
  @api/call endpoint="/users"
  ```
  Produces single instruction.

- [x] R-CMT-03: `//` at start of line comments entire line
  ```oto
  // @api/call endpoint="/disabled"
  @api/call endpoint="/active"
  ```
  Produces single instruction (disabled line ignored).

### Block Comments

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/comments.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-CMT-21: `/*` starts block comment, `*/` ends it
  ```oto
  @api/call /* inline comment */ endpoint="/users"
  ```
  Produces instruction with endpoint arg.

- [x] R-CMT-22: Block comments can span multiple lines
  ```oto
  /*
   * Multi-line comment
   * describing the workflow
   */
  @api/call endpoint="/users"
  ```
  Produces single instruction.

- [x] R-CMT-23: Block comments can appear mid-line
  ```oto
  @api/call endpoint=/* old: "/v1" */ "/v2"
  ```
  Produces instruction with endpoint="/v2".

- [x] R-CMT-24: Multiple block comments on same line
  ```oto
  @api/call /* a */ endpoint="/users" /* b */
  ```
  Both comments stripped.

### String Awareness

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/comments.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-CMT-41: `//` inside string literal is NOT a comment
  ```oto
  @log/print msg="https://example.com"
  ```
  Produces instruction with full URL preserved.

- [x] R-CMT-42: `/* */` inside string literal is NOT a comment
  ```oto
  @log/print msg="/* not a comment */"
  ```
  Produces instruction with literal `/* not a comment */` in msg.

- [x] R-CMT-43: Escaped quotes inside strings are handled correctly
  ```oto
  @log/print msg="say \"hello\" // world"
  ```
  Produces instruction with `say "hello" // world` in msg.

### Error Handling

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/parser/comments.spec.ts`
**Progress:** 2/2 (100%)

- [x] R-CMT-61: Unclosed block comment produces descriptive error
  ```oto
  /* this comment never ends
  @api/call endpoint="/users"
  ```
  Error: `Unclosed block comment`

- [x] R-CMT-62: Unclosed string passes through (not comment stripper concern)
  ```oto
  @log/print msg="unclosed
  ```
  The comment stripper does not throw for unclosed strings - that error comes from the instruction parser.

## Dependencies

- **Depends on:**
  - Block Parsing PRD (IMPLEMENTED)
- **Blocks:**
  - None (comments are independent feature)

## Open Questions

- [x] Nested block comments? → **No**, standard non-nested behavior
- [x] Unclosed block comment? → **Error**, fail fast
- [x] String awareness? → **Yes**, critical requirement
- [x] Where to implement? → **Pre-processor** in program-parser

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](./dsl-0.5-parser.prd.md)

### Criteria

- [x] AC-CMT-01: Given `@api/call endpoint="/users" // comment`, when parsed, then instruction has no trace of comment
- [x] AC-CMT-02: Given line containing only `// comment`, when parsed, then no statement produced for that line
- [x] AC-CMT-03: Given `/* multi\nline */` before instruction, when parsed, then single instruction produced
- [x] AC-CMT-04: Given `@log/print msg="https://example.com"`, when parsed, then URL is preserved (not treated as comment)
- [x] AC-CMT-05: Given `@log/print msg="/* keep */"`, when parsed, then `/* keep */` is in the msg value
- [x] AC-CMT-06: Given unclosed `/*`, when parsed, then error mentions "Unclosed block comment"
- [x] AC-CMT-07: Given `@api/call /* a */ endpoint /* b */ ="/users"`, when parsed, then instruction is valid with endpoint="/users"
- [x] AC-CMT-08: Given escaped quote in string `msg="a\"b // c"`, when parsed, then full string preserved including `// c`
- [x] All automated tests pass (44 tests)
- [ ] Edge cases covered in `comments.edge.spec.ts` (deferred)

## Implementation Notes

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Comment Processing Flow                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Source ──► stripComments() ──► Clean Source ──► Program Parser         │
│                   │                                                     │
│                   └── State Machine:                                    │
│                       NORMAL → IN_STRING → NORMAL                       │
│                       NORMAL → IN_LINE_COMMENT → NORMAL (at EOL)        │
│                       NORMAL → IN_BLOCK_COMMENT → NORMAL (at */)        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### State Machine

```typescript
type CommentState = 'NORMAL' | 'IN_STRING' | 'IN_LINE_COMMENT' | 'IN_BLOCK_COMMENT'

function stripComments(source: string): string {
  let state: CommentState = 'NORMAL'
  let result = ''
  let i = 0

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    switch (state) {
      case 'NORMAL':
        if (char === '"') {
          state = 'IN_STRING'
          result += char
        } else if (char === '/' && next === '/') {
          state = 'IN_LINE_COMMENT'
          i++ // skip second /
        } else if (char === '/' && next === '*') {
          state = 'IN_BLOCK_COMMENT'
          i++ // skip *
        } else {
          result += char
        }
        break

      case 'IN_STRING':
        result += char
        if (char === '\\' && next === '"') {
          result += next
          i++ // skip escaped quote
        } else if (char === '"') {
          state = 'NORMAL'
        }
        break

      case 'IN_LINE_COMMENT':
        if (char === '\n') {
          state = 'NORMAL'
          result += char // preserve newline
        }
        // else: skip comment char
        break

      case 'IN_BLOCK_COMMENT':
        if (char === '*' && next === '/') {
          state = 'NORMAL'
          i++ // skip /
        }
        // else: skip comment char
        break
    }
    i++
  }

  if (state === 'IN_BLOCK_COMMENT') {
    throw new Error('Unclosed block comment')
  }

  return result
}
```

### Integration Point

In `program-parser.ts`:

```typescript
export function buildProgramParser(): ProgramParser {
  return {
    val(source: string): ProgramNode {
      const cleanSource = stripComments(source)  // NEW: strip comments first
      const lines = cleanSource.split(/\r?\n/)
      const statements = parseStatements(lines)
      return { type: 'program', body: statements }
    },
    // ...
  }
}
```

### File Structure

```
packages/runtime/src/compiler/parser/
├── comments.ts              # NEW: stripComments() function
├── comments.spec.ts         # NEW: main tests
├── comments.edge.spec.ts    # NEW: edge cases
├── comments.prd.md          # NEW: this PRD
└── program-parser.ts        # MODIFIED: integrate stripComments
```
