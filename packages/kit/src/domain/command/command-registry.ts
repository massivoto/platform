import { CommandHandler } from './command-handler.js'
import { BaseComposableRegistry } from '../../registry/index.js'

// TODO AI: use ComposableRegistry instead

export abstract class CommandRegistry extends BaseComposableRegistry<CommandHandler> {}
