// Re-export from new command-registry module
export type { CommandHandler } from '../command-registry/types.js'
export { CommandRegistry } from '../command-registry/command-registry.js'

export { Interpreter } from './interpreter.js'
export { ExpressionEvaluator } from './evaluators'
