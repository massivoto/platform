/**
 * BaseCommandHandler - abstract base class for command handlers.
 *
 * Provides default implementations for RegistryItem lifecycle methods
 * and helper methods for creating ActionResult responses.
 *
 * Requirements:
 * - R-CMD-02: Default no-op init() and dispose()
 */
import type { CommandHandler } from './types.js'
import type { ExecutionContext } from '@massivoto/kit'
import type { ActionResult } from './action-result.js'

/**
 * Abstract base class for command handlers.
 *
 * Subclasses must implement:
 * - `id`: Unique identifier in @package/name format
 * - `type`: Always 'command'
 * - `run()`: Execute the command
 *
 * @example
 * ```typescript
 * class LogHandler extends BaseCommandHandler<void> {
 *   readonly id = '@utils/log'
 *   readonly type = 'command' as const
 *
 *   async run(args: Record<string, any>): Promise<ActionResult<void>> {
 *     console.log(args.message)
 *     return this.handleSuccess('Logged message', undefined)
 *   }
 * }
 * ```
 */
export abstract class BaseCommandHandler<T> implements CommandHandler<T> {
  /**
   * Unique identifier in @package/name format.
   * Must be implemented by subclasses.
   */
  abstract readonly id: string

  /**
   * Item type - always 'command'.
   * Must be implemented by subclasses.
   */
  abstract readonly type: 'command'

  /**
   * Execute the command.
   * Must be implemented by subclasses.
   */
  abstract run(
    args: Record<string, any>,
    context: ExecutionContext,
    output?: string,
  ): Promise<ActionResult<T>>

  /**
   * Called once after loading. Default is no-op.
   * Override in subclass if setup is needed.
   */
  async init(): Promise<void> {
    // Default no-op - override in subclass if needed
  }

  /**
   * Called before unloading. Default is no-op.
   * Override in subclass if cleanup is needed.
   */
  async dispose(): Promise<void> {
    // Default no-op - override in subclass if needed
  }

  /**
   * Create a successful ActionResult.
   *
   * @param message - Success message
   * @param value - Result value (optional)
   * @param cost - Cost in credits (default 0)
   */
  protected handleSuccess(
    message: string,
    value?: T,
    cost: number = 0,
  ): ActionResult<T> {
    return {
      success: true,
      value,
      message,
      messages: [message],
      cost,
    }
  }

  /**
   * Create a failed ActionResult.
   *
   * @param message - Error message
   * @param cost - Cost in credits (default 0)
   */
  protected handleFailure(message: string, cost: number = 0): ActionResult<T> {
    return {
      success: false,
      message,
      messages: [message],
      fatalError: message,
      cost,
    }
  }

  /**
   * Format error message for logging.
   */
  protected handleError(message: string): string {
    return message
  }

  /**
   * Cleanup method - called by dispose() or manually.
   */
  protected async cleanup(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * String representation of this handler.
   */
  toString(): string {
    return `Action: ${this.constructor.name}`
  }
}
