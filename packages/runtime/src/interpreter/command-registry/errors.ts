/**
 * CommandRegistry Errors
 *
 * Requirements:
 * - R-CMD-81: CommandNotFoundError with actionPath property
 * - R-CMD-82: LLM-readable error message
 * - R-CMD-83: Used when resolve() returns undefined and execution is required
 */

/**
 * Error thrown when a command action path cannot be resolved to a handler.
 *
 * The error message is designed to be LLM-readable, providing context
 * about what went wrong and suggesting how to resolve the issue.
 *
 * @example
 * ```typescript
 * const handler = registry.resolve('@twitter/post')
 * if (!handler) {
 *   throw new CommandNotFoundError('@twitter/post')
 * }
 * ```
 */
export class CommandNotFoundError extends Error {
  readonly name = 'CommandNotFoundError'

  /**
   * The action path that could not be resolved.
   * @example '@twitter/post', '@social/schedule'
   */
  readonly actionPath: string

  constructor(actionPath: string) {
    const message =
      `Command not found: "${actionPath}". ` +
      `No handler is registered for this action path. ` +
      `Check that the command is available and correctly spelled, ` +
      `or verify that the required handler source is loaded.`

    super(message)
    this.actionPath = actionPath

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CommandNotFoundError.prototype)
  }
}
