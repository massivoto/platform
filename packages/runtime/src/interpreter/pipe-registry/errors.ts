/**
 * Pipe Registry Errors
 *
 * Requirements:
 * - R-PIPE-61: PipeError class with pipeId and message properties
 * - R-PIPE-62: PipeArgumentError extends PipeError with expectedArgs hint
 * - R-PIPE-63: PipeTypeError extends PipeError for input type mismatches
 */

/**
 * Base error class for pipe execution errors.
 *
 * @example
 * ```typescript
 * throw new PipeError('filter', 'Something went wrong')
 * ```
 */
export class PipeError extends Error {
  override readonly name: string = 'PipeError'

  /**
   * The pipe that caused the error.
   * @example 'filter', 'map', 'join'
   */
  readonly pipeId: string

  constructor(pipeId: string, message: string) {
    super(`Pipe '${pipeId}': ${message}`)
    this.pipeId = pipeId

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PipeError.prototype)
  }
}

/**
 * Error thrown when a pipe receives invalid arguments.
 *
 * @example
 * ```typescript
 * throw new PipeArgumentError('filter', 'property name (string)')
 * ```
 */
export class PipeArgumentError extends PipeError {
  override readonly name = 'PipeArgumentError'

  /**
   * Hint about what arguments the pipe expects.
   * @example 'property name (string)', 'separator (string, optional)'
   */
  readonly expectedArgs: string

  constructor(pipeId: string, expectedArgs: string) {
    super(pipeId, `Invalid argument. Expected ${expectedArgs}`)
    this.expectedArgs = expectedArgs

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PipeArgumentError.prototype)
  }
}

/**
 * Error thrown when a pipe receives input of the wrong type.
 *
 * Message format: "Pipe 'X' requires Y input, got Z"
 *
 * @example
 * ```typescript
 * throw new PipeTypeError('filter', 'array', 'number')
 * // => "Pipe 'filter' requires array input, got number"
 * ```
 */
export class PipeTypeError extends PipeError {
  override readonly name = 'PipeTypeError'

  /**
   * The type that was expected.
   * @example 'array', 'string', 'array, string, or object'
   */
  readonly expectedType: string

  /**
   * The actual type that was received.
   * @example 'number', 'string', 'function'
   */
  readonly actualType: string

  constructor(pipeId: string, expectedType: string, actualType: string) {
    // Use a placeholder message to satisfy PipeError, then override
    super(pipeId, '')
    // Override message to exact format: "Pipe 'X' requires Y input, got Z"
    this.message = `Pipe '${pipeId}' requires ${expectedType} input, got ${actualType}`
    this.expectedType = expectedType
    this.actualType = actualType

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PipeTypeError.prototype)
  }
}
