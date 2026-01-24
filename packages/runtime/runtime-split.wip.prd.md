# PRD: Runtime Package Split (BSL Extraction)

**Status:** DRAFT
**Last updated:** 2026-01-23

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Decision | Pending | - |
| Scope | Complete | - |
| Requirements: Interface Extraction | Pending | 0/6 |
| Requirements: Apache 2.0 Package | Pending | 0/5 |
| Requirements: BSL Package | Pending | 0/6 |
| Requirements: Integration | Pending | 0/4 |
| Acceptance Criteria | Pending | 0/8 |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [License Strategy](../../license.wip.prd.md)

## Child PRDs

- None

## Context

The Massivoto platform uses a hybrid licensing model:
- Most packages: **Apache 2.0** (permissive, community-friendly)
- Runtime execution engine: **BSL 1.1** (protects against commoditization)

Currently, `packages/runtime` contains both:
1. **Commodity parts** (parser, AST, domain types) - no strategic value
2. **Strategic parts** (interpreter, evaluator, core handlers) - the "secret sauce"

To enable this split cleanly, we need to:
1. Extract interfaces that define the contract between Apache and BSL parts
2. Keep foundational code in Apache 2.0 (`@massivoto/runtime`)
3. Move execution engine to a separate BSL repo (`@massivoto/runtime-engine`)

### Why Split?

| Actor | Without Split | With Split |
|-------|---------------|------------|
| OSS Developer | Cannot build DSL tooling (parser is BSL) | Can build parsers, linters, formatters (Apache 2.0) |
| Company | Must accept BSL for any runtime use | Can use Apache parts freely, BSL only for execution |
| Competitor | Could argue "everything is BSL" | Clear boundary: execution is protected |
| Contributor | Confused about what license applies | Clear: Apache 2.0 repo vs BSL repo |

### Current Structure

```
packages/runtime/src/
├── compiler/
│   ├── parser/              <- COMMODITY (syntax parsing)
│   ├── interpreter/         <- STRATEGIC (execution engine)
│   │   ├── interpreter.ts
│   │   ├── evaluators.ts
│   │   ├── scope-chain.ts
│   │   └── program-runner.ts
│   ├── handlers/            <- STRATEGIC (command execution)
│   │   ├── command-registry/
│   │   └── core-handlers-bundle/
│   └── pipe-registry/       <- STRATEGIC (data transformations)
│       ├── pipe-registry.ts
│       └── core-pipes-bundle/
└── domain/                  <- COMMODITY (type definitions)
    ├── execution-context.ts
    └── program-result.ts
```

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-23 | Split boundary | **Interpreter interface** | Natural product boundary - parsing is commodity, execution is value |
| 2026-01-23 | Interface location | **In Apache 2.0 repo** | Interfaces define contract, implementations are BSL |
| 2026-01-23 | ScopeChain location | **Apache 2.0** | Utility class, no strategic value |
| 2026-01-23 | Dependency direction | **BSL depends on Apache** | Apache package cannot import BSL |

## Scope

**In scope:**

- Extract `IInterpreter`, `IEvaluator`, `IPipeFunction` interfaces
- Refactor `LocalRunner` to accept `IInterpreter` via dependency injection
- Move interpreter implementation to separate BSL repo
- Move core handlers bundle to BSL repo
- Move core pipes bundle to BSL repo
- Update all imports and exports

**Out of scope:**

- Creating the BSL repo (separate task)
- CI/CD for BSL repo
- Publishing BSL package to npm
- Migrating existing tests (they stay with implementations)

## Target Architecture

### After Split

