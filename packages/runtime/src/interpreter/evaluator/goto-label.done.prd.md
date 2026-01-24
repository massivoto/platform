# PRD: Goto and Label

**Status:** IMPLEMENTED
**Last updated:** 2026-01-23

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Parser | ✅ Complete | 5/5 |
| Requirements: Interpreter | ✅ Complete | 5/5 |
| Requirements: Flow Commands | ✅ Complete | 9/9 |
| Requirements: Program Result | ✅ Complete | 5/5 |
| Requirements: AST Post-Processing | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 9/9 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [runtime.prd.md](../../../runtime.prd.md) (if exists)

## Child PRDs

- None

## Context

OTO needs control flow jumps for complex workflows like retry loops, error
handling branches, and state machines. The design is inspired by 80's BASIC
(Commodore 64, Amstrad CPC) where labels marked jump targets and GOTO
transferred execution.

Unlike BASIC's line numbers, OTO uses named labels as command arguments. This
keeps the syntax pure OTO (everything is `@package/command args`) while
providing the nostalgic jump-based flow control.

**Example - Retry pattern:**
```oto
@utils/set value=0 output=counter label="retry"
@http/fetch url="https://api.example.com" output=response
@flow/goto target="success" if={response.status == 200}
@utils/increment input=counter output=counter
@flow/goto target="retry" if={counter < 3}

@log/error message="Failed after 3 retries" label="failure"
@flow/exit code=1

@log/info message="Request succeeded" label="success"
@flow/return value={response.data}
```

**Example - Calculate and return:**
```oto
@utils/set value=100 output=price
@utils/set value=0.2 output=discount
@flow/return value={price * (1 - discount)}
// ProgramResult.value = 80
```

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-22 | Standalone `:label` vs reserved arg | **Reserved arg** | Pure OTO syntax, no new token types |
| 2026-01-22 | `@goto` vs `@flow/goto` | **@flow/goto** | Namespaced, room for `@flow/exit`, `@flow/return` |
| 2026-01-22 | Label + forEach | **Allow, restart** | Jumping to forEach restarts the loop |
| 2026-01-22 | Label + if | **Allow, restart** | Jumping to if re-evaluates condition |
| 2026-01-22 | Duplicate label detection | **AST post-processing** | Keep parser simple, semantic checks later |
| 2026-01-22 | Max jumps | **No limit (v0.5)** | User's responsibility, add limit in v1.0 |
| 2026-01-22 | Goto into block | **Defer to v1.0** | Blocks not in v0.5 |
| 2026-01-22 | Missing `target` arg | **Parse error** | Fail fast, clear error message |
| 2026-01-22 | `@flow/exit` | **Include in this PRD** | Natural companion to goto |
| 2026-01-22 | Program result model | **ProgramResult type** | Separate outcome from context state |
| 2026-01-22 | Exit code convention | **0 = success (C/Unix)** | Industry standard |
| 2026-01-22 | `@flow/return` | **Include in this PRD** | Completes the flow control trio |

## Scope

**In scope:**
- `label` as reserved argument on any command
- `@flow/goto target="name"` command to jump to label
- `@flow/exit code=N` command to terminate program with exit code
- `@flow/return value=X` command to terminate program with return value
- Conditional goto/exit/return with `if={condition}`
- Interaction with `forEach` (restart loop)
- Interaction with `if` (re-evaluate condition)
- AST post-processing for duplicate labels and unknown targets
- `ProgramResult` type to wrap execution outcome (context + exitCode + value)

**Out of scope:**
- Goto into/out of blocks (v1.0, blocks not in v0.5)
- Max jump limit (v1.0)
- Computed goto (`target={variable}`) - maybe never
- Gosub/Return with call stack (subroutines) - separate PRD if needed

## Requirements

### Parser

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/parser/reserved-args.spec.ts`
**Progress:** 5/5 (100%)

- ✅ R-GOTO-01: `label` is added to the reserved arguments list alongside `output`, `if`, `forEach`
- ✅ R-GOTO-02: Parser extracts `label="name"` from command arguments into `ActionNode.label?: string`
- ✅ R-GOTO-03: Label value must be a simple string literal (not expression, not identifier)
- ✅ R-GOTO-04: Label value must match pattern `^[a-zA-Z_][a-zA-Z0-9_-]*$` (valid identifier)
- ✅ R-GOTO-05: `@flow/goto` without `target` argument is a parse error with clear message

### Interpreter

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/goto.spec.ts`
**Progress:** 5/5 (100%)

