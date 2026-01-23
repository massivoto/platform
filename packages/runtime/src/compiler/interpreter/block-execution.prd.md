# PRD: Block Execution Support

**Status:** IMPLEMENTED
**Last updated:** 2026-01-23

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | 100% |
| Scope | Complete | 100% |
| Requirements: Label Index | Complete | 3/3 |
| Requirements: Statement Execution | Complete | 4/4 |
| Requirements: Block Integration | Complete | 3/3 |
| Requirements: Cleanup | Complete | 2/2 |
| Acceptance Criteria | Complete | 5/5 |
| Theme | Defined | - |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [Runtime](../../../runtime.archi.md)

## Child PRDs

- (none)

## Context

The interpreter's `executeProgram()` method uses `flattenProgram()` which expands all blocks inline into a flat list of instructions. This was done to support label-based goto (which needs instruction indices for jumps), but it breaks block execution:

1. **Block conditions ignored**: `@block/begin if={condition}` - the condition is never evaluated, block always executes
2. **forEach not working**: `@block/begin forEach={items -> item}` - iteration doesn't happen, body executes once with undefined variables
3. **Scope leaks**: Variables from block bodies leak to outer scope because scope push/pop at block boundaries is bypassed

**Impact:** 18 tests failing in `foreach.spec.ts` (17) and `scope-lifecycle.spec.ts` (1).

The fix requires a hybrid approach: statement-based execution that respects AST structure while still supporting goto via a path-based label index.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-23 | A: Flat with markers vs B: Statement-based vs C: Minimal fix | **B selected** | Statement-based is cleanest, handles nesting naturally, matches AST structure |

## Scope

**In scope:**
- Path-based label index for goto support
- Statement-based execution loop
- Proper block condition evaluation
- Proper forEach iteration with scope management
- Nested block support
- All existing goto tests must keep passing

**Out of scope:**
- Goto into nested block (undefined behavior - will skip block setup)
- New block types (while, switch)
- Break/continue within forEach

## Requirements

### Label Index Enhancement

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/goto.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-BLK-01: Create `LabelLocation` type with `path: number[]` (indices to reach label) and `instruction: InstructionNode`
- [x] R-BLK-02: Create `buildEnhancedLabelIndex(program)` that walks AST and maps label names to `LabelLocation`
- [x] R-BLK-03: Labels can only appear on `InstructionNode`, not on `BlockNode`

### Statement-Based Execution

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/interpreter.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-BLK-21: Create `executeStatementList(statements, context, labelIndex, history, cost, startIndex)` method
- [x] R-BLK-22: For `InstructionNode`: check condition, execute, handle flow control
- [x] R-BLK-23: For `BlockNode`: call `executeBlock()`, propagate flow control
- [x] R-BLK-24: Handle local goto (target in same list) by adjusting index; bubble up non-local goto

### Block Integration

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/foreach.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-BLK-41: Refactor `executeProgram()` to call `executeStatementList()` on `program.body`
- [x] R-BLK-42: Update `executeBlock()` to use `executeStatementList()` for body execution
- [x] R-BLK-43: Update `executeForEach()` to use `executeStatementList()` for each iteration

### Cleanup

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/`
**Progress:** 2/2 (100%)

- [x] R-BLK-61: Remove or deprecate `flattenProgram()` method
- [x] R-BLK-62: Remove old `buildLabelIndex()` method (replaced by enhanced version)

## Dependencies

- **Depends on:** ExecutionContext Refactoring (completed)
- **Blocks:** Complex control flow features (while loops, break/continue)

## Open Questions

- [x] What happens on goto into nested block? -> Undefined behavior, skip block setup (document as limitation)
- [x] Should we support break/continue in forEach? -> Out of scope for this PRD

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation (Emma, Carlos, tweets, followers)
>
> All test scenarios use this theme for consistency and readability.
> Reused from: existing test files

### Criteria

- [x] AC-BLK-01: Given a block with `if={false}`, when the program executes, then the block body is skipped entirely and variables inside are not set

- [x] AC-BLK-02: Given a block with `forEach={users -> user}` where users is `["Emma", "Carlos"]`, when the program executes, then the block body runs twice with `user` set to "Emma" then "Carlos", and system variables `_index`, `_count`, `_first`, `_last` are correctly set

- [x] AC-BLK-03: Given a block that sets `scope.temp="value"`, when the block completes, then `temp` is not accessible outside the block (scope isolation)

- [x] AC-BLK-04: Given a program with `@flow/goto target="retry"` where `retry:` labels an instruction, when executed, then goto jumps correctly (existing behavior preserved)

- [x] AC-BLK-05: Given the test suites, when all tests run:
  - `goto.spec.ts`: 11 tests pass (no regression)
  - `foreach.spec.ts`: 17 tests pass (previously failing)
  - `scope-lifecycle.spec.ts`: 13 tests pass (previously 1 failing)

- [x] All automated tests pass (287 interpreter tests, 861 total runtime tests)
- [x] Edge cases for nested blocks covered in tests
