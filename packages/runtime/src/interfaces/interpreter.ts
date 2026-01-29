/**
 * Interpreter Interface
 *
 * R-SEP-01: Defines the contract for program execution engines.
 * The runtime package provides this interface; implementations
 * live in @massivoto/interpreter (BSL 1.1 licensed).
 *
 * @example
 * ```typescript
 * import { Interpreter, ExecutionContext, ProgramResult } from '@massivoto/runtime'
 * import { CoreInterpreter } from '@massivoto/interpreter'
 *
 * const interpreter: Interpreter = new CoreInterpreter(registry, evaluator)
 * const result = await interpreter.executeProgram(program, context)
 * ```
 */
import type { ExecutionContext } from '@massivoto/kit'
import type { ProgramResult } from '@massivoto/kit'
import type { InstructionNode, ProgramNode } from '../interpreter/parser/ast.js'

/**
 * Flow control signal from statement execution.
 * Used to signal goto, exit, or return to the program loop.
 */
export type FlowControl =
  | { type: 'continue' }
  | { type: 'goto'; target: string }
  | { type: 'exit'; code: number }
  | { type: 'return'; value: unknown }

/**
 * Result of executing a single statement.
 * Includes the updated context, flow control signal, and optional action log.
 */
export interface StatementResult {
  context: ExecutionContext
  flow: FlowControl
  cost: number
}

/**
 * Interpreter interface for executing OTO programs.
 *
 * Implementations must provide:
 * - execute(): Execute a single instruction
 * - executeProgram(): Execute a full program
 *
 * The interface is designed for dependency injection:
 * ```typescript
 * const runner = createRunner(interpreter)
 * ```
 */
export interface Interpreter {
  /**
   * Execute a single instruction and return the updated context and flow control.
   *
   * @param instruction - The instruction AST node to execute
   * @param context - Current execution context
   * @returns Promise resolving to StatementResult with updated context and flow control
   */
  execute(
    instruction: InstructionNode,
    context: ExecutionContext,
  ): Promise<StatementResult>

  /**
   * Execute a full program (sequence of statements).
   *
   * Handles:
   * - Sequential instruction execution
   * - Conditional blocks (if=)
   * - Iteration blocks (forEach=)
   * - Flow control (goto, exit, return)
   * - Label-based jumps
   *
   * @param program - The program AST node to execute
   * @param context - Initial execution context
   * @returns Promise resolving to ProgramResult with final state and outcome
   */
  executeProgram(
    program: ProgramNode,
    context: ExecutionContext,
  ): Promise<ProgramResult>
}
