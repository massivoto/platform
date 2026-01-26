# Architecture: Interpreter

**Last updated:** 2026-01-26

## Parent

- [Runtime](../../../runtime.archi.md)

## Children

- (none - leaf module)

## Overview

The Interpreter module executes parsed DSL programs by resolving commands from a registry, evaluating expressions with scope-aware variable resolution, and managing execution flow. It supports sequential instruction execution, conditional blocks (if=), iteration blocks (forEach=), and flow control commands (goto, exit, return). The module maintains immutability by cloning context on each instruction, tracks execution cost, and logs every Action to a history trace.

## Terminology

The Parser is a **closed module**. Internal types are implementation details. Public APIs use **marketing terms**.

### Public API (Marketing Terms)

| Term | Type | Definition |
|------|------|------------|
| **Program** | `ProgramResult` | Complete `.oto` file execution result |
| **Action** | `ActionResult`, `ActionLog` | What users write: `@pkg/name args...` (billable unit) |
| **Batch** | `BatchResult` | Aggregation of Actions (Block, Template, any grouping) |
| **Block** | - | `{ ... }` grouping (uses BatchResult) |

### Internal (Implementation Details)

| Term | Type | Notes |
|------|------|-------|
| Statement | `StatementNode`, `StatementResult` | Union type: Instruction or Block |
| Instruction | `InstructionNode` | Parser AST: Action + args + reserved args |
| Action (AST) | `ActionNode` | Parser AST: just the `@pkg/name` identifier |

### Result Hierarchy

```
Program  →  Batch[]  →  Action[]

ProgramResult (program-level)
  ├── batches: BatchResult[]
  ├── duration: number            ← total program time (ms)
  └── data, cost, context, exitCode, value...

BatchResult (batch-level)
  ├── success: boolean
  ├── message: string             ← "Block 'init' completed"
  ├── actions: ActionLog[]
  ├── totalCost: number
  └── duration: number            ← total batch time (ms)

ActionLog (action-level)
  └── command, success, cost, duration, messages...

Handler returns:     ActionResult (per command execution)
Interpreter uses:    StatementResult (internal aggregation)
```

## Diagram

```
                         ┌─────────────────────────────────────────────┐
                         │                 runProgram()                │
                         │        (entry point for execution)          │
                         └──────────────────────┬──────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  INTERPRETER                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────────┐  │
│  │    ProgramNode    │────►│  executeProgram() │────►│    ProgramResult      │  │
│  │  (parsed AST)     │     │                   │     │  {context, exitCode}  │  │
│  └───────────────────┘     └─────────┬─────────┘     └───────────────────────┘  │
│                                      │                                           │
│                    ┌─────────────────┼─────────────────┐                        │
│                    │                 │                 │                        │
│                    ▼                 ▼                 ▼                        │
│           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │
│           │ Instruction │   │    Block    │   │  Flow Ctrl  │                  │
│           │   execute() │   │executeBlock │   │ goto/exit/  │                  │
│           └──────┬──────┘   │  forEach    │   │   return    │                  │
│                  │          └──────┬──────┘   └──────┬──────┘                  │
│                  │                 │                 │                          │
│                  └─────────────────┼─────────────────┘                          │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                      ExpressionEvaluator                                  │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  resolveIdentifier() ─► lookup(scopeChain) ─► fallback data              │  │
│  │  evaluateMember()    ─► scope.x / store.x / standard path                │  │
│  │  evaluateUnary()     ─► !, -, +                                          │  │
│  │  evaluateBinary()    ─► ==, !=, <, <=, >, >=, +, -, *, /, %              │  │
│  │  evaluateLogical()   ─► && (short-circuit), || (short-circuit)           │  │
│  │  evaluatePipe()      ─► {input | pipe:arg | ...}                         │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                            │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                           ScopeChain                                      │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  ┌─────────┐     ┌─────────┐     ┌─────────┐                             │  │
│  │  │ current │────►│ parent  │────►│  root   │                             │  │
│  │  │ (block) │     │ (block) │     │ (empty) │                             │  │
│  │  └─────────┘     └─────────┘     └─────────┘                             │  │
│  │                                                                           │  │
│  │  pushScope() ─► create child with parent link                            │  │
│  │  popScope()  ─► return to parent, discard current                        │  │
│  │  lookup()    ─► walk chain from current to root                          │  │
│  │  write()     ─► always writes to current scope                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
           │ Command     │ │ Execution   │ │   Pipe      │
           │ Registry    │ │ Context     │ │  Registry   │
           │ resolve(id) │ │ data/scope  │ │ (optional)  │
           └─────────────┘ └─────────────┘ └─────────────┘
```

## Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `Interpreter` | interpreter.ts | Execute instructions, handle flow control, manage label-based jumps |
| `ExpressionEvaluator` | evaluators.ts | Resolve variables (scope-first), evaluate expressions, apply pipes |
| `ScopeChain` | scope-chain.ts | Lexical scoping: push/pop/lookup/write for block-local variables |
| `runProgram` | program-runner.ts | Entry point: parse source, create registry, execute via Interpreter |
| `ProgramRunError` | program-runner.ts | LLM-readable error with source context |
| `EvaluationError` | evaluators.ts | Typed error for expression evaluation failures |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INSTRUCTION EXECUTION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. RESOLVE COMMAND                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  InstructionNode.action ─► "@pkg/name" ─► registry.resolve() ─► Handler   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  2. EVALUATE ARGUMENTS                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  For each arg:                                                             │  │
│  │    arg.value ─► evaluator.evaluate(expr, context) ─► resolved value       │  │
│  │                                                                            │  │
│  │  Variable resolution order:                                                │  │
│  │    1. Walk scopeChain (current → parent → ... → root)                     │  │
│  │    2. If not found, check context.data                                    │  │
│  │    3. Return undefined if not found anywhere                              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  3. EXECUTE HANDLER                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  handler.run(args, context) ─► ActionResult { success, value, cost }      │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  4. WRITE OUTPUT                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  parseOutputTarget(output=...):                                           │  │
│  │    "user"       → write to context.data.user                              │  │
│  │    "scope.item" → write to scopeChain.current.item                        │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  5. UPDATE CONTEXT                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  - Clone context (immutability)                                           │  │
│  │  - Accumulate cost (returned in StatementResult)                          │  │
│  │  - Build ActionLog (returned in StatementResult)                          │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  6. DETERMINE FLOW CONTROL                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  @flow/goto   ─► { type: 'goto', target: label }                          │  │
│  │  @flow/exit   ─► { type: 'exit', code: number }                           │  │
│  │  @flow/return ─► { type: 'return', value: any }                           │  │
│  │  (other)      ─► { type: 'continue' }                                     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PROGRAM EXECUTION LOOP                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  flattenProgram() ─► InstructionNode[]                                          │
│  buildLabelIndex() ─► Map<labelName, instructionIndex>                          │
│                                                                                  │
│  while (instructionPointer < instructions.length):                              │
│    ┌────────────────────────────────────────────────────────────────────────┐   │
│    │  1. Check condition (if=) - skip if falsy                              │   │
│    │  2. Execute instruction ─► StatementResult { context, flow }           │   │
│    │  3. Handle flow:                                                       │   │
│    │     - continue: instructionPointer++                                   │   │
│    │     - goto:     instructionPointer = labelIndex.get(target)            │   │
│    │     - exit:     return createEarlyExit(context, code)                  │   │
│    │     - return:   return createReturn(context, value)                    │   │
│    └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  return createNormalCompletion(context)                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FOREACH EXECUTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  forEach={users -> user}:                                                       │
│                                                                                  │
│  for each item in users:                                                        │
│    ┌────────────────────────────────────────────────────────────────────────┐   │
│    │  1. pushScope() ─► create child scope                                  │   │
│    │  2. Inject system variables:                                           │   │
│    │     _index, _count, _length, _first, _last, _odd, _even               │   │
│    │  3. Inject iterator: write(user, item)                                 │   │
│    │  4. Execute block body                                                 │   │
│    │  5. popScope() ─► discard iteration scope                              │   │
│    └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Interfaces

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                FlowControl                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  type: 'continue' | 'goto' | 'exit' | 'return'                                  │
│  target?: string      // for goto                                               │
│  code?: number        // for exit                                               │
│  value?: unknown      // for return                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              StatementResult                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  context: ExecutionContext    // updated context after execution                │
│  flow: FlowControl            // signal for program loop                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               OutputTarget                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  namespace: 'data' | 'scope'                                                    │
│  key: string                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             ScopeChain                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  current: Record<string, any>   // variables in this scope                      │
│  parent?: ScopeChain            // link to outer scope                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:**
  - `../parser/ast.js` (AST node types: InstructionNode, ProgramNode, etc.)
  - `../handlers/command-registry.js` (CommandRegistry for resolving handlers)
  - `../pipe-registry/` (PipeRegistry for pipe expression evaluation)
  - `../../domain/execution-context.js` (ExecutionContext, cloneExecutionContext)
  - `../../domain/index.js` (ProgramResult, createNormalCompletion, etc.)
  - `@massivoto/kit` (nowTs, toReadableDate)
  - `lodash.set` (nested property writing)

- **Used by:**
  - Program runner entry points
  - Test suites (interpreter.spec.ts, evaluator.spec.ts, etc.)
