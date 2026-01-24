import { errorToString } from '@massivoto/kit'
import { ActionResult } from '../../../../handlers/action-result.js'
import { BaseCommandHandler } from '../../../../handlers/base-command-handler.js'
import { FilesystemClient } from './filesystem.client.js'

export class FileSystemWriterHandler extends BaseCommandHandler<void> {
  async run(
    args: Record<string, any>,
    context: any,
  ): Promise<ActionResult<void>> {
    const filePath = args.path as string
    const content = args.content as string

    return this.writeFile(filePath, content)
  }

  async writeFile(
    filePath: string,
    content: string,
  ): Promise<ActionResult<void>> {
    try {
      await new FilesystemClient().writeFile(filePath, content)
      return this.handleSuccess('Filesystem saved correctly')
    } catch (e) {
      throw this.handleError(errorToString(e))
    }
  }
}
