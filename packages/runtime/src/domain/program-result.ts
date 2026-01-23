/**
 * ProgramResult - the return type for program execution.
 *
 * Wraps ExecutionContext with program outcome information:
 * - exitCode: 0 for success, non-zero for failure (C/Unix convention)
 * - exitedEarly: true if @flow/exit or @flow/return was called
 * - value: optional return value from @flow/return
 * - exitedAt: instruction index where exit occurred
 *
 * Flat API (R-RES-21 to R-RES-24):
 * - data: Copy of final context.data for easy access
 * - history: Accumulated instruction logs
 * - cost: Cost tracking information
 * - user: User information from context
 * - meta: Metadata from context (tool, updatedAt)
 *
 * Requirements:
 * - R-GOTO-81: ProgramResult interface defined in domain/program-result.ts
 * - R-GOTO-82: runProgram() returns Promise<ProgramResult>
 * - R-GOTO-83: Normal completion yields exitCode=0, exitedEarly=false
 * - R-GOTO-84: @flow/exit sets exitCode and exitedEarly=true
 * - R-GOTO-85: @flow/return sets value and exitCode=0
 */
import type { ExecutionContext, InstructionLog } from './execution-context.js'
import type { SerializableObject } from '@massivoto/kit'

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
 * // result.context.data.status === "done"
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
  // FLAT API (R-RES-21 to R-RES-24) - Primary access for most use cases
  // ============================================================================

  /**
   * R-RES-21: Copy of final context.data for easy access.
   * Use result.data.user instead of result.context.data.user
   */
  data: SerializableObject

  /**
   * R-RES-22: Accumulated instruction logs from execution.
   * Use result.history instead of result.context.meta.history
   */
  history: InstructionLog[]

  /**
   * R-RES-23: Cost tracking information.
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
    history: InstructionLog[] // Alias for backward compatibility during transition
  }

  /**
   * Scope chain from context for easy access.
   * Use result.scopeChain instead of result.context.scopeChain
   */
  scopeChain: ExecutionContext['scopeChain']

  // ============================================================================
  // ADVANCED ACCESS (R-RES-24) - For scopeChain, env, store access
  // ============================================================================

  /**
   * R-RES-24: The final execution context after program execution.
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
   * 0-based instruction index where @flow/exit or @flow/return was executed.
   * Only set when exitedEarly is true.
   */
  exitedAt?: number
}

/**
 * Create a ProgramResult for normal program completion.
 *
 * @param context - The final execution context
 * @param history - Accumulated instruction logs
 * @param cost - Cost tracking information
 */
export function createNormalCompletion(
  context: ExecutionContext,
  history: InstructionLog[] = [],
  cost: CostInfo = { current: 0 },
): ProgramResult {
  return {
    // Flat API
    data: { ...context.data },
    history,
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
      history, // backward compatibility alias
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
 * @param exitedAt - Instruction index where exit occurred
 * @param history - Accumulated instruction logs
 * @param cost - Cost tracking information
 */
export function createEarlyExit(
  context: ExecutionContext,
  exitCode: number,
  exitedAt: number,
  history: InstructionLog[] = [],
  cost: CostInfo = { current: 0 },
): ProgramResult {
  return {
    // Flat API
    data: { ...context.data },
    history,
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
      history, // backward compatibility alias
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
 * @param exitedAt - Instruction index where return occurred
 * @param history - Accumulated instruction logs
 * @param cost - Cost tracking information
 */
export function createReturn(
  context: ExecutionContext,
  value: unknown,
  exitedAt: number,
  history: InstructionLog[] = [],
  cost: CostInfo = { current: 0 },
): ProgramResult {
  return {
    // Flat API
    data: { ...context.data },
    history,
    cost,
    user: { ...context.user },
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
      history, // backward compatibility alias
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
