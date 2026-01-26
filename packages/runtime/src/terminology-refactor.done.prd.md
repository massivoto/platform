# PRD: Terminology Refactor - Marketing-First Result Types

**Status:** IMPLEMENTED
**Last updated:** 2026-01-26

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: New Types | Complete | 3/3 |
| Requirements: Renames | Complete | 2/2 |
| Requirements: Removals | Complete | 3/3 |
| Requirements: File Updates | Complete | 5/5 |
| Requirements: Documentation | Complete | 2/2 |
| Acceptance Criteria | Complete | 5/5 |
| Theme | Defined | - |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../ROADMAP.md) - Terminology Clarification section

## Child PRDs

- None

## Context

The codebase mixes marketing terms with implementation details. We established:

- **Marketing terms** (public): **Program**, **Action**, **Block**, **Batch**
- **Implementation details** (internal): Statement, Instruction (parser internals)

The Parser is a **closed module**. Public APIs use marketing terms only.

**Key insight:** We need a term for "aggregation of Actions" that works for Blocks, Templates, and
any future grouping. The term **Batch** was chosen - it's industry-standard, marketing-friendly,
and disconnected from parser terminology.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-26 | Parser is a closed module | Internal types are implementation details |
| 2026-01-26 | Marketing terms: Program, Action, Block, Batch | What users see and understand |
| 2026-01-26 | `Batch` for aggregation | Industry-standard, works for Block/Template/any grouping |
| 2026-01-26 | `InstructionLog` → `ActionLog` | Aligns with marketing "Action" term |
| 2026-01-26 | Add `BatchResult` type | Aggregates ActionLogs with batch-level message |
| 2026-01-26 | Remove `ProgramResult.history` | Replaced by `batches: BatchResult[]` |
| 2026-01-26 | Keep `ActionResult` | Handler return type, already marketing-aligned |
| 2026-01-26 | Keep `StatementResult` internal | Interpreter implementation detail |

## Scope

**In scope:**
- Rename `InstructionLog` → `ActionLog`
- Add new `BatchResult` type
- Update `ProgramResult` to use `batches: BatchResult[]`
- Remove `ProgramResult.history` and `meta.history`
- Update all files importing/using these types
- Update documentation

**Out of scope:**
- Parser layer changes (closed module)
- Renaming `ActionResult` (already correct)
- Renaming `StatementResult` (internal)

## Terminology Reference

### Public API (Marketing Terms)

| Term | Type | Definition |
|------|------|------------|
| **Program** | `ProgramResult` | Complete `.oto` file execution result |
| **Action** | `ActionResult`, `ActionLog` | What users write: `@pkg/name args...` (billable unit) |
| **Batch** | `BatchResult` | Aggregation of Actions (Block, Template, etc.) |
| **Block** | - | `{ ... }` grouping (uses BatchResult) |

### Internal (Implementation Details)

| Term | Type | Visibility |
|------|------|------------|
| Statement | `StatementNode`, `StatementResult` | Parser/Interpreter internal |
| Instruction | `InstructionNode` | Parser internal |
| Action (AST) | `ActionNode` | Parser internal (just the `@pkg/name` identifier) |

### Result Hierarchy

```
Program  →  Batch[]  →  Action[]

ProgramResult (program-level)
  ├── batches: BatchResult[]      ← execution batches
  ├── duration: number            ← total program time (ms)
  ├── data, cost, context         ← program state
  ├── exitCode, exitedEarly       ← program outcome
  └── value?                      ← from @flow/return

BatchResult (batch-level aggregation)
  ├── success: boolean
  ├── message: string             ← "Block 'init' completed"
  ├── actions: ActionLog[]        ← per-action execution logs
  ├── totalCost: number
  └── duration: number            ← total batch time (ms)

ActionLog (action-level)
  └── command, success, cost, duration, messages, output, value
```

**Key distinction:** `ProgramResult` is NOT just a `BatchResult`. It contains batches plus
program-level concerns (tracking, outcome, full context access).

## Requirements

### New Types

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime`
**Progress:** 3/3 (100%)

- [x] R-TERM-01: Create `ActionLog` interface in `domain/action-log.ts`
- [x] R-TERM-02: Create `BatchResult` interface in `domain/batch-result.ts`
- [x] R-TERM-03: Export `ActionLog` and `BatchResult` from `domain/index.ts`

### Renames

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime`
**Progress:** 2/2 (100%)

- [x] R-TERM-21: Rename all usages of `InstructionLog` → `ActionLog`
- [x] R-TERM-22: Update `ProgramResult` to use `batches: BatchResult[]` instead of `history: InstructionLog[]`