- ✅ R-GOTO-21: Interpreter builds a label index `Map<string, number>` mapping label names to instruction indices
- ✅ R-GOTO-22: When `@flow/goto` executes, interpreter sets instruction pointer to the label's index
- ✅ R-GOTO-23: Goto to a `forEach` command restarts the loop (re-initializes iterator)
- ✅ R-GOTO-24: Goto to an `if` command re-evaluates the condition
- ✅ R-GOTO-25: Goto preserves execution context (variables, outputs) - only instruction pointer changes

### Flow Commands

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/flow-commands.spec.ts`
**Progress:** 9/9 (100%)

- ✅ R-GOTO-41: `@flow/goto` command is registered in CommandRegistry with `target` as required arg
- ✅ R-GOTO-42: `@flow/goto` supports `if={condition}` for conditional jumps (standard reserved arg)
- ✅ R-GOTO-43: `@flow/goto` with false condition is a no-op (execution continues to next instruction)
- ✅ R-GOTO-44: `@flow/exit` command is registered with optional `code` arg (default: 0)
- ✅ R-GOTO-45: `@flow/exit code=N` terminates program immediately with exit code N
- ✅ R-GOTO-46: `@flow/exit` supports `if={condition}` for conditional termination
- ✅ R-GOTO-47: `@flow/return` command is registered with required `value` arg (any expression)
- ✅ R-GOTO-48: `@flow/return value={expr}` terminates program with exitCode=0 and value set to evaluated expression
- ✅ R-GOTO-49: `@flow/return` supports `if={condition}` for conditional return

### AST Post-Processing

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/ast-processing/label-validation.spec.ts`
**Progress:** 3/3 (100%)

Note: AST post-processing pipeline is a separate PRD. These requirements define
what the pipeline must validate for goto/label.

- ✅ R-GOTO-61: Post-processor detects duplicate labels and returns error with both locations
- ✅ R-GOTO-62: Post-processor detects `@flow/goto target="x"` where no `label="x"` exists
- ✅ R-GOTO-63: Post-processor builds label index for interpreter (optimization, avoid runtime scan)

