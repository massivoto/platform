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
 * } from '@massivoto/runtime'
 *
 * // Inject implementation
 * import { CoreInterpreter } from '@massivoto/interpreter'
 * const runner = createRunner(new CoreInterpreter())
 * const result = await runner.run(program, context)
 * ```
 *
 * @license Apache-2.0
 */

// =============================================================================
// INTERFACES - Contracts for dependency injection
// =============================================================================

export type {
  // Interpreter interface
  Interpreter,
  FlowControl,
  StatementResult,
  // Evaluator interface
  Evaluator,
  // Registry interfaces
  CommandRegistry,
  CommandHandler,
  ActionResult,
  PipeRegistry,
  PipeFunction,
} from './interfaces/index.js'

// =============================================================================
// DOMAIN TYPES - Execution context and results
// =============================================================================

export type { ExecutionContext, ExecutionStatus } from '@massivoto/kit'

export type { ActionLog } from '@massivoto/kit'
export type { BatchResult } from '@massivoto/kit'
export type { ProgramResult, CostInfo } from '@massivoto/kit'
export {
  createNormalCompletion,
  createEarlyExit,
  createReturn,
} from '@massivoto/kit'

// =============================================================================
// PARSER - AST types and parsing
// =============================================================================

export type {
  ProgramNode,
  StatementNode,
  InstructionNode,
  BlockNode,
  ExpressionNode,
  IdentifierNode,
  LiteralNode,
  MemberExpressionNode,
  UnaryExpressionNode,
  BinaryExpressionNode,
  LogicalExpressionNode,
  ArrayLiteralNode,
  ActionNode,
  ArgumentNode,
  ForEachArgNode,
} from './interpreter/parser/ast.js'

export type {
  PipeExpressionNode,
  PipeSegment,
} from './interpreter/parser/args-details/pipe-parser/pipe-parser.js'

export { parseProgram } from './interpreter/parser/program-parser.js'

// =============================================================================
// SCOPE CHAIN - Variable resolution utilities
// =============================================================================

export {
  createEmptyScopeChain,
  pushScope,
  popScope,
  lookup,
  write,
  cloneScopeChain,
} from './interpreter/evaluator/scope-chain.js'

// =============================================================================
// RUNNER - Program execution with DI
// =============================================================================

export { createRunner, type Runner } from './runner/local-runner.js'
