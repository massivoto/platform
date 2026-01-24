/**
 * CommandRegistry Module
 *
 * Public exports for the command registry system.
 *
 * @example
 * ```typescript
 * import {
 *   CommandRegistry,
 *   CommandHandler,
 *   BaseCommandHandler,
 *   CoreHandlersBundle,
 *   CommandNotFoundError,
 *   ActionResult,
 * } from '@massivoto/runtime'
 * ```
 */

// Types
export type { CommandHandler } from './types.js'
export type { ActionResult } from './action-result.js'

// Classes
export { BaseCommandHandler } from './base-command-handler.js'
export { CommandRegistry } from './command-registry.js'
export { CoreHandlersBundle } from './core-handlers-bundle.js'

// Errors
export { CommandNotFoundError } from './errors.js'