### Program Result

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interpreter/evaluator/program-result.spec.ts`
**Progress:** 5/5 (100%)

Currently `runProgram()` returns `Promise<ExecutionContext>`. With `@flow/exit`,
we need to capture the exit code and distinguish normal completion from early
termination.

```typescript
interface ProgramResult {
  context: ExecutionContext  // The transformed context (variables, history)
  exitCode: number           // 0 = success, non-zero = failure (C convention)
  value?: unknown            // Optional return value (future: @flow/return)
  exitedEarly: boolean       // true if @flow/exit was called
  exitedAt?: number          // Instruction index where exit occurred
}
```

- ✅ R-GOTO-81: `ProgramResult` interface is defined in `domain/program-result.ts`
- ✅ R-GOTO-82: `runProgram()` returns `Promise<ProgramResult>` instead of `Promise<ExecutionContext>`
- ✅ R-GOTO-83: Normal program completion yields `exitCode: 0, exitedEarly: false, value: undefined`
- ✅ R-GOTO-84: `@flow/exit code=1` yields `exitCode: 1, exitedEarly: true, exitedAt: <index>`
- ✅ R-GOTO-85: `@flow/return value={expr}` yields `exitCode: 0, exitedEarly: true, value: <evaluated>`

## Dependencies

- **Depends on:**
  - Reserved args system (exists)
  - CommandRegistry (exists)
  - `if={condition}` evaluation (exists)
  - AST post-processing pipeline (ROADMAP item, not yet implemented)

- **Blocks:**
  - Complex workflow examples in documentation
  - Retry patterns in core commands
  - Any consumer of `runProgram()` (breaking change: returns ProgramResult)

## Migration Notes

### Breaking Change: runProgram() Return Type

Before:
```typescript
const context = await runProgram(source)
console.log(context.data.user)
```

After:
```typescript
const result = await runProgram(source)
console.log(result.context.data.user)
console.log(result.exitCode) // 0 = success
```

## Open Questions

- [x] Should labels be case-sensitive? **Yes** (modern convention)
- [x] Goto into block? **Defer to v1.0**
- [x] Max jumps? **No limit for v0.5**
- [x] Should `@flow/goto` without `target` be a parse error or runtime error? **Parse error**
- [x] Should we add `@flow/exit code=N` in this PRD or separate? **Include here**
- [x] Program result model? **New ProgramResult type wrapping context + exitCode**
- [x] Should we add `@flow/return value=X`? **Yes, value is any expression**

## Design Debt: ExecutionContext Separation

**Problem:** `ExecutionContext` currently holds both:
- **Context concerns:** `data`, `scopeChain`, `env` (variable state)
- **Program-level concerns:** `meta.history`, `cost` (execution tracking)

This is bad design because:
1. `ProgramResult` wraps `ExecutionContext` which already contains program-level data
2. History and cost are execution concerns, not context concerns
3. Makes it confusing to reason about what belongs where

**Resolution (future PRD):**
- `ExecutionContext` should only hold: `data`, `scopeChain`, `env`, `extra`
- `ProgramResult` should own: `history`, `cost`, `exitCode`, `value`, `exitedEarly`
- Cost management at program level can terminate execution when limits exceeded

This refactoring is tracked in ROADMAP and should be done before v1.0.

## Design Debt: Terminology Cleanup

**Problem:** Codebase uses "Instruction" and "Statement" inconsistently.

**Clear terms:**
- **Action** - OTO term for `@package/name args...`
- **Command** - TypeScript handler that executes an Action

**TODO:**
- `InstructionNode` → `ActionNode`

**Open question 1:** Is a Block just a composite Action?

If yes, then we don't need "Statement" at all:
- A single `@pkg/name` is an Action
- A Block `{ ... }` is also an Action (composite)
- `ActionNode` becomes a union or base type

This would simplify terminology: everything executable is an Action.

**Open question 2:** What does `StatementResult` hold that `ActionResult` doesn't?

Current difference:
- `ActionResult` - from Command handler: `{ success, value, cost, messages }`
- `StatementResult` - from interpreter: `{ context, flow }`

These serve different purposes:
- `ActionResult` = outcome of command logic
- `StatementResult` = context after applying effects + flow control signal

But if Block is an Action, should the interpreter return `ActionResult` for both?
Or is `StatementResult` really an interpreter-internal concern (not exposed)?

See ROADMAP "Terminology Clarification" section for full plan.

## Acceptance Criteria

### Theme

> **Theme:** Commodore 64 BASIC
>
> All test scenarios use retro computing references for consistency and
> readability. Characters are 80's programmers debugging their BASIC programs.

### Criteria

- [x] AC-GOTO-01: Given programmer Emma writes a program with `label="retry"` on
      a fetch command, when she uses `@flow/goto target="retry"`, then execution
      jumps back to the fetch command

- [x] AC-GOTO-02: Given programmer Carlos writes `@flow/goto target="done" if={x > 10}`,
      when x equals 5, then execution continues to the next line (no jump)

- [x] AC-GOTO-03: Given programmer Sophie has `label="loop"` on a forEach command,
      when she gotos "loop", then the forEach restarts from the first item

- [x] AC-GOTO-04: Given programmer Jake uses `label="check"` twice in his program,
      when AST post-processing runs, then an error reports both line locations

- [x] AC-GOTO-05: Given programmer Emma writes `@flow/goto target="typo"` with no
      matching label, when AST post-processing runs, then an error identifies the
      unknown target

- [x] AC-GOTO-06: Given programmer Marco writes `@flow/exit code=1` after detecting
      an error, when the program runs, then ProgramResult has exitCode=1 and
      exitedEarly=true

- [x] AC-GOTO-07: Given programmer Lisa writes a program without `@flow/exit`,
      when it completes normally, then ProgramResult has exitCode=0 and
      exitedEarly=false

- [x] AC-GOTO-08: Given programmer Dave writes `@flow/return value={total * 1.2}`,
      when the program runs with total=100, then ProgramResult has value=120
      and exitCode=0

- [x] AC-GOTO-09: All automated tests pass with edge cases covered in test files