### Removals

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime`
**Progress:** 3/3 (100%)

- [x] R-TERM-41: Remove `InstructionLog` interface from `execution-context.ts`
- [x] R-TERM-42: Remove `history` field from `ProgramResult`
- [x] R-TERM-43: Remove `meta.history` backward compatibility alias

### File Updates

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime`
**Progress:** 5/5 (100%)

- [x] R-TERM-61: Update `interpreter.ts` to produce `BatchResult` for blocks
- [x] R-TERM-62: Update `program-runner.ts` to build `ProgramResult.batches`
- [x] R-TERM-63: Update all test files referencing `InstructionLog` or `history`
- [x] R-TERM-64: Update `local-runner.wip.prd.md` to use new terminology (N/A - references remain as comments)
- [x] R-TERM-65: Update any other PRD files referencing old types (N/A - historical references preserved)

### Documentation

**Last updated:** 2026-01-26
**Test:** Manual review
**Progress:** 2/2 (100%)

- [x] R-TERM-81: Update ROADMAP.md terminology section (N/A - ROADMAP doesn't reference types)
- [x] R-TERM-82: Update `interpreter.archi.md` with new types

## Dependencies

- **Depends on:** None
- **Blocks:** LocalRunner PRD (uses these types)

## Open Questions

- [x] What term for aggregation? → **Batch**
- [x] Should we keep `history` for backward compat? → **No**, clean break
- [ ] forEach billing: 10 iterations = 1 ActionLog or 10? → **Deferred**

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.done.prd.md](./interpreter/parser/dsl-0.5-parser.done.prd.md)

### Criteria

- [x] AC-TERM-01: Given the codebase, when searching for `InstructionLog`, then zero matches found in source (only PRDs/docs)
- [x] AC-TERM-02: Given `ProgramResult`, when accessing `.batches`, then it returns `BatchResult[]`
- [x] AC-TERM-03: Given a `BatchResult`, when accessing `.actions`, then it returns `ActionLog[]`
- [x] AC-TERM-04: Given `packages/runtime`, when running `yarn build`, then no TypeScript errors
- [x] AC-TERM-05: All automated tests pass (861 tests)

## Implementation Notes

### Type Definitions

```typescript
// domain/action-log.ts
export interface ActionLog {
  command: string         // e.g., '@utils/set'
  success: boolean
  fatalError?: string
  start: ReadableDate
  end: ReadableDate
  duration: number        // milliseconds
  messages: string[]
  cost: number            // credits consumed
  output?: string         // variable name if output= used
  value?: any             // stored value (debugging)
}

// domain/batch-result.ts
export interface BatchResult {
  success: boolean        // all actions succeeded?
  message: string         // batch-level log: "Block 'init' completed"
  actions: ActionLog[]    // per-action execution logs
  totalCost: number       // sum of action costs
  duration: number        // total milliseconds for batch
}

// domain/program-result.ts (updated)
// ProgramResult is distinct from BatchResult - it has program-level concerns
export interface ProgramResult {
  // Execution results
  batches: BatchResult[]        // execution organized by batch
  duration: number              // total milliseconds for program

  // Program-level data
  data: SerializableObject      // final context.data
  cost: CostInfo                // total cost tracking
  user: { id: string; extra: SerializableObject }
  context: ExecutionContext     // full context for advanced access

  // Program outcome
  exitCode: number
  exitedEarly: boolean
  exitedAt?: number
  value?: unknown               // from @flow/return

  // Future: program-level tracking
  // url?: string               // execution tracking URL
}
```

### Files Modified

```
packages/runtime/src/
  domain/
    action-log.ts           → NEW (ActionLog interface)
    action-log.spec.ts      → NEW (ActionLog tests)
    batch-result.ts         → NEW (BatchResult interface)
    batch-result.spec.ts    → NEW (BatchResult tests)
    execution-context.ts    → Removed InstructionLog
    execution-context.spec.ts → Removed InstructionLog tests
    program-result.ts       → Updated to use batches: BatchResult[]
    index.ts                → Updated exports
  interpreter/
    interpreter.ts          → Updated to use ActionLog, build BatchResult
    interpreter.spec.ts     → Updated to use batches[0].actions
    interpreter.archi.md    → Updated documentation
    evaluator/
      foreach.spec.ts       → Updated to use batches[0].actions
      goto.spec.ts          → Updated to use batches[0].actions
      scope-lifecycle.spec.ts → Updated to use batches[0].actions
    program-result.spec.ts  → Updated to use batches[0].actions
    program-runner.spec.ts  → Updated to use batches[0].actions
  command-registry/
    action-result.ts        → Updated comment (InstructionLog → ActionLog)
```
