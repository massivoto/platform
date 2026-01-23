# PRD: Execution Logging & Test Infrastructure

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
| Requirements: InstructionLog | Complete | 4/4 |
| Requirements: Cost Tracking | Complete | 4/4 |
| Requirements: Core Handlers | Complete | 4/4 |
| Requirements: Interpreter | Complete | 3/3 |
| Requirements: Program Runner | Complete | 3/3 |
| Acceptance Criteria | Complete | 10/10 |
| Theme | Defined | - |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Local Execution

## Child PRDs

- None

## Context

To properly test Variable Resolution & Scope (and future features), we need a working end-to-end execution pipeline:

```
DSL Source → Parser → AST → Interpreter → ExecutionContext (with history)
```

Current gaps:

1. **InstructionLog missing cost**: Each command execution should log its cost
2. **Handlers incomplete**: `LogHandler`, `SetHandler` don't implement full `CommandHandler` interface
3. **No program runner**: We can execute single instructions but not full programs
4. **Duplication**: `ActionResult.log` duplicates what interpreter creates

This PRD creates the minimal infrastructure to test program execution properly.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-20 | ActionResult.log field | **Remove** | Interpreter owns logging, handlers just return result |
| 2026-01-20 | Cost source | **Handler returns cost** | Handler knows its cost (AI tokens, API calls, etc.) |
| 2026-01-20 | Program runner location | **Interpreter class** | Keep execution logic together |

## Scope

**In scope:**
- Add `cost` field to `InstructionLog`
- Add `cost` field to `ActionResult` (handler reports cost)
- Update core handlers (`@utils/log`, `@utils/set`) to full `CommandHandler` interface
- Add `executeProgram()` method to `Interpreter`
- Update interpreter to track cumulative cost in `ExecutionContext.cost.current`
- Remove `ActionResult.log` (interpreter handles logging)

**Out of scope:**
- Cost estimation (pre-flight) - separate feature
- Cost limits enforcement - exists but not tested here
- MCP handlers update - focus on `@utils/*` only

## Requirements

### InstructionLog Changes

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/domain/execution-context.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-LOG-01: Add `cost: number` field to `InstructionLog` interface (in credits, 0 for free commands)
- [x] R-LOG-02: Add `output?: string` field to `InstructionLog` (variable name if output= was used)
- [x] R-LOG-03: Add `value?: any` field to `InstructionLog` (the value stored, for debugging)
- [x] R-LOG-04: `InstructionLog` captures complete execution trace for LLM debugging

### Cost Tracking

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/interpreter.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-COST-01: `ActionResult` has `cost: number` field (handler reports its cost)
- [x] R-COST-02: Remove `ActionResult.log` field (interpreter handles logging)
- [x] R-COST-03: Interpreter adds `result.cost` to `returnedContext.cost.current`
- [x] R-COST-04: Interpreter stores `cost` in `InstructionLog` entry

### Core Handlers Update

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/core-handlers/utils`
**Progress:** 4/4 (100%)

- [x] R-HAND-01: `LogHandler` implements full `CommandHandler` interface with `id='@utils/log'`, `type='command'`
- [x] R-HAND-02: `SetHandler` implements full `CommandHandler` interface with `id='@utils/set'`, `type='command'`
- [x] R-HAND-03: Both handlers have `init()` and `dispose()` methods (no-op is fine)
- [x] R-HAND-04: Both handlers return `cost: 0` (free commands)

### Interpreter Enhancements

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/interpreter.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-INT-01: `Interpreter.execute()` logs complete `InstructionLog` with cost
- [x] R-INT-02: `Interpreter.executeProgram(program: ProgramNode, context)` executes all statements sequentially
- [x] R-INT-03: `executeProgram()` handles `BlockNode` by executing its body (no scope change for now)

### Program Runner

**Last updated:** 2026-01-20
**Test:** `npx vitest run packages/runtime/src/compiler/interpreter/program-runner.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-RUN-01: Create helper `runProgram(source: string, context?)` that parses and executes
- [x] R-RUN-02: `runProgram` returns final `ExecutionContext` with complete history
- [x] R-RUN-03: `runProgram` throws on parse errors with LLM-readable message

