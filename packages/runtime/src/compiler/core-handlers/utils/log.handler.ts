import { ActionResult } from '../../handlers/action-result.js'
import { BaseCommandHandler } from '../../handlers/base-command-handler.js'

export class LogHandler extends BaseCommandHandler<void> {
  async run(
    args: Record<string, any>,
    context: any,
  ): Promise<ActionResult<void>> {
    const message = args.message as string
    if (!message) {
      throw new Error('Message is required')
    }
    return this.log(message)
  }

  async log(message: string): Promise<ActionResult<void>> {
    console.log(`Log: ${message}`)
    return this.handleSuccess('logged successfully')
  }
}
