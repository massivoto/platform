/**
 * ProgramResult - the return type for program execution.
 *
 * Wraps ExecutionContext with program outcome information:
 * - exitCode: 0 for success, non-zero for failure (C/Unix convention)
 * - exitedEarly: true if @flow/exit or @flow/return was called
 * - value: optional return value from @flow/return
 * - exitedAt: batch index where exit occurred
 *
 * Result Hierarchy (marketing-friendly terminology):
 * - ProgramResult (program-level): batches[], duration, data, cost, context, exitCode, value
 * - BatchResult (batch-level): success, message, actions[], totalCost, duration
 * - ActionLog (action-level): command, success, duration, cost, messages, output, value
 *
 * Requirements:
 * - R-GOTO-81: ProgramResult interface defined in domain/program-result.ts
 * - R-GOTO-82: runProgram() returns Promise<ProgramResult>
 * - R-GOTO-83: Normal completion yields exitCode=0, exitedEarly=false
 * - R-GOTO-84: @flow/exit sets exitCode and exitedEarly=true
 * - R-GOTO-85: @flow/return sets value and exitCode=0
 * - R-TERM-22: ProgramResult uses batches: BatchResult[] instead of history
 */
import type { ExecutionContext } from './execution-context'
import type { BatchResult } from './batch-result'
import { SerializableObject } from '../network'

/**
 * Cost tracking information for program execution.
 */
export interface CostInfo {
  current: number // accumulated cost during execution
}

/**
 * Result of executing an OTO program.
 *
 * @example Normal completion
 * ```typescript
 * const result = await runProgram(`@utils/set input="done" output=status`)
 * // result.exitCode === 0
 * // result.exitedEarly === false
 * // result.data.status === "done"
 * // result.batches[0].actions[0].command === "@utils/set"
 * ```
 *
 * @example Early exit with code
 * ```typescript
 * const result = await runProgram(`@flow/exit code=1`)
 * // result.exitCode === 1
 * // result.exitedEarly === true
 * ```
 *
 * @example Return with value
 * ```typescript
 * const result = await runProgram(`
 *   @utils/set input=100 output=price
 *   @flow/return value={price * 1.2}
 * `)
 * // result.value === 120
 * // result.exitCode === 0
 * // result.exitedEarly === true
 * ```
 */
export interface ProgramResult {
  // ============================================================================
  // EXECUTION RESULTS - Batches organized by grouping
  // ============================================================================

  /**
   * R-TERM-22: Execution organized by batch.
   * Each batch represents a logical grouping (block, forEach iteration, top-level).
   * Use result.batches[0].actions to access individual action logs.
   */
  batches: BatchResult[]

  /**
   * Total duration in milliseconds for the entire program.
   */
  duration: number

  // ============================================================================
  // FLAT API - Primary access for most use cases
  // ============================================================================

  /**
   * Copy of final context.data for easy access.
   * Use result.data.user instead of result.context.data.user
   */
  data: SerializableObject

  /**
   * Cost tracking information.
   * Use result.cost.current instead of result.context.cost.current
   */
  cost: CostInfo

  /**
   * User information from context.
   * Use result.user.id instead of result.context.user.id
   */
  user: {
    id: string
    extra: SerializableObject
  }

  /**
   * Metadata from context.
   * Use result.meta.updatedAt instead of result.context.meta.updatedAt
   */
  meta: {
    tool?: string
    updatedAt: string
  }

  /**
   * Scope chain from context for easy access.
   * Use result.scopeChain instead of result.context.scopeChain
   */
  scopeChain: ExecutionContext['scopeChain']

  // ============================================================================
  // ADVANCED ACCESS - For scopeChain, env, store access
  // ============================================================================

  /**
   * The final execution context after program execution.
   * Use for advanced access to scopeChain, env, store, etc.
   */
  context: ExecutionContext

  // ============================================================================
  // PROGRAM OUTCOME - Exit code and early termination
  // ============================================================================

  /**
   * Exit code following C/Unix convention:
   * - 0 = success
   * - non-zero = failure or specific error code
   *
   * Set by @flow/exit code=N or defaults to 0.
   */
  exitCode: number

  /**
   * Optional return value from @flow/return.
   * Can be any serializable value (string, number, object, array, etc.)
   */
  value?: unknown

  /**
   * True if the program terminated early via @flow/exit or @flow/return.
   * False if the program ran to completion.
   */
  exitedEarly: boolean

  /**
   * 0-based index where @flow/exit or @flow/return was executed.
   * Only set when exitedEarly is true.
   */
  exitedAt?: number
}

/**
 * Create a ProgramResult for normal program completion.
 *
 * @param context - The final execution context
 * @param batches - Execution batches
 * @param cost - Cost tracking information
 * @param duration - Total duration in milliseconds
 */
export function createNormalCompletion(
  context: ExecutionContext,
  batches: BatchResult[] = [],
  cost: CostInfo = { current: 0 },
  duration: number = 0,
): ProgramResult {
  return {
    // Execution results
    batches,
    duration,
    // Flat API
    data: { ...context.data },
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
    },
    scopeChain: context.scopeChain,
    // Advanced access
    context,
    // Program outcome
    exitCode: 0,
    exitedEarly: false,
    value: undefined,
  }
}

/**
 * Create a ProgramResult for early exit via @flow/exit.
 *
 * @param context - The execution context at exit
 * @param exitCode - The exit code (default 0)
 * @param exitedAt - Index where exit occurred
 * @param batches - Execution batches
 * @param cost - Cost tracking information
 * @param duration - Total duration in milliseconds
 */
export function createEarlyExit(
  context: ExecutionContext,
  exitCode: number,
  exitedAt: number,
  batches: BatchResult[] = [],
  cost: CostInfo = { current: 0 },
  duration: number = 0,
): ProgramResult {
  return {
    // Execution results
    batches,
    duration,
    // Flat API
    data: { ...context.data },
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
    },
    scopeChain: context.scopeChain,
    // Advanced access
    context,
    // Program outcome
    exitCode,
    exitedEarly: true,
    exitedAt,
  }
}

/**
 * Create a ProgramResult for @flow/return.
 *
 * @param context - The execution context at return
 * @param value - The return value
 * @param exitedAt - Index where return occurred
 * @param batches - Execution batches
 * @param cost - Cost tracking information
 * @param duration - Total duration in milliseconds
 */
export function createReturn(
  context: ExecutionContext,
  value: unknown,
  exitedAt: number,
  batches: BatchResult[] = [],
  cost: CostInfo = { current: 0 },
  duration: number = 0,
): ProgramResult {
  return {
    // Execution results
    batches,
    duration,
    // Flat API
    data: { ...context.data },
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
    },
    scopeChain: context.scopeChain,
    // Advanced access
    context,
    // Program outcome
    exitCode: 0,
    exitedEarly: true,
    value,
    exitedAt,
  }
}