## Dependencies

- **Depends on:**
  - Parser (IMPLEMENTED)
  - Evaluator (IMPLEMENTED)
  - CommandRegistry (IMPLEMENTED)

- **Blocks:**
  - Variable Resolution & Scope testing
  - forEach implementation
  - Cost management features

## Open Questions

- [x] Where does cost come from? → Handler returns it in ActionResult
- [x] Remove ActionResult.log? → Yes, interpreter handles logging
- [x] Program runner as separate class? → No, method on Interpreter

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](../../parser/dsl-0.5-parser.prd.md)

### Criteria

**Single Instruction Execution:**
- [x] AC-LOG-01: Given `@utils/log message="Hello Emma"`, when executed, then `history[0].command` is `@utils/log` and `success` is `true`
- [x] AC-LOG-02: Given `@utils/set input="Emma" output=user`, when executed, then `context.data.user` is `"Emma"` and `history[0].output` is `"user"`
- [x] AC-LOG-03: Given `@utils/set input=42 output=count`, when executed, then `history[0].value` is `42`

**Cost Tracking:**
- [x] AC-LOG-04: Given `@utils/log` execution, when complete, then `history[0].cost` is `0` (free command)
- [x] AC-LOG-05: Given 3 instructions executed, when complete, then `context.cost.current` is sum of individual costs

**Program Execution:**
- [x] AC-LOG-06: Given program with 3 instructions, when `executeProgram()` runs, then `history.length` is `3`
- [x] AC-LOG-07: Given program `@utils/set input="Emma" output=user` followed by `@utils/log message=user`, when executed, then log shows `"Emma"`

**Error Cases:**
- [x] AC-LOG-08: Given `@unknown/cmd`, when executed, then error is thrown with `Command not found: @unknown/cmd`
- [x] AC-LOG-09: Given `@utils/log` without `message` arg, when executed, then error is thrown and `history[0].success` is `false`

**General:**
- [x] AC-LOG-10: All automated tests pass

## Implementation Notes

### Current InstructionLog

```typescript
export interface InstructionLog {
  command: string
  success: boolean
  fatalError?: string
  start: ReadableDate
  end: ReadableDate
  duration: number
  messages: string[]
}
```

### Target InstructionLog

```typescript
export interface InstructionLog {
  command: string           // '@utils/set'
  success: boolean
  fatalError?: string
  start: ReadableDate
  end: ReadableDate
  duration: number          // milliseconds
  messages: string[]
  cost: number              // NEW: cost in credits (0 = free)
  output?: string           // NEW: variable name if output= used
  value?: any               // NEW: the value stored (for debugging)
}
```

### Current ActionResult

```typescript
export interface ActionResult<T> {
  success: boolean
  value?: T
  output?: string
  fatalError?: string
  log: InstructionLog       // REMOVE: interpreter handles this
  messages: string[]
  message?: string
}
```

### Target ActionResult

```typescript
export interface ActionResult<T> {
  success: boolean
  value?: T
  fatalError?: string
  messages: string[]
  message?: string
  cost: number              // NEW: handler reports its cost
}
```

### Updated Handler Example

```typescript
export class LogHandler implements CommandHandler<void> {
  readonly id = '@utils/log'
  readonly type = 'command' as const

  async init(): Promise<void> { }
  async dispose(): Promise<void> { }

  async run(args: Record<string, any>): Promise<ActionResult<void>> {
    const message = args.message as string
    if (!message) {
      return {
        success: false,
        fatalError: 'Message is required',
        messages: ['Missing required argument: message'],
        cost: 0,
      }
    }
    console.log(`[LOG] ${message}`)
    return {
      success: true,
      messages: [`Logged: ${message}`],
      cost: 0,  // free command
    }
  }
}
```

### Program Runner Usage

```typescript
// Test example
const source = `
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@utils/log message=user
`

const result = await runProgram(source)

expect(result.data.user).toBe('Emma')
expect(result.data.followers).toBe(1500)
expect(result.meta.history).toHaveLength(3)
expect(result.meta.history[0].output).toBe('user')
expect(result.meta.history[0].value).toBe('Emma')
expect(result.cost.current).toBe(0)
```
