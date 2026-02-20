# Architecture: Runtime (Automation Programming Language)

**Last updated:** 2026-01-20

## Parent

- [Platform Root](../../root.archi.md)

## Children

- [Interpreter](src/interpreter/evaluator/interpreter.archi.md)
- [Pipe Registry](src/interpreter/pipe-registry/pipe-registry.archi.md)

## Overview

The Runtime package (`@massivoto/runtime`) implements the Massivoto Automation Programming Language (APL). It provides a complete pipeline for parsing DSL source code, evaluating expressions with scope-aware variable resolution, and executing commands via a pluggable handler registry with full execution logging and cost tracking.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    @massivoto/runtime (packages/runtime)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DSL Source Code                              │   │
│  │           @utils/set input="Emma" output=user                        │   │
│  │           @utils/log message=user                                    │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INTERPRETER PIPELINE                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │  │
│  │  ┌─────────┐    ┌───────────┐    ┌─────────────┐    ┌────────────┐  │  │
│  │  │ Parser  │───►│ Evaluator │───►│ Interpreter │───►│  Program   │  │  │
│  │  │         │    │           │    │             │    │  Runner    │  │  │
│  │  │Source→  │    │Scope-aware│    │Execute +    │    │            │  │  │
│  │  │  AST    │    │resolution │    │log + cost   │    │runProgram()│  │  │
│  │  └─────────┘    └───────────┘    └─────────────┘    └────────────┘  │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN (State)                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ExecutionContext { data, scopeChain, meta.history, cost }          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    COMMAND REGISTRY                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  BaseComposableRegistry<CommandHandler> + CoreHandlersBundle        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Interpreter Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERPRETER STAGES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PARSER (src/interpreter/parser/)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Source Text ─────► Tokenizer ─────► AST (ProgramNode)              │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  - action-parser.ts         : Parse @package/command syntax         │   │
│  │  - arg-parser.ts            : Parse key=value arguments             │   │
│  │  - full-expression-parser.ts: Parse expressions (vars, pipes, ops)  │   │
│  │  - instruction-parser.ts    : Parse complete instruction + output   │   │
│  │  - program-parser.ts        : Parse multi-line program with blocks  │   │
│  │  - ast.ts                   : AST node type definitions             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  2. EVALUATOR (src/interpreter/evaluator/evaluators.ts)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Expression + Context ─────► Resolved value                         │   │
│  │                                                                      │   │
│  │  Variable Resolution (scope chain first, then data):                │   │
│  │  - user         → scopeChain lookup, fallback to data.user          │   │
│  │  - scope.user   → scopeChain only (explicit)                        │   │
│  │  - data.user    → data.data.user (no special meaning)               │   │
│  │                                                                      │   │
│  │  Supported expressions:                                             │   │
│  │  - Literals: string, number, boolean, null, array                   │   │
│  │  - Identifiers: user, count                                         │   │
│  │  - Member access: user.profile.name                                 │   │
│  │  - Unary: !flag, -count, +value                                     │   │
│  │  - Binary: a + b, x == y, count > 0                                 │   │
│  │  - Logical: a && b, x || y                                          │   │
│  │  - Pipes: {data|filter:key|map:fn}                                  │   │
│  │  - Mapper: users -> name                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  3. INTERPRETER (src/interpreter/evaluator/interpreter.ts)                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Instruction + Context ─────► Handler.run() ─────► New Context      │   │
│  │                                                                      │   │
│  │  execute(instruction, context):                                     │   │
│  │  - Resolve command from registry                                    │   │
│  │  - Evaluate all arguments                                           │   │
│  │  - Execute handler, get result + cost                               │   │
│  │  - Write output to data or scope (parseOutputTarget)                │   │
│  │  - Update cost.current                                              │   │
│  │  - Record InstructionLog in history                                 │   │
│  │                                                                      │   │
│  │  executeProgram(program, context):                                  │   │
│  │  - Execute statements sequentially                                  │   │
│  │  - Handle BlockNode (execute body)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  4. PROGRAM RUNNER (src/interpreter/program-runner.ts)            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  runProgram(source, context?) ─────► ExecutionContext               │   │
│  │                                                                      │   │
│  │  - Parse source to ProgramNode                                      │   │
│  │  - Create registry with CoreHandlersBundle                          │   │
│  │  - Execute via Interpreter.executeProgram()                         │   │
│  │  - Return final context with complete history                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `Parser` | src/interpreter/parser/ | Tokenize and parse DSL source to AST |
| `ExpressionEvaluator` | src/interpreter/evaluator/evaluators.ts | Scope-aware variable resolution, expression evaluation |
| `ScopeChain` | src/interpreter/evaluator/scope-chain.ts | Nested scope management (push, pop, lookup) |
| `Interpreter` | src/interpreter/evaluator/interpreter.ts | Execute instructions, log history, track cost |
| `runProgram` | src/interpreter/program-runner.ts | End-to-end program execution helper |
| `CommandRegistry` | src/interpreter/command-registry/ | Register and resolve command handlers |
| `ExecutionContext` | src/domain/execution-context.ts | State: data, scopeChain, meta.history, cost |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXECUTION CONTEXT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ExecutionContext                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  data: Record<string, any>      // Program-wide variables           │   │
│  │  scopeChain: ScopeChain         // Block-local variables (nested)   │   │
│  │  env: Record<string, string>    // Environment (READ-ONLY)          │   │
│  │  meta: {                                                            │   │
│  │    history: InstructionLog[]    // Execution trace                  │   │
│  │    updatedAt: string                                                │   │
│  │  }                                                                  │   │
│  │  cost: {                                                            │   │
│  │    current: number              // Accumulated cost in credits      │   │
│  │    estimated: number                                                │   │
│  │    maximum: number                                                  │   │
│  │    credits: number                                                  │   │
│  │  }                                                                  │   │
│  │  user: { id, extra }            // User info (READ-ONLY)            │   │
│  │  store: StorePointer            // Persistent storage (future)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         ScopeChain                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  current: Record<string, any>   // Variables in current scope       │   │
│  │  parent?: ScopeChain            // Link to outer scope              │   │
│  │                                                                      │   │
│  │  Operations:                                                        │   │
│  │  - pushScope()  → create child scope with parent link               │   │
│  │  - popScope()   → return to parent (discard current)                │   │
│  │  - lookup(name) → walk chain from current to root                   │   │
│  │  - write(name, value) → always write to current scope               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       InstructionLog                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  command: string       // "@utils/set"                              │   │
│  │  success: boolean                                                   │   │
│  │  start: string         // ISO timestamp                             │   │
│  │  end: string                                                        │   │
│  │  duration: number      // milliseconds                              │   │
│  │  cost: number          // cost in credits (0 = free)                │   │
│  │  output?: string       // variable name if output= used             │   │
│  │  value?: any           // stored value (for debugging)              │   │
│  │  messages: string[]                                                 │   │
│  │  fatalError?: string                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Variable Resolution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VARIABLE RESOLUTION RULES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Resolution Order (for bare identifiers):                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Walk scopeChain from current to root                            │   │
│  │  2. If not found, check context.data                                │   │
│  │  3. Return undefined if not found anywhere                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Namespace Prefixes:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  scope.user   → scopeChain only (explicit, no data fallback)        │   │
│  │  data.user    → context.data.data.user (no special meaning)         │   │
│  │  env.API_KEY  → context.env.API_KEY (READ-ONLY)                     │   │
│  │  user.id      → context.user.id (READ-ONLY)                         │   │
│  │  cost.current → context.cost.current (READ-ONLY)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Output Targeting:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  output=user       → writes to context.data.user (default)          │   │
│  │  output=scope.user → writes to scopeChain.current.user              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Command Handler System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMMAND HANDLER SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              CommandHandler<T> extends RegistryItem                   │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  id: string              // "@utils/log"                              │ │
│  │  type: 'command'                                                      │ │
│  │  init(): Promise<void>   // lifecycle hook                            │ │
│  │  dispose(): Promise<void>                                             │ │
│  │  run(args, context) → Promise<ActionResult<T>>                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         ActionResult<T>                               │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  success: boolean                                                     │ │
│  │  value?: T              // result value                               │ │
│  │  cost: number           // cost in credits                            │ │
│  │  messages: string[]                                                   │ │
│  │  fatalError?: string                                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐             │
│          │                         │                         │             │
│          ▼                         ▼                         ▼             │
│  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│  │ @utils/log    │       │ @utils/set    │       │  MCP Clients  │        │
│  │ id, type      │       │ id, type      │       │               │        │
│  │ cost: 0       │       │ cost: 0       │       │ fetch, fs,    │        │
│  │               │       │               │       │ postgres, ... │        │
│  └───────────────┘       └───────────────┘       └───────────────┘        │
│                                                                             │
│  CommandRegistry wraps BaseComposableRegistry<CommandHandler>              │
│  - CoreHandlersBundle provides built-in handlers                           │
│  - Conflict detection on duplicate registration                            │
│  - Lifecycle: init() called on load, dispose() on unload                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Expression Grammar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPRESSION GRAMMAR (DSL 0.5)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Precedence (lowest to highest):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  mapper      →  source -> target                                    │   │
│  │  pipe        →  {input|filter:arg|map:fn}                           │   │
│  │  logical OR  →  a || b                                              │   │
│  │  logical AND →  a && b                                              │   │
│  │  equality    →  a == b, a != b                                      │   │
│  │  comparison  →  a < b, a <= b, a > b, a >= b                        │   │
│  │  additive    →  a + b, a - b                                        │   │
│  │  multiply    →  a * b, a / b, a % b                                 │   │
│  │  unary       →  !x, -x, +x                                          │   │
│  │  member      →  obj.prop.nested                                     │   │
│  │  primary     →  literal, path, identifier, (expr), [array]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Literals:                                                                  │
│  - Numbers:  42, 3.14, -5                                                  │
│  - Strings:  "hello world" (double quotes only)                            │
│  - Booleans: true, false                                                   │
│  - Arrays:   [1, 2, 3], ["a", "b"]                                         │
│  - Files:    ~/images/hero.png (literal-file)                              │
│  - Globs:    ~/images/*.jpg, ~/data/**/*.json (literal-glob)               │
│  - No null literal (handled at runtime)                                    │
│                                                                             │
│  Variables:                                                                 │
│  - Simple:   user, count                                                   │
│  - Member:   user.profile.name                                             │
│  - Explicit: scope.item, env.API_KEY                                       │
│                                                                             │
│  Complex expressions require braces:                                       │
│  - arg={x + y}                                                             │
│  - if={count > 0 && isActive}                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:**
  - @massivoto/kit (timestamp utilities, registry pattern)
  - @masala/parser (parser combinators)
  - @modelcontextprotocol/sdk (MCP client)
  - lodash.get, lodash.set (deep property access)
- **Used by:** Future automation execution service, local runner
