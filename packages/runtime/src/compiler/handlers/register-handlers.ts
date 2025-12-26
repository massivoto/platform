import { FetchHandler } from '../core-handlers/mcp/client/fetch/fetch.handler.js'
import { FileSystemWriterHandler } from '../core-handlers/mcp/client/filesystem/filesystem.handler.js'
import { LogHandler } from '../core-handlers/utils/log.handler.js'
import { SetHandler } from '../core-handlers/utils/set.handler.js'
import { CommandRegistry } from './command-registry.js'

let commandHandlerRegistry: CommandRegistry | undefined = undefined

export function getCommandHandlerRegistry() {
  if (!commandHandlerRegistry) {
    commandHandlerRegistry = new CommandRegistry()
  }
  return commandHandlerRegistry
}

export function registerStandardCommandHandlers(): CommandRegistry {
  const registry = getCommandHandlerRegistry()

  /*  const open = new OpenAction()
  registry.register('@puppet/open', open)*/

  const reader = new FetchHandler()
  registry.register('@web/read', reader)

  const fileWriter = new FileSystemWriterHandler()
  registry.register('@file/write', fileWriter)

  const logger = new LogHandler()
  registry.register('@utils/log', logger)

  const setter = new SetHandler()
  registry.register('@utils/set', setter)

  return registry
}
