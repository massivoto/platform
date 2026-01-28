# PRD: Interpreter Separation

**Status:** DRAFT
**Last updated:** 2026-01-28

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: Interface Extraction | ❌ Not Started | 0/5 |
| Requirements: BSL Package Creation | ❌ Not Started | 0/6 |
| Requirements: Dependency Injection | ❌ Not Started | 0/3 |
| Requirements: Distribution | ❌ Not Started | 0/4 |
| Acceptance Criteria | ❌ Not Started | 0/6 |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [License Strategy](../../license.wip.prd.md)

## Child PRDs

- None

## Context

The Massivoto platform needs a hybrid licensing model:
- **Apache 2.0**: Parser, AST, domain types, interfaces (commodity code)
- **BSL 1.1**: Interpreter, evaluator, handlers, pipes (strategic execution engine)

Currently, everything lives in `@massivoto/runtime`. We need to extract the strategic parts into a separate repository `@massivoto/interpreter` under BSL 1.1 license.

### Why Separate Repos?

| Alternative | Problem |
|-------------|---------|
| Everything Apache 2.0 | No protection against commoditization |
| Everything BSL | Parser/AST is commodity, freine l'adoption inutilement |
| Same monorepo, different licenses | Risk of mixing imports, legal ambiguity |
| **Separate repos** | Clear legal boundary, explicit dependencies |

### Current vs Target

```
CURRENT: packages/runtime/ (all Apache 2.0)
├── interpreter/
│   ├── parser/           <- STAYS (commodity)
│   ├── interpreter.ts    <- MOVES (strategic)
│   ├── evaluator.ts      <- MOVES (strategic)
│   ├── command-registry/ <- MOVES (strategic)
│   └── pipe-registry/    <- MOVES (strategic)
└── domain/               <- STAYS (commodity)

TARGET:
┌─────────────────────────────────────┐
│ @massivoto/runtime (Apache 2.0)    │
│ - Parser, AST, domain types        │
│ - Interfaces: Interpreter, Evaluator│
│ - LocalRunner shell (accepts DI)   │
└─────────────────────────────────────┘
                │
                │ implements
                ▼
┌─────────────────────────────────────┐
│ @massivoto/interpreter (BSL 1.1)   │
│ - CoreInterpreter                  │
│ - ExpressionEvaluator              │
│ - CoreCommandRegistry              │
│ - CorePipeRegistry                 │
└─────────────────────────────────────┘
```

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-28 | Interface naming | **No `I` prefix** | Interface gets clean name (`Interpreter`), impl gets qualifier (`CoreInterpreter`) |
| 2026-01-28 | Package name | **`@massivoto/interpreter`** | Clearer than `runtime-engine`, matches the extracted directory |
| 2026-01-28 | Repo location | **Separate repo** | `C:\code\nik\massivoto\massivoto-interpreter` - clear legal boundary |
| 2026-01-28 | kit dependency | **Accept in V1** | Cleanup deferred to V2, not blocking |

## Scope

**In scope:**

- Extract interfaces to `@massivoto/runtime` (Apache 2.0)
- Create `@massivoto/interpreter` repo with BSL 1.1 license
- Move interpreter, evaluator, command-registry, pipe-registry to new repo
- Factory injection pattern: `createRunner(interpreter: Interpreter)`
- Publish to npm (with manual validation)

**Out of scope:**

- Parser stays in runtime (commodity)
- CI/CD for new repo (later)
- External documentation (no external audience yet)
- CLA bot (no external contributors yet)
- Removing `@massivoto/kit` dependency (V2 cleanup)

## Requirements

### Interface Extraction

**Last updated:** 2026-01-28
**Test:** `npx vitest run packages/runtime/src/interfaces`
**Progress:** 0/5 (0%)

- ❌ R-SEP-01: Create `Interpreter` interface with `execute(instruction, context): Promise<StatementResult>` and `executeProgram(program, context): Promise<ProgramResult>`
- ❌ R-SEP-02: Create `Evaluator` interface with `evaluate(expr, context): unknown`
- ❌ R-SEP-03: Create `CommandRegistry` interface with `resolve(actionPath): Promise<CommandHandler | undefined>`, `addBundle()`, `reload()`
- ❌ R-SEP-04: Create `PipeRegistry` interface with `get(pipeId): Promise<PipeFunction | undefined>`, `addBundle()`, `reload()`
- ❌ R-SEP-05: Export all interfaces and required domain types from `@massivoto/runtime` entry point