```
┌─────────────────────────────────────────────────────────────────────┐
│              Apache 2.0: @massivoto/runtime                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  src/                                                                │
│  ├── compiler/                                                       │
│  │   └── parser/           <- All parser code stays                 │
│  │       ├── ast.ts                                                  │
│  │       ├── tokenizer.ts                                            │
│  │       ├── action-parser.ts                                        │
│  │       ├── arg-parser.ts                                           │
│  │       ├── expression-parser.ts                                    │
│  │       └── program-parser.ts                                       │
│  │                                                                   │
│  ├── domain/               <- All domain types stay                 │
│  │   ├── execution-context.ts                                        │
│  │   ├── program-result.ts                                           │
│  │   └── instruction-log.ts                                          │
│  │                                                                   │
│  ├── interfaces/           <- NEW: Contract definitions             │
│  │   ├── interpreter.ts    <- IInterpreter, IEvaluator              │
│  │   ├── command-handler.ts <- CommandHandler (already exists)      │
│  │   └── pipe-function.ts  <- IPipeFunction                         │
│  │                                                                   │
│  ├── scope-chain/          <- Utility, stays                        │
│  │   └── scope-chain.ts                                              │
│  │                                                                   │
│  └── runner/               <- Shell only, accepts IInterpreter      │
│      └── local-runner.ts   <- createRunner(interpreter: IInterpreter) │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ implements (npm dependency)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              BSL 1.1: @massivoto/runtime-engine                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  src/                                                                │
│  ├── interpreter/          <- Moved from runtime                    │
│  │   ├── interpreter.ts    <- implements IInterpreter               │
│  │   ├── evaluators.ts     <- implements IEvaluator                 │
│  │   └── program-runner.ts <- runProgram() with batteries           │
│  │                                                                   │
│  ├── handlers/             <- Moved from runtime                    │
│  │   ├── command-registry.ts                                         │
│  │   └── core-handlers-bundle/                                       │
│  │       ├── set-handler.ts                                          │
│  │       ├── log-handler.ts                                          │
│  │       └── flow-handlers.ts                                        │
│  │                                                                   │
│  └── pipes/                <- Moved from runtime                    │
│      ├── pipe-registry.ts                                            │
│      └── core-pipes-bundle/                                          │
│          ├── filter.ts                                               │
│          ├── map.ts                                                  │
│          └── join.ts                                                 │
│                                                                      │
│  Exports:                                                            │
│  - Interpreter (class)                                               │
│  - ExpressionEvaluator (class)                                       │
│  - runProgram() (batteries-included entry point)                     │
│  - CoreHandlersBundle                                                │
│  - CorePipesBundle                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

```
┌─────────────────┐
│  @massivoto/kit │  (Apache 2.0)
│  - Registry     │
│  - Utilities    │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ @massivoto/runtime  │  (Apache 2.0)
│ - Parser            │
│ - Domain types      │
│ - IInterpreter      │
│ - LocalRunner shell │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────┐
│ @massivoto/runtime-engine│  (BSL 1.1)
│ - Interpreter impl      │
│ - Evaluator impl        │
│ - Core handlers         │
│ - Core pipes            │
│ - runProgram()          │
└─────────────────────────┘
```

## Requirements

### Interface Extraction

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime/src/interfaces`
**Progress:** 0/6

- [ ] R-SPLIT-01: Create `IInterpreter` interface with methods:
      `execute(instruction: InstructionNode, context: ExecutionContext): Promise<StatementResult>`,
      `executeProgram(program: ProgramNode, context: ExecutionContext): Promise<ProgramResult>`
- [ ] R-SPLIT-02: Create `IEvaluator` interface with method:
      `evaluate(expr: ExpressionNode, context: ExecutionContext): unknown`
- [ ] R-SPLIT-03: Create `IPipeFunction` interface extending `RegistryItem` with method:
      `execute(input: unknown, args: unknown[]): unknown`
- [ ] R-SPLIT-04: Create `ICommandRegistry` interface with methods:
      `resolve(actionPath: string): Promise<CommandHandler | undefined>`,
      `addBundle(bundle: RegistryBundle<CommandHandler>): void`,
      `reload(): Promise<void>`
- [ ] R-SPLIT-05: Create `IPipeRegistry` interface with methods:
      `get(pipeId: string): Promise<IPipeFunction | undefined>`,
      `addBundle(bundle: RegistryBundle<IPipeFunction>): void`,
      `reload(): Promise<void>`
- [ ] R-SPLIT-06: Export all interfaces from `@massivoto/runtime` main entry point

