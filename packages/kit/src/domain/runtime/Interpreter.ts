/**
 * Interpreter interface - abstract interface for program execution.
 *
 * This interface defines the contract for interpreters that execute programs.
 * The concrete implementation (CoreInterpreter) lives in the interpreter package.
 *
 * Type parameters use `unknown` for AST types since those are defined
 * in the interpreter package, not in kit.
 */
import type { ExecutionContext } from '../execution-context/index.js'
import type { ActionLog } from '../action-log.js'
import type { ProgramResult } from './program-result.js'

/**
 * Flow control result from a statement execution.
 * Used to signal goto, exit, or return to the program loop.
 */
export type FlowControl =
  | { type: 'continue' }
  | { type: 'goto'; target: string }
  | { type: 'exit'; code: number }
  | { type: 'return'; value: unknown }

/**
 * LabelLocation type for path-based label indexing.
 * Path is an array of indices to reach the label in the AST.
 */
export interface LabelLocation {
  path: number[]
  instruction: unknown // InstructionNode from interpreter
}

/**
 * Enhanced label index mapping label names to LabelLocation.
 */
export type EnhancedLabelIndex = Map<string, LabelLocation>

/**
 * Result of executing a single statement.
 * Includes the updated context, flow control signal, and action log.
 */
export interface StatementResult {
  context: ExecutionContext
  flow: FlowControl
  log?: ActionLog
  cost: number
}

/**
 * Outcome of an instruction execution.
 */
export interface InstructionOutcome {
  success: boolean
  value?: unknown
  error?: string
}

/**
 * Output target namespace and key parsed from output=... argument.
 */
export interface OutputTarget {
  namespace: 'data' | 'scope'
  key: string
}

/**
 * Parses an output target string to determine namespace and key.
 *
 * - `scope.user` -> { namespace: 'scope', key: 'user' }
 * - `scope.user.profile` -> { namespace: 'scope', key: 'user.profile' }
 * - `user` -> { namespace: 'data', key: 'user' }
 * - `data.user` -> { namespace: 'data', key: 'data.user' } (no special casing)
 */
export function parseOutputTarget(output: string): OutputTarget {
  if (output.startsWith('scope.')) {
    return {
      namespace: 'scope',
      key: output.slice(6),
    }
  }
  return {
    namespace: 'data',
    key: output,
  }
}

/**
 * Interpreter interface for executing programs and instructions.
 *
 * @example
 * ```typescript
 * const interpreter: Interpreter = new CoreInterpreter(registry, evaluator)
 * const result = await interpreter.executeProgram(program, context)
 * ```
 */
export interface Interpreter {
  /**
   * Execute a single instruction and return both the updated context
   * and flow control signal.
   *
   * @param instruction - The instruction AST node to execute
   * @param context - Current execution context
   * @returns Statement result with updated context, flow control, log, and cost
   */
  execute(
    instruction: unknown,
    context: ExecutionContext,
  ): Promise<StatementResult>

  /**
   * Execute a full program (sequence of statements).
   * Handles InstructionNode, BlockNode, flow control, and labels.
   *
   * @param program - The program AST node
   * @param context - Initial execution context
   * @returns Program result with batches, context, exit code, etc.
   */
  executeProgram(
    program: unknown,
    context: ExecutionContext,
  ): Promise<ProgramResult>
}
