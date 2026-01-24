// Re-export from new command-registry module
export type { ActionResult } from '../command-registry/action-result.js'
export type { CommandHandler } from '../command-registry/types.js'
export { BaseCommandHandler } from '../command-registry/base-command-handler.js'
export { CommandRegistry } from '../command-registry/command-registry.js'
export { CoreHandlersBundle } from '../command-registry/core-handlers-bundle.js'
export { CommandNotFoundError } from '../command-registry/errors.js'

// Legacy exports - keep for backward compatibility during migration
export {
  registerStandardCommandHandlers,
  getCommandHandlerRegistry,
} from './register-handlers.js'