### Apache 2.0 Package Refactoring

**Last updated:** 2026-01-23
**Test:** `npx vitest run packages/runtime`
**Progress:** 0/5

- [ ] R-SPLIT-11: Move all interface definitions to `src/interfaces/` directory
- [ ] R-SPLIT-12: Refactor `LocalRunner` to accept `IInterpreter` via constructor/factory:
      `createRunner(interpreter: IInterpreter): Runner`
- [ ] R-SPLIT-13: Export `ScopeChain` utility class from main entry point
- [ ] R-SPLIT-14: Remove interpreter, evaluator, handlers, pipes implementations from package
- [ ] R-SPLIT-15: Update `package.json` exports to reflect new structure

### BSL Package Creation

**Last updated:** 2026-01-23
**Test:** `npx vitest run` (in BSL repo)
**Progress:** 0/6

- [ ] R-SPLIT-21: Create `@massivoto/runtime-engine` package with BSL 1.1 license
- [ ] R-SPLIT-22: Move `Interpreter` class implementing `IInterpreter`
- [ ] R-SPLIT-23: Move `ExpressionEvaluator` class implementing `IEvaluator`
- [ ] R-SPLIT-24: Move `CoreHandlersBundle` with all built-in command handlers
- [ ] R-SPLIT-25: Move `CorePipesBundle` with all built-in pipe functions
- [ ] R-SPLIT-26: Create `runProgram()` function as batteries-included entry point

### Integration

**Last updated:** 2026-01-23
**Progress:** 0/4

- [ ] R-SPLIT-31: BSL package declares `@massivoto/runtime` as peer dependency
- [ ] R-SPLIT-32: BSL package imports interfaces from `@massivoto/runtime`
- [ ] R-SPLIT-33: Create integration test showing Apache + BSL packages working together
- [ ] R-SPLIT-34: Document usage pattern in both package READMEs

## Usage After Split

### Apache 2.0 Only (No Execution)

```typescript
// Build DSL tooling without execution (Apache 2.0 only)
import { parseProgram, ProgramNode } from '@massivoto/runtime'

const ast: ProgramNode = parseProgram(`
  @utils/set input="hello" output=greeting
  @utils/log message=greeting
`)

// Can analyze AST, build linters, formatters, IDE plugins
console.log(ast.statements.length) // 2
```

### With BSL Engine (Full Execution)

```typescript
// Full execution requires BSL package
import { createRunner } from '@massivoto/runtime'
import { Interpreter, CoreHandlersBundle, CorePipesBundle } from '@massivoto/runtime-engine'

// Create interpreter with batteries included
const interpreter = new Interpreter({
  handlers: new CoreHandlersBundle(),
  pipes: new CorePipesBundle()
})

// Inject into runner
const runner = createRunner(interpreter)

// Execute program
const result = await runner.run(`
  @utils/set input="hello" output=greeting
  @utils/log message=greeting
`)
```

### Batteries-Included (BSL Convenience)

```typescript
// One-liner for full execution (BSL)
import { runProgram } from '@massivoto/runtime-engine'

const result = await runProgram(`
  @utils/set input="hello" output=greeting
  @utils/log message=greeting
`)
```

## Acceptance Criteria

### Theme

> **Theme:** Restaurant Kitchen
>
> A restaurant (platform) has a kitchen (runtime). The recipe book (parser) and
> ingredient list (domain types) are public knowledge. But the chef's techniques
> (interpreter) and secret spice blends (core handlers) are trade secrets that
> make the restaurant special.

### Criteria

**Interface Extraction:**

- [ ] AC-SPLIT-01: Given a developer imports `@massivoto/runtime`, when they access
      `IInterpreter`, then the interface is available without importing BSL package
- [ ] AC-SPLIT-02: Given the Apache package exports `IInterpreter`, when a third party
      creates their own `MyInterpreter implements IInterpreter`, then it compiles successfully

**Dependency Direction:**

- [ ] AC-SPLIT-03: Given the Apache 2.0 package, when checking its dependencies, then
      it does NOT depend on `@massivoto/runtime-engine` (BSL)
