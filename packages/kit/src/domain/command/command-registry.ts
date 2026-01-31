import { CommandHandler } from './command-handler.js'
import { Registry } from '../../registry/index.js'

// TODO AI: use ComposableRegistry instead
export type CommandRegistry = Registry<CommandHandler>
