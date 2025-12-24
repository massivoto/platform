// Command Handler Interface
import { ExecutionContext } from '../../domain/index.js'
import { ActionResult } from './action-result.js'

export interface CommandHandler<T> {
  run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<T>>
}

export type CommandBundle = Array<{
  command: string
  handler: CommandHandler<any>
}>

// Command Registry
export class CommandRegistry {
  private registry = new Map<string, CommandHandler<any>>()

  register(id: string, handler: CommandHandler<any>) {
    // TODO: check for duplicates
    if (this.registry.has(id)) {
      throw new Error(`Command already registered: ${id}`)
    }

    // TODO: validate id format
    this.registry.set(id, handler)
  }

  registerBundle(commands: CommandBundle) {
    for (const { command, handler } of commands) {
      this.register(command, handler)
    }
  }

  resolve(id: string): CommandHandler<any> | undefined {
    // TODO: validate id format
    return this.registry.get(id)
  }
}
