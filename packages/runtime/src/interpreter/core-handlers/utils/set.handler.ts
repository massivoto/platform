import { ActionResult } from '../../handlers/action-result.js'
import { CommandHandler } from '../../handlers/command-registry.js'
import { ExecutionContext } from '@massivoto/kit'

export class SetHandler implements CommandHandler<any> {
  readonly id = '@utils/set'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(
    args: Record<string, any>,
    _context: ExecutionContext,
  ): Promise<ActionResult<any>> {
    const input = args.input

    if (input === undefined) {
      return {
        success: false,
        fatalError: 'Input is required',
        messages: ['Missing required argument: input'],
        cost: 0,
      }
    }
    return {
      success: true,
      value: input,
      messages: ['Set successfully'],
      cost: 0,
    }
  }
}
