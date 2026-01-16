# Architecture: Runtime (Automation Programming Language)

**Last updated:** 2026-01-14

## Parent

- [Platform Root](../../root.archi.md)

## Children

- None

## Overview

The Runtime package (`@massivoto/runtime`) implements the Massivoto Automation Programming Language (APL). It provides a complete pipeline for parsing DSL source code, normalizing control flow, evaluating expressions, and executing commands via a pluggable handler registry. The runtime also includes MCP (Model Context Protocol) client integration for external tool access.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    @massivoto/runtime (packages/runtime)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DSL Source Code                              │   │
│  │              @log message="Hello" | @set result=$output              │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        COMPILER PIPELINE                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │  │
│  │  ┌─────────┐    ┌────────────┐    ┌─────────┐    ┌──────────────┐   │  │
│  │  │ Parser  │───►│ Normalizer │───►│Evaluator│───►│ Interpreter  │   │  │
│  │  │         │    │            │    │         │    │              │   │  │
│  │  │Source→  │    │Expand      │    │Resolve  │    │Execute       │   │  │
│  │  │   AST   │    │foreach/if  │    │$vars    │    │handlers      │   │  │
│  │  └─────────┘    └────────────┘    └─────────┘    └──────────────┘   │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN (State)                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ExecutionContext  │  Flow  │  Instruction  │  Store                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    COMMAND HANDLERS                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  CommandRegistry  │  Built-in handlers  │  MCP clients              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compiler Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPILER STAGES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PARSER (src/compiler/parser/)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Source Text ─────► Tokenizer ─────► AST (InstructionNode[])        │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  - command-parser.ts  : Parse @package/command syntax               │   │
│  │  - arg-parser.ts      : Parse key=value arguments                   │   │
│  │  - full-expression-parser.ts : Parse expressions ($var, pipes, ops) │   │
│  │  - ast.ts             : AST node type definitions                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  2. NORMALIZER (src/compiler/normalizer/)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AST ─────► Expand control flow ─────► Flat instruction list        │   │
│  │                                                                      │   │
│  │  - normalize-foreach.ts : Unroll @foreach loops                     │   │
│  │  - normalize-if.ts      : Expand @if conditionals                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  3. EVALUATOR (src/compiler/interpreter/evaluators.ts)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Expression + Context ─────► Resolved value                         │   │
│  │                                                                      │   │
│  │  - Variable resolution: $data.foo → context.data.foo                │   │
│  │  - Binary ops: 1 + 2, "a" == "b"                                    │   │
│  │  - Pipe chains: $input | filter | map                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  4. INTERPRETER (src/compiler/interpreter/interpreter.ts)                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Instruction + Context ─────► Handler.run() ─────► New Context      │   │
│  │                                                                      │   │
│  │  - Resolve command from registry                                    │   │
│  │  - Evaluate all arguments                                           │   │
│  │  - Execute handler, update context                                  │   │
│  │  - Record execution in history                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `Parser` | src/compiler/parser/ | Tokenize and parse DSL source to AST |
| `Normalizer` | src/compiler/normalizer/ | Expand control flow (foreach, if) |
| `ExpressionEvaluator` | src/compiler/interpreter/evaluators.ts | Resolve variables and evaluate expressions |
| `Interpreter` | src/compiler/interpreter/interpreter.ts | Execute instructions via command handlers |
| `CommandRegistry` | src/compiler/handlers/command-registry.ts | Register and resolve command handlers |
| `ExecutionContext` | src/domain/execution-context.ts | Immutable state: data, meta, history |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXECUTION CONTEXT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ExecutionContext                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  data: Record<string, any>     // User data (variables)             │   │
│  │  meta: {                                                            │   │
│  │    history: InstructionLog[]   // Execution trace                   │   │
│  │  }                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       InstructionLog                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  command: string       // "@pkg/cmd"                                │   │
│  │  success: boolean                                                   │   │
│  │  start: string         // ISO timestamp                             │   │
│  │  end: string                                                        │   │
│  │  duration: number      // milliseconds                              │   │
│  │  messages: string[]                                                 │   │
│  │  fatalError?: string                                                │   │
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
│  │                   CommandHandler<T> (Interface)                       │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  run(args, context) → Promise<ActionResult<T>>                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│          ┌─────────────────────────┼─────────────────────────┐             │
│          │                         │                         │             │
│          ▼                         ▼                         ▼             │
│  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│  │ @utils/log    │       │ @utils/set    │       │  MCP Clients  │        │
│  │               │       │               │       │               │        │
│  │ Log messages  │       │ Set variables │       │ fetch, fs,    │        │
│  │               │       │               │       │ postgres, ... │        │
│  └───────────────┘       └───────────────┘       └───────────────┘        │
│                                                                             │
│  MCP Clients (src/compiler/core-handlers/mcp/client/):                     │
│  - fetch.client.ts      : HTTP requests                                    │
│  - filesystem.client.ts : File operations                                  │
│  - postgres.client.ts   : Database queries                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Expression Grammar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPRESSION GRAMMAR                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Literals:                                                                  │
│  - Numbers:  42, 3.14                                                      │
│  - Strings:  "hello", 'world'                                              │
│  - Booleans: true, false                                                   │
│  - Null:     null                                                          │
│                                                                             │
│  Variables:                                                                 │
│  - Simple:   $name                                                         │
│  - Nested:   $data.user.name                                               │
│  - Index:    $items[0]                                                     │
│                                                                             │
│  Binary Operations (precedence low→high):                                  │
│  - Logical:  &&, ||                                                        │
│  - Equality: ==, !=                                                        │
│  - Compare:  <, >, <=, >=                                                  │
│  - Additive: +, -                                                          │
│  - Multiply: *, /, %                                                       │
│                                                                             │
│  Unary:                                                                     │
│  - Not:      !$flag                                                        │
│  - Negative: -$number                                                      │
│                                                                             │
│  Pipes:                                                                     │
│  - Chain:    $data | filter key="value" | map transform="..."              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependencies

- **Depends on:**
  - @massivoto/kit (timestamp utilities)
  - @masala/parser (parser combinators)
  - @modelcontextprotocol/sdk (MCP client)
  - lodash.get, lodash.set (deep property access)
- **Used by:** Future automation execution service
