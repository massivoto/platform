import { ActionResult } from '../../handlers/action-result.js'
import { BaseCommandHandler } from '../../handlers/base-command-handler.js'

export class SetHandler extends BaseCommandHandler<any> {
  async run(args: Record<string, any>): Promise<ActionResult<any>> {
    const input = args.input as any

    if (input === undefined) {
      throw new Error('Input is required')
    }
    return this.set(input)
  }

  async set(input: any): Promise<ActionResult<any>> {
    return this.handleSuccess(`Set successfully`, input)
  }
}
