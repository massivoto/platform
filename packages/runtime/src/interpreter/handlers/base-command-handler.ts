import { CommandHandler } from './command-registry.js'
import { ExecutionContext } from '../../domain/index.js'
import { ActionResult } from './action-result.js'

export abstract class BaseCommandHandler<T> implements CommandHandler<T> {
  abstract run(
    args: Record<string, any>,
    context: ExecutionContext,
    output?: string,
  ): Promise<ActionResult<T>>

  protected handleSuccess(message: string, value?: T): ActionResult<T> {
    const result: ActionResult<T> = {
      success: true,
      value,
      message,
      messages: [message],
      cost: 0,
    }
    return result
  }

  protected handleFailure(message: string, fatalError?: string): ActionResult<T> {
    return {
      success: false,
      fatalError,
      message,
      messages: [message],
      cost: 0,
    }
  }

  protected handleError(message: string): string {
    return message
  }

  protected async cleanup(): Promise<void> {}

  toString(): string {
    return `Action: ${this.constructor.name}`
  }
}
