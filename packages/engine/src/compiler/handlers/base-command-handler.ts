import { CommandHandler } from './command-registry.js'
import { ExecutionContext, InstructionLog } from '../../domain/index.js'
import { ActionResult } from './action-result.js'

export abstract class BaseCommandHandler<T> implements CommandHandler<T> {
  abstract run(
    args: Record<string, any>,
    context: ExecutionContext,
    output?: string,
  ): Promise<ActionResult<T>>

  protected handleSuccess(message: string, value: T): ActionResult<T> {
    const log: InstructionLog = {
      success: true,
      command: this.toString(),
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      messages: [message],
      duration: 0, // Duration will be calculated later
    }
    const result: ActionResult<T> = {
      success: true,
      value,
      log,
      message,
      messages: [message],
    }
    if (result.success) {
      console.log(`✅ ${result.message} \n`)
    } else {
      console.error(`❌ ${result.message}\n`)
    }
    return result
  }

  protected handleError(message: string): string {
    return message
  }

  protected async cleanup(): Promise<void> {}

  toString(): string {
    return `Action: ${this.constructor.name}`
  }
}