- [ ] AC-SPLIT-04: Given the BSL package, when checking its dependencies, then it
      declares `@massivoto/runtime` as a peer dependency

**Execution:**

- [ ] AC-SPLIT-05: Given a developer uses only Apache 2.0 packages, when they try to
      execute a program, then they get a clear error that an interpreter is required
- [ ] AC-SPLIT-06: Given a developer installs both packages, when they call
      `createRunner(new Interpreter())`, then programs execute successfully

**Licensing:**

- [ ] AC-SPLIT-07: Given the Apache 2.0 package, when checking `package.json`, then
      `license` field is "Apache-2.0"
- [ ] AC-SPLIT-08: Given the BSL package, when checking `package.json`, then
      `license` field is "BSL-1.1" and LICENSE file contains BSL text

## Migration Steps

### Phase 1: Interface Extraction (in current repo)

1. Create `src/interfaces/` directory
2. Extract `IInterpreter` from current `Interpreter` class
3. Extract `IEvaluator` from current `ExpressionEvaluator` class
4. Update existing classes to `implements` the interfaces
5. All tests should still pass

### Phase 2: LocalRunner Refactoring (in current repo)

1. Modify `LocalRunner` to accept `IInterpreter` via DI
2. Create factory function `createRunner(interpreter: IInterpreter)`
3. Update internal tests to pass interpreter explicitly
4. All tests should still pass

### Phase 3: BSL Package Creation (new repo)

1. Create `massivoto-runtime-engine` repository
2. Copy interpreter, evaluator, handlers, pipes
3. Add BSL 1.1 license
4. Set up npm publishing
5. Create integration tests

### Phase 4: Cleanup (in current repo)

1. Remove moved files from Apache package
2. Update exports
3. Add peer dependency note in README
4. Publish new version

## Open Questions

- [ ] Should `ScopeChain` stay in Apache or move to BSL?
  - **Leaning:** Apache (it's a utility, no strategic value)
- [ ] Should we keep a "batteries included" re-export in Apache that includes BSL?
  - **Leaning:** No (would blur license boundary)
- [ ] Version coordination between repos?
  - **Leaning:** Semantic versioning, document compatible versions
- [ ] Where do tests live for interface contracts?
  - **Leaning:** Apache repo has interface tests, BSL repo has implementation tests

## Dependencies

- **Depends on:** License strategy approval (license.wip.prd.md)
- **Blocks:**
  - BSL repo creation
  - Apache 2.0 runtime publication
  - massivoto-custom template creation

## File Structure (After Split)

### Apache 2.0: packages/runtime

```
packages/runtime/
├── LICENSE                    # Apache 2.0
├── package.json
├── src/
│   ├── index.ts               # Main exports
│   ├── compiler/
│   │   └── parser/            # All parser code
│   ├── domain/                # All domain types
│   ├── interfaces/            # NEW
│   │   ├── index.ts
│   │   ├── interpreter.ts     # IInterpreter, IEvaluator
│   │   ├── command-handler.ts # CommandHandler interface
│   │   ├── pipe-function.ts   # IPipeFunction interface
│   │   └── registries.ts      # ICommandRegistry, IPipeRegistry
│   ├── scope-chain/
│   │   └── scope-chain.ts
│   └── runner/
│       └── local-runner.ts    # createRunner(interpreter)
└── README.md
```

### BSL 1.1: massivoto-runtime-engine (separate repo)

```
massivoto-runtime-engine/
├── LICENSE                    # BSL 1.1
├── package.json
├── src/
│   ├── index.ts               # Main exports including runProgram()
│   ├── interpreter/
│   │   ├── interpreter.ts     # Interpreter implements IInterpreter
│   │   ├── evaluators.ts      # ExpressionEvaluator implements IEvaluator
│   │   └── program-runner.ts  # runProgram() batteries-included
│   ├── handlers/
│   │   ├── command-registry.ts
│   │   └── core-handlers-bundle/
│   └── pipes/
│       ├── pipe-registry.ts
│       └── core-pipes-bundle/
└── README.md
```
