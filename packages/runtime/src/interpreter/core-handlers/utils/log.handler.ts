import { ActionResult } from '../../handlers/action-result.js'
import { CommandHandler } from '../../handlers/command-registry.js'
import { ExecutionContext } from '../../../domain/index.js'

export class LogHandler implements CommandHandler<void> {
  readonly id = '@utils/log'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<void>> {
    const message = args.message
    if (message === undefined || message === null) {
      return {
        success: false,
        fatalError: 'Message is required',
        messages: ['Missing required argument: message'],
        cost: 0,
      }
    }
    const messageStr = String(message)

    // Log to console (existing behavior)
    console.log(`[LOG] ${messageStr}`)

    // R-CONFIRM-124: Append to userLogs
    if (context.userLogs) {
      context.userLogs.push(messageStr)
    }

    return {
      success: true,
      messages: [`Logged: ${messageStr}`],
      cost: 0,
    }
  }
}
