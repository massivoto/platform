/**
 * ActionResult - the return type for command handler execution.
 */
import type { InstructionLog } from '../../domain/execution-context.js'

/**
 * Result of a command handler execution.
 *
 * @template T - The type of the value returned on success
 */
export interface ActionResult<T> {
  /** Whether the command executed successfully */
  success: boolean

  /** If success and pertinent, the value returned by the action */
  value?: T

  /** Path of the state variable affected by the action */
  output?: string

  /** Error message if the command failed fatally */
  fatalError?: string

  /** Execution log for history tracking */
  log: InstructionLog

  /** All messages generated during execution */
  messages: string[]

  /** Primary message for the action result */
  message?: string
}
