# PRD: LocalRunner - File-based OTO Execution

**Status:** DRAFT
**Last updated:** 2026-01-26

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Core Concept

**The CLI is a context transformer:**

```
input context (file) → OTO script → output context (file or stdout)
```

The ProgramResult object will wrap the new context, including logs (including errors), command played, costs, duration, etc.
A ProgramResult can also contain a value when the Program will use @flow/return - which is very optional.

This enables:
- Chaining scripts: output of one becomes input of next
- CI/CD integration: pass data via JSON files
- Testing: verify context transformation with fixtures

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: Result Types | Complete | 4/4 |
| Requirements: Core Runner | Draft | 0/6 |
| Requirements: CLI | Draft | 0/10 |
| Requirements: Output | Draft | 0/5 |
| Requirements: Migration | Complete | 3/3 |
| Acceptance Criteria | Draft | 0/19 |
| Theme | Defined | - |
| **Overall** | **DRAFT** | **25%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Local Runner

## Child PRDs

- None (Store and REPL deferred to separate PRDs)

## Context

The ROADMAP v0.5 defines three LocalRunner features:
1. **File-based execution**: run `.oto` files from command line
2. **Local store**: file-based state persistence
3. **REPL mode**: interactive execution for debugging<<

This PRD focuses on **file-based execution only**. Store and REPL are deferred.

We already have:
- `runProgram(source, context?, registry?)` in `interpreter/program-runner.ts`
- Parser in `interpreter/parser/`
- Interpreter in `interpreter/interpreter.ts`
- Evaluator in `interpreter/evaluator/`
- Scope chain and variable resolution
- Execution logging with cost tracking

What we need:
- A `LocalRunner` class that wraps `runProgram()` with file I/O
- A CLI entry point for command-line usage
- Structured output for both programmatic and human consumption

## Decision Log

| Date | Option | Decision                                       | Rationale |
|------|--------|------------------------------------------------|-----------|
| 2026-01-21 | Architecture | **Library + CLI**                              | Testable, embeddable, separation of concerns |
| 2026-01-21 | CLI framework | **Commander**                                  | Lighter (~50KB), zero deps, sufficient for our needs |
| 2026-01-21 | Package location | **packages/runtime**                           | Keep runner with runtime, CLI in bin/ |
| 2026-01-21 | Store implementation | **Deferred**                                   | Not needed for basic file execution |
| 2026-01-21 | REPL implementation | **Deferred**                                   | Not needed for basic file execution |
| 2026-01-21 | Complex --var types | **Deferred**                                   | Simple strings only for v0.5, JSON support later |
| 2026-01-21 | Timing in output | **No**                                         | Not needed |
| 2026-01-21 | File extension | **Required oto.md or *.oto.md**                | Branding feature |
| 2026-01-21 | Output flag name | **--save**                                     | Avoids conflict with OTO reserved word `output` |
| 2026-01-21 | Default output | **ExecutionContext to stdout**                 | CLI as context transformer, enables chaining |
| 2026-01-21 | Result types | **ActionLog + BatchResult + ProgramResult** | Clear hierarchy: Program → Batch → Action |
| 2026-01-21 | InstructionLog | **Remove (breaking)**                          | Replaced by ActionLog |
| 2026-01-26 | Directory structure | **compiler → interpreter**                     | Terminology refactor: compiler/ renamed to interpreter/ for clarity |
| 2026-01-26 | Terminology | **See terminology-refactor.done.prd.md**       | Marketing-first: Program, Action, Batch |

## Scope

**In scope:**
- `LocalRunner` class with `runFile()` method
- CLI binary for `oto run <file>` command
- npx command if possible. We may need to upload to npm
- Context loading from JSON file (`--context` / `-c`)
- Context saving to file (`--save` / `-s`) or stdout
- Variable injection/override via `--var`
- Verbose output mode
- File validation (`oto check <file>`)

**Out of scope:**
- Local store (file-based persistence) - separate PRD
- REPL mode - separate PRD
- Watch mode (auto-re-run on file change)
- Multiple file execution
- Custom registry loading from config

## Requirements

