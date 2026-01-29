/**
 * @human/grid Command Handler
 *
 * Launches the grid applet for multi-select human validation in automation workflows.
 *
 * R-GRID-81: Create @human/grid handler
 * R-GRID-82: Validate required items argument (array), optional title
 * R-GRID-83: Launch grid applet, set context.status = 'waitingHumanValidation', wait for response
 * R-GRID-84: Return selected: GridItem[] array as value for output variable
 */

import { ActionResult } from '../../handlers/action-result.js'
import { CommandHandler } from '../../handlers/command-registry.js'
import { ExecutionContext } from '@massivoto/kit'

interface GridItem {
  id: string
  text: string
  resource?: { url: string; type?: 'image' | 'video' | 'audio' }
  metadata?: Record<string, string>
}

export class GridHandler implements CommandHandler<GridItem[]> {
  readonly id = '@human/grid'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<GridItem[]>> {
    const { items, title } = args

    // R-GRID-82: Validate items argument
    if (items === undefined || items === null) {
      return {
        success: false,
        fatalError: 'Items array is required',
        messages: ['Missing required argument: items'],
        cost: 0,
      }
    }

    if (!Array.isArray(items)) {
      return {
        success: false,
        fatalError: 'Items must be an array',
        messages: ['Invalid argument: items must be an array'],
        cost: 0,
      }
    }

    if (items.length === 0) {
      return {
        success: false,
        fatalError: 'Items array must not be empty',
        messages: ['Invalid argument: items array is empty'],
        cost: 0,
      }
    }

    // Validate each item has id and text
    for (const item of items) {
      if (!item.id) {
        return {
          success: false,
          fatalError: 'Each item must have an id field',
          messages: [`Invalid item: missing id in ${JSON.stringify(item)}`],
          cost: 0,
        }
      }
      if (!item.text) {
        return {
          success: false,
          fatalError: 'Each item must have a text field',
          messages: [`Invalid item: missing text in ${JSON.stringify(item)}`],
          cost: 0,
        }
      }
    }

    // R-GRID-83: Check for appletLauncher
    if (!context.appletLauncher) {
      return {
        success: false,
        fatalError: 'AppletLauncher not configured',
        messages: [
          'Cannot launch grid applet: appletLauncher not available in context',
        ],
        cost: 0,
      }
    }

    // Launch the applet
    const input = { items, title }
    const instance = await context.appletLauncher.launch('grid', input, context)

    // Log URL for user to open
    console.log(`[APPLET] Waiting for selection at: ${instance.url}`)

    // R-GRID-83: Update status before waiting
    const previousStatus = context.status
    context.status = 'waitingHumanValidation'

    try {
      // Wait for user response
      const response = await instance.waitForResponse<{
        selected: GridItem[]
      }>()

      // Restore status
      context.status = previousStatus ?? 'running'

      // R-GRID-84: Return selected items array as value
      return {
        success: true,
        value: response.selected,
        messages: [`User selected ${response.selected.length} items`],
        cost: 0,
      }
    } catch (error) {
      context.status = 'error'
      return {
        success: false,
        fatalError: error instanceof Error ? error.message : 'Unknown error',
        messages: ['Grid applet response failed'],
        cost: 0,
      }
    } finally {
      // Clean up
      await instance.terminator.terminate()
    }
  }
}
