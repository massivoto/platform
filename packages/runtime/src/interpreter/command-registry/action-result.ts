/**
 * ActionResult - the return type for command handler execution.
 *
 * Note: The interpreter handles InstructionLog creation.
 * Handlers just report success/failure, value, and cost.
 */

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

  /** Error message if the command failed fatally */
  fatalError?: string

  /** All messages generated during execution */
  messages: string[]

  /** Primary message for the action result */
  message?: string

  /** Cost in credits (handler reports its cost, 0 for free commands) */
  cost: number
}
