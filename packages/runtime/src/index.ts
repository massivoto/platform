/**
 * @massivoto/runtime - Automation Programming Language Runtime
 *
 * This package provides:
 * - Interfaces for dependency injection (Interpreter, Evaluator, CommandRegistry, PipeRegistry)
 * - Parser for OTO DSL (AST generation)
 * - Domain types (ExecutionContext, ProgramResult, ActionLog, etc.)
 * - Runner factory for program execution
 *
 * Implementations of the interfaces live in @massivoto/interpreter (BSL 1.1 licensed).
 *
 * @example
 * ```typescript
 * import {
 *   Interpreter,
 *   ExecutionContext,
 *   ProgramResult,
 *   createRunner,
 * } from '@massivoto/interpreter'
 *
 * // Inject implementation
 * import { CoreInterpreter } from '@massivoto/interpreter'
 * const runner = createRunner(new CoreInterpreter())
 * const result = await runner.run(program, context)
 *
 * or runLocalProgram ...
 * TODO AI : correct those examples
 * ```
 *
 * @license Apache-2.0
 */

// =============================================================================
// RUNNER - Program execution with DI
// =============================================================================

export { createRunner, type Runner } from './runner/local-runner.js'