### Result Types

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/domain`
**Progress:** 4/4 (100%)
**Implemented by:** [terminology-refactor.done.prd.md](../terminology-refactor.done.prd.md)

- [x] R-TYPE-01: Create `ActionLog` interface (command, success, timing, cost, messages)
- [x] R-TYPE-02: Create `BatchResult` interface (success, message, actions: ActionLog[], totalCost)
- [x] R-TYPE-03: Update `ProgramResult` to use `batches: BatchResult[]`
- [x] R-TYPE-04: `BatchResult.totalCost` equals sum of all `ActionLog.cost`

### Core Runner

**Last updated:** 2026-01-21
**Test:** `npx vitest run packages/runtime/src/runner/local-runner.spec.ts`
**Progress:** 0/6 (0%)

- [ ] R-LOCAL-01: Create `LocalRunner` class with constructor accepting optional `RunnerOptions`
- [ ] R-LOCAL-02: `runFile(filePath)` reads file from disk and executes with `runProgram()`
- [ ] R-LOCAL-03: `runFile()` throws `FileNotFoundError` if file does not exist
- [ ] R-LOCAL-04: `runFile()` throws `InvalidExtensionError` if file does not have `.oto` extension
- [ ] R-LOCAL-05: `runFile()` accepts `RunOptions` to inject initial context variables
- [ ] R-LOCAL-06: `runFile()` returns `ProgramResult` with success, commands[], context, totalCost

### CLI

**Last updated:** 2026-01-21
**Test:** CLI integration tests (manual or e2e)
**Progress:** 0/10 (0%)

- [ ] R-LOCAL-10: `oto run <file>` parses and executes the specified `.oto` file
- [ ] R-LOCAL-11: `oto run <file> --var key=value` injects variables into context.data
- [ ] R-LOCAL-12: `oto run <file> --verbose` outputs execution log to stderr
- [ ] R-LOCAL-13: `oto check <file>` parses without executing, reports syntax errors
- [ ] R-LOCAL-14: Exit code is 0 on success, 1 on failure
- [ ] R-LOCAL-15: `--context <file>` or `-c` loads partial ExecutionContext from JSON
- [ ] R-LOCAL-16: Missing context fields (data, env, scopeChain) get defaults
- [ ] R-LOCAL-17: `--var` overrides context.data values after context file load
- [ ] R-LOCAL-18: `--save <file>` or `-s` writes resulting context to file instead of stdout
- [ ] R-LOCAL-19: `--result` or `-r` outputs full `ProgramResult` instead of just `ExecutionContext`

### Output

**Last updated:** 2026-01-21
**Test:** `npx vitest run packages/runtime/src/runner/local-runner.spec.ts`
**Progress:** 0/5 (0%)

- [ ] R-LOCAL-20: Default output is serialized ExecutionContext JSON to stdout
- [ ] R-LOCAL-21: `--verbose` outputs execution log entries to stderr (context still to stdout)
- [ ] R-LOCAL-22: Parse errors include line/column information when available
- [ ] R-LOCAL-23: `--save` suppresses stdout (context written to file only)
- [ ] R-LOCAL-24: Context file errors (not found, invalid JSON) exit with code 1 and message

### Migration (Breaking Changes)

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime`
**Progress:** 3/3 (100%)
**Implemented by:** [terminology-refactor.done.prd.md](../terminology-refactor.done.prd.md)

- [x] R-MIGRATE-01: Remove `InstructionLog` interface from `execution-context.ts`
- [x] R-MIGRATE-02: Remove `context.meta.history` field (replaced by `ProgramResult.batches`)
- [x] R-MIGRATE-03: Update all existing tests using `InstructionLog` or `meta.history` to use new types

## Dependencies

- **Depends on:**
  - `runProgram()` in `interpreter/program-runner.ts` (IMPLEMENTED) - core execution (needs update for BatchResult)
  - Parser in `interpreter/parser/` (IMPLEMENTED) - file parsing
  - Interpreter in `interpreter/interpreter.ts` (IMPLEMENTED) - execution (needs update for BatchResult)
  - Evaluator in `interpreter/evaluator/` (IMPLEMENTED) - statement evaluation
  - Scope chain in `interpreter/evaluator/scope-chain.ts` (IMPLEMENTED) - variable resolution
  - [terminology-refactor.done.prd.md](../terminology-refactor.done.prd.md) - defines ActionLog, BatchResult (IMPLEMENTED)

- **Breaks:**
  - `InstructionLog` consumers - must migrate to ActionLog
  - `context.meta.history` consumers - must use ProgramResult.batches
  - Execution logging PRD - needs revision for new types

- **Blocks:**
  - Local store PRD (needs runner infrastructure)
  - REPL PRD (needs runner infrastructure)

## Open Questions

