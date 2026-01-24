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
    _context: ExecutionContext,
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
    console.log(`[LOG] ${messageStr}`)
    return {
      success: true,
      messages: [`Logged: ${messageStr}`],
      cost: 0,
    }
  }
}
