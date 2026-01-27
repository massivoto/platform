import { CommandHandler } from './command-handler.js'
import { ComposableRegistry } from '../../registry/index.js'

export interface CommandRegistry extends ComposableRegistry<CommandHandler> {}