- [x] CLI framework choice: `commander` or `yargs`? → **Commander** (lighter, sufficient)
- [x] Should `--var` support complex types (arrays, objects) via JSON? → **Deferred**, strings only for v0.5
- [x] Should output include timing information (start/end timestamps)? → **No**
- [x] Default file extension: require `.oto` or accept any? → **Required .oto** (branding)

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.done.prd.md](../interpreter/parser/dsl-0.5-parser.done.prd.md)

### Criteria

**File Execution:**
- [ ] AC-LOCAL-01: Given `hello.oto` with `@utils/set input="Emma" output=user`, when running `oto run hello.oto`, then stdout is valid JSON with `data.user` equal to `"Emma"`
- [ ] AC-LOCAL-02: Given a file that does not exist, when running `oto run missing.oto`, then exit code is 1 and error message indicates file not found
- [ ] AC-LOCAL-03: Given a file with syntax error, when running `oto run bad.oto`, then exit code is 1 and error message includes parse error details
- [ ] AC-LOCAL-04: Given a file `script.txt` (wrong extension), when running `oto run script.txt`, then exit code is 1 and error message indicates `.oto` extension required

**Context Loading:**
- [ ] AC-LOCAL-05: Given `context.json` with `{ "data": { "name": "Emma" }, "env": { "MODE": "test" } }`, when running `oto run script.oto -c context.json`, then both `data.name` and `env.MODE` are available during execution
- [ ] AC-LOCAL-06: Given `context.json` with `{ "data": { "x": 1 } }` and `--var x=2`, when running `oto run script.oto -c context.json --var x=2`, then `data.x` is `2` (--var wins)
- [ ] AC-LOCAL-07: Given invalid JSON in context file, when running `oto run script.oto -c bad.json`, then exit code is 1 and error indicates JSON parse failure

**Context Saving:**
- [ ] AC-LOCAL-08: Given `--save result.json`, when running `oto run script.oto --save result.json`, then `result.json` contains serialized ExecutionContext and stdout is empty
- [ ] AC-LOCAL-09: Given no `--save` flag, when running `oto run script.oto`, then stdout contains serialized ExecutionContext JSON

**Chaining:**
- [ ] AC-LOCAL-10: Given two scripts, when running `oto run step1.oto --save temp.json && oto run step2.oto -c temp.json`, then step2 receives step1's output context

**Verbose Output:**
- [ ] AC-LOCAL-11: Given `--verbose`, when running `oto run script.oto --verbose`, then each instruction log appears on stderr as it executes
- [ ] AC-LOCAL-12: Given `--verbose` with `--save`, when running, then logs go to stderr and context goes to file (nothing to stdout)

**Check Mode:**
- [ ] AC-LOCAL-13: Given a valid file, when running `oto check script.oto`, then exit code is 0 and no execution occurs
- [ ] AC-LOCAL-14: Given an invalid file, when running `oto check bad.oto`, then exit code is 1 and parse error is shown

**Programmatic API:**
- [ ] AC-LOCAL-15: Given `LocalRunner` class, when calling `runner.runFile('script.oto')`, then returns `ProgramResult` promise
- [ ] AC-LOCAL-16: Given `RunOptions` with `context: { data: { x: 1 } }`, when running file, then `x` is available in execution
- [ ] AC-LOCAL-18: Given `--result` flag, when running `oto run script.oto --result`, then stdout contains full `ProgramResult` with commands[]

**General:**
- [ ] AC-LOCAL-19: All automated tests pass

## Implementation Notes

### Directory Structure

```
packages/runtime/
  src/
    runner/
      file-runner.ts         # FileRunner class
      file-runner.spec.ts    # Unit tests
      runner.types.ts        # Shared types (errors, options)
      index.ts               # Exports
    bin/
      oto.ts                 # CLI entry point
      oto.spec.ts            # CLI integration tests
```

### Types

```typescript
// ============================================================================
// Result Types - ALREADY IMPLEMENTED in terminology-refactor.done.prd.md
// These types exist in domain/action-log.ts, domain/batch-result.ts, domain/program-result.ts
// ============================================================================

/**
 * Per-action execution log (public, marketing-aligned).
 */
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

/**
 * Aggregation of Actions (Block, Template, any grouping).
 */
export interface BatchResult {
  success: boolean        // all actions succeeded?
  message: string         // batch-level log: "Block 'init' completed"
  actions: ActionLog[]    // per-action execution logs
  totalCost: number       // sum of action costs
  duration: number        // total milliseconds for batch
}

/**
 * Result of executing a full Program.
 * Distinct from BatchResult - has program-level concerns.
 */
export interface ProgramResult {
  batches: BatchResult[]        // execution organized by batch
  duration: number              // total milliseconds for program
  data: SerializableObject      // final context.data
  cost: CostInfo                // total cost tracking
  context: ExecutionContext     // full context for advanced access
  exitCode: number
  exitedEarly: boolean
  value?: unknown               // from @flow/return
}

// ============================================================================
// Runner Options
// ============================================================================

/**
 * Options for creating a LocalRunner instance.
 */
export interface RunnerOptions {
  registry?: CommandRegistry    // Custom command registry
  verbose?: boolean             // Enable verbose logging
}

/**
 * Options for a single run invocation.
 */
export interface RunOptions {
  context?: Partial<ExecutionContext>  // Initial context variables
  verbose?: boolean                    // Override runner verbose setting
}
```