### BSL Package Creation

**Last updated:** 2026-01-28
**Test:** `npx vitest run` (in interpreter repo)
**Progress:** 0/6 (0%)

- ❌ R-SEP-11: Create repository at `C:\code\nik\massivoto\massivoto-interpreter` with BSL 1.1 LICENSE file
- ❌ R-SEP-12: Create `CoreInterpreter` class implementing `Interpreter` interface
- ❌ R-SEP-13: Create `ExpressionEvaluator` class implementing `Evaluator` interface
- ❌ R-SEP-14: Move `CoreCommandRegistry` implementing `CommandRegistry` interface
- ❌ R-SEP-15: Move `CorePipeRegistry` implementing `PipeRegistry` interface
- ❌ R-SEP-16: Move `CoreHandlersBundle` and `CorePipesBundle` with all built-in implementations

### Dependency Injection

**Last updated:** 2026-01-28
**Test:** `npx vitest run packages/runtime/src/runner`
**Progress:** 0/3 (0%)

- ❌ R-SEP-21: Refactor `LocalRunner` to accept `Interpreter` via constructor: `createRunner(interpreter: Interpreter): Runner`
- ❌ R-SEP-22: Runtime package must NOT import from `@massivoto/interpreter` (zero direct imports)
- ❌ R-SEP-23: Interpreter package declares `@massivoto/runtime` as peer dependency

### Distribution

**Last updated:** 2026-01-28
**Test:** Manual validation
**Progress:** 0/4 (0%)

- ❌ R-SEP-31: Package builds with TypeScript strict mode and ESM target
- ❌ R-SEP-32: `package.json` has `license: "BSL-1.1"` and correct peer dependency
- ❌ R-SEP-33: Run `npm pack` and verify tarball contents
- ❌ R-SEP-34: **MANUAL**: Publish to npm and verify install works in platform monorepo

## Dependencies

- **Depends on:** License strategy (license.wip.prd.md)
- **Blocks:** massivoto-custom template, SaaS deployment

## Open Questions

- [x] Interface naming: `IInterpreter` vs `Interpreter`? **Decision: No prefix**
- [x] Package name: `runtime-engine` vs `interpreter`? **Decision: interpreter**
- [ ] Does `interpreter/` import anything from `@massivoto/kit`? Need to verify before extraction
- [x] npm credentials: Do we have publish access to `@massivoto/` scope? -> yes

## Acceptance Criteria

### Theme

> **Theme:** Restaurant Kitchen
>
> The restaurant (platform) has a public recipe book (parser, AST) that anyone can read.
> But the chef's secret techniques (interpreter) and signature spice blends (handlers)
> are trade secrets that make the restaurant special.

### Criteria

- [ ] AC-SEP-01: Given a developer imports `@massivoto/runtime`, when they access `Interpreter` interface, then it compiles without installing BSL package
- [ ] AC-SEP-02: Given the runtime `package.json`, when checking dependencies, then `@massivoto/interpreter` is NOT listed (no direct dependency)
- [ ] AC-SEP-03: Given the interpreter `package.json`, when checking, then `@massivoto/runtime` is listed as peer dependency
- [ ] AC-SEP-04: Given both packages installed, when calling `createRunner(new CoreInterpreter())`, then OTO programs execute correctly
- [ ] AC-SEP-05: Given all existing interpreter tests, when run in new repo, then 100% pass
- [ ] AC-SEP-06: **MANUAL**: Given `npm install @massivoto/interpreter` in platform monorepo, when importing `CoreInterpreter`, then it resolves correctly

## Pre-Implementation Checklist

Before starting implementation, verify:

1. [ ] **Self-containment check**: Run analysis to confirm `interpreter/` doesn't import outside itself (except `parser/`)
2. [ ] **kit dependencies**: List all `@massivoto/kit` imports in interpreter code
3. [ ] **npm credentials**: Confirm publish access to `@massivoto/` scope

## Implementation Order

1. **Verify self-containment** (blocker if fails)
2. **Extract interfaces** in runtime (R-SEP-01 to R-SEP-05)
3. **Refactor LocalRunner** for DI (R-SEP-21)
4. **Create BSL repo** (R-SEP-11)
5. **Move implementations** (R-SEP-12 to R-SEP-16)
6. **Wire up dependencies** (R-SEP-22, R-SEP-23)
7. **Build and pack** (R-SEP-31 to R-SEP-33)
8. **Manual npm publish** (R-SEP-34) - requires human validation
