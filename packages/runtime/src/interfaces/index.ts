/**
 * Runtime Interfaces
 *
 * R-SEP-05: Export all interfaces for dependency injection.
 * These interfaces define the contracts between:
 * - @massivoto/runtime (Apache 2.0) - interfaces, parser, domain types
 * - @massivoto/interpreter (BSL 1.1) - implementations
 *
 * @example
 * ```typescript
 * import {
 *   Interpreter,
 *   Evaluator,
 *   CommandRegistry,
 *   PipeRegistry,
 *   createRunner,
 * } from '@massivoto/runtime'
 *
 * // Inject interpreter implementation at runtime
 * import { CoreInterpreter } from '@massivoto/interpreter'
 * const runner = createRunner(new CoreInterpreter(registry, evaluator))
 * ```
 */

// Interpreter interface
export type {
  Interpreter,
  FlowControl,
  StatementResult,
} from './interpreter.js'

// Evaluator interface
export type { Evaluator } from './evaluator.js'

// CommandRegistry interface
export type {
  CommandRegistry,
  CommandHandler,
  ActionResult,
} from './command-registry.js'

// PipeRegistry interface
export type { PipeRegistry, PipeFunction } from './pipe-registry.js'