### Breaking Changes

See [terminology-refactor.done.prd.md](../terminology-refactor.done.prd.md) for full details. **Already implemented.**

**Removed: `InstructionLog`** → replaced by `ActionLog`

**Removed: `context.meta.history`** → replaced by `ProgramResult.batches`

```typescript
// AFTER - use ProgramResult.batches
const result = await runner.runFile('script.oto')
result.batches      // BatchResult[]
result.batches[0].actions  // ActionLog[]
```

### LocalRunner Class

```typescript
export class LocalRunner {
  constructor(private options: RunnerOptions = {}) {}

  /**
   * Run a program from a file path.
   * Returns ProgramResult with commands[], context, and totalCost.
   */
  async runFile(filePath: string, options?: RunOptions): Promise<ProgramResult> {
    // 1. Validate file exists and has .oto extension
    // 2. Read file content
    // 3. Merge options.context with createEmptyExecutionContext()
    // 4. Call runProgram(content, mergedContext, this.options.registry)
    // 5. Build and return ProgramResult
  }

  /**
   * Check a file for syntax errors without executing.
   */
  async checkFile(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    // 1. Check file exists
    // 2. Read file content
    // 3. Parse only (no execution)
    // 4. Return validation result
  }
}
```

### CLI Entry Point

```typescript
#!/usr/bin/env node
// bin/oto.ts

import { program } from 'commander'
import { LocalRunner } from '../src/runner/local-runner.js'

program
  .name('oto')
  .description('Execute OTO automation scripts')
  .version('0.5.0')

program
  .command('run <file>')
  .description('Execute an .oto file')
  .option('-c, --context <file>', 'Load ExecutionContext from JSON file')
  .option('-s, --save <file>', 'Save resulting context to file (instead of stdout)')
  .option('-r, --result', 'Output full ProgramResult instead of just context')
  .option('--var <key=value...>', 'Set/override context.data variables')
  .option('--verbose', 'Show execution log on stderr')
  .action(async (file, options) => {
    const runner = new LocalRunner({ verbose: options.verbose })

    // Load context from file if provided
    let context = options.context ? loadContextFile(options.context) : {}

    // Apply --var overrides
    const vars = parseVars(options.var || [])
    context.data = { ...context.data, ...vars }

    const result: ProgramResult = await runner.runFile(file, { context })

    // Output: full result or just context
    const output = options.result ? result : result.context
    const outputJson = JSON.stringify(output, null, 2)

    if (options.save) {
      writeFileSync(options.save, outputJson)
    } else {
      console.log(outputJson)
    }

    process.exit(result.success ? 0 : 1)
  })

program
  .command('check <file>')
  .description('Validate an .oto file without executing')
  .action(async (file) => {
    const runner = new LocalRunner()
    const result = await runner.checkFile(file)
    console.log(result.valid ? 'Valid' : `Errors: ${result.errors.join(', ')}`)
    process.exit(result.valid ? 0 : 1)
  })

program.parse()
```

### Context File Format

Partial ExecutionContext (missing fields get defaults):

```json
{
  "data": {
    "user": "Emma",
    "followers": 1500
  },
  "env": {
    "API_KEY": "sk-xxx",
    "DEBUG": "true"
  }
}
```

### Chaining Example

```bash
# Pipeline: step1 outputs context → step2 uses it
oto run step1.oto -c initial.json --save step1-result.json
oto run step2.oto -c step1-result.json --save final.json

# Or with stdout piping (requires /dev/stdin support)
oto run step1.oto -c initial.json | oto run step2.oto -c /dev/stdin
```

### package.json Addition

```json
{
  "bin": {
    "oto": "./dist/bin/oto.js"
  },
  "dependencies": {
    "commander": "^12.0.0"
  }
}
```
