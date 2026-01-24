/**
 * @flow/goto Handler - Jump to a labeled instruction
 *
 * Requirements:
 * - R-GOTO-41: Registered with target as required arg
 * - R-GOTO-42: Supports if={condition} for conditional jumps (via reserved arg system)
 * - R-GOTO-43: With false condition, is a no-op (execution continues)
 *
 * @example
 * ```oto
 * @flow/goto target="retry"
 * @flow/goto target="done" if={counter >= 3}
 * ```
 */
import type { ActionResult } from '../../command-registry/action-result.js'
import { BaseCommandHandler } from '../../command-registry/base-command-handler.js'
import type { ExecutionContext } from '../../../domain/index.js'

/**
 * Special action result for goto that includes the target label.
 * The interpreter uses this to perform the actual jump.
 */
export interface GotoResult {
  type: 'goto'
  target: string
}

export class GotoHandler extends BaseCommandHandler<GotoResult> {
  readonly id = '@flow/goto'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    _context: ExecutionContext,
  ): Promise<ActionResult<GotoResult>> {
    const target = args.target as string

    if (!target) {
      return this.handleFailure('Missing required argument: target')
    }

    if (typeof target !== 'string') {
      return this.handleFailure('target must be a string')
    }

    // Return a special goto result that the interpreter will handle
    return this.handleSuccess('Goto ' + target, {
      type: 'goto',
      target,
    })
  }
}
