/**
 * Applet Error Types
 *
 * Custom error classes for the applet system.
 */

import type { ZodError } from 'zod'

/**
 * Thrown when an applet is not found in the registry.
 */
export class AppletNotFoundError extends Error {
  readonly code = 'APPLET_NOT_FOUND'

  constructor(readonly appletId: string) {
    super(`Applet not found: ${appletId}`)
    this.name = 'AppletNotFoundError'
  }
}

/**
 * Thrown when an applet times out waiting for user response.
 */
export class AppletTimeoutError extends Error {
  readonly code = 'APPLET_TIMEOUT'

  constructor(
    readonly instanceId: string,
    readonly timeoutMs: number,
  ) {
    super(`Applet ${instanceId} timed out after ${timeoutMs}ms`)
    this.name = 'AppletTimeoutError'
  }
}

/**
 * Thrown when an applet is terminated before receiving a response.
 */
export class AppletTerminatedError extends Error {
  readonly code = 'APPLET_TERMINATED'

  constructor(readonly instanceId: string) {
    super(`Applet ${instanceId} was terminated before response`)
    this.name = 'AppletTerminatedError'
  }
}

/**
 * Thrown when input or output validation fails.
 */
export class AppletValidationError extends Error {
  readonly code = 'APPLET_VALIDATION'

  constructor(
    readonly instanceId: string,
    readonly zodError: ZodError,
  ) {
    super(`Applet ${instanceId} validation failed: ${zodError.message}`)
    this.name = 'AppletValidationError'
  }
}
