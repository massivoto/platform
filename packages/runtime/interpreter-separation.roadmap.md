# Feature Roadmap: Interpreter Separation

## 1. Roadmap Vision

Extract the strategic execution engine (`interpreter/`) from `@massivoto/runtime` into a separate BSL-licensed package `@massivoto/interpreter`, enabling a hybrid open-source model where commodity code (parser, AST, types) remains Apache 2.0 while the core execution logic is protected under BSL 1.1.

## 2. Functional Pillars

### Pillar A: Interface Extraction
**Objective:** Define clean contract boundaries in the Apache 2.0 runtime package that BSL code can implement.

**Features:**
- `Interpreter` interface for instruction execution *(from Axis 7: Core Features)*
- `Evaluator` interface for expression evaluation *(from Axis 7: Core Features)*
- `CommandRegistry` interface for command resolution *(from Axis 7: Core Features)*
- `PipeRegistry` interface for pipe resolution *(from Axis 7: Core Features)*
- Export all domain types required by interpreter implementations

### Pillar B: BSL Package Creation
**Objective:** Create the `@massivoto/interpreter` package with all execution logic under BSL 1.1 license.

**Features:**
- New repository at `C:\code\nik\massivoto\massivoto-interpreter` *(from Axis 6: Functional Scope)*
- `CoreInterpreter` implementing `Interpreter` interface *(from Axis 7: Core Features)*
- `ExpressionEvaluator` implementing `Evaluator` interface *(from Axis 7: Core Features)*
- `CoreCommandRegistry` implementing `CommandRegistry` interface
- `CorePipeRegistry` implementing `PipeRegistry` interface
- BSL 1.1 LICENSE file in repository root

### Pillar C: Dependency Injection
**Objective:** Enable runtime to consume interpreter without hard dependency, maintaining license separation.

**Features:**
- Factory function `createRunner(interpreter: Interpreter): Runner` *(from Axis 7: Core Features)*
- Interpreter as peer dependency pattern
- Zero runtime-to-interpreter direct imports

### Pillar D: Distribution
**Objective:** Make the BSL package consumable by the platform monorepo.

**Features:**
- npm package `@massivoto/interpreter` published to npmjs.com *(from Axis 7: Core Features)*
- TypeScript strict compilation with ESM target
- Peer dependency on `@massivoto/runtime` for interfaces

## 3. Cross-Cutting Features

- All existing interpreter tests must pass after separation *(from Axis 10: Edge Cases)*
- Build order enforced via npm dependency graph
- No circular imports between runtime and interpreter packages

## 4. Explicit Out-of-Scope

- Parser code stays in runtime (commodity, Apache 2.0) *(from Axis 6: Functional Scope)*
- CI/CD pipeline for new repo *(from Axis 6: Functional Scope)*
- External documentation *(from Axis 6: Functional Scope)*
- CLA bot for contributors *(from Axis 6: Functional Scope)*
- Removing `@massivoto/kit` dependency (deferred to V2) *(from Axis 9: Version Assignment)*

## 5. Open Points

- Verify interpreter directory is self-contained (no imports outside `interpreter/` except `parser/`) *(from Axis 14: Gaps)*
- List exact `@massivoto/kit` usages to assess V2 cleanup scope *(from Axis 14: Gaps)*
- Confirm npm publish credentials for `@massivoto/` scope *(from Axis 14: Gaps)*
