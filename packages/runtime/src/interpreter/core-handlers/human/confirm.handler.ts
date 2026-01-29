/**
 * @human/confirm Command Handler
 *
 * Launches the confirm applet for human validation in automation workflows.
 *
 * R-CONFIRM-101: Create @human/confirm handler
 * R-CONFIRM-102: Validate required message argument, optional title and resourceUrl
 * R-CONFIRM-103: Retrieve appletLauncher from context, throw if not configured
 * R-CONFIRM-104: Call appletLauncher.launch and log the instance URL
 * R-CONFIRM-105: Set context.status during wait, restore after
 * R-CONFIRM-106: Return approved boolean as value
 */

import { ActionResult } from '../../handlers/action-result.js'
import { CommandHandler } from '../../handlers/command-registry.js'
import { ExecutionContext } from '@massivoto/kit'

export class ConfirmHandler implements CommandHandler<boolean> {
  readonly id = '@human/confirm'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<boolean>> {
    const { message, title, resourceUrl } = args

    // R-CONFIRM-102: Validate required argument
    if (message === undefined || message === null) {
      return {
        success: false,
        fatalError: 'Message is required',
        messages: ['Missing required argument: message'],
        cost: 0,
      }
    }

    // R-CONFIRM-103: Check for appletLauncher
    if (!context.appletLauncher) {
      return {
        success: false,
        fatalError: 'AppletLauncher not configured',
        messages: [
          'Cannot launch confirm applet: appletLauncher not available in context',
        ],
        cost: 0,
      }
    }

    // R-CONFIRM-104: Launch the applet
    const input = { message, title, resourceUrl }
    const instance = await context.appletLauncher.launch(
      'confirm',
      input,
      context,
    )

    // Log URL for user to open
    console.log(`[APPLET] Waiting for human validation at: ${instance.url}`)

    // R-CONFIRM-105: Update status before waiting
    const previousStatus = context.status
    context.status = 'waitingHumanValidation'

    try {
      // Wait for user response
      const response = await instance.waitForResponse<{ approved: boolean }>()

      // Restore status
      context.status = previousStatus ?? 'running'

      // R-CONFIRM-106: Return boolean value
      return {
        success: true,
        value: response.approved,
        messages: [
          `User responded: ${response.approved ? 'Approved' : 'Rejected'}`,
        ],
        cost: 0,
      }
    } catch (error) {
      context.status = 'error'
      return {
        success: false,
        fatalError: error instanceof Error ? error.message : 'Unknown error',
        messages: ['Applet response failed'],
        cost: 0,
      }
    } finally {
      // Clean up
      await instance.terminator.terminate()
    }
  }
}
