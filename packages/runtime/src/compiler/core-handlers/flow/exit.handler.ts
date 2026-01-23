/**
 * @flow/exit Handler - Terminate program with exit code
 *
 * Requirements:
 * - R-GOTO-44: Registered with optional code arg (default: 0)
 * - R-GOTO-45: Terminates program immediately with exit code N
 * - R-GOTO-46: Supports if={condition} for conditional termination
 *
 * @example
 * ```oto
 * @flow/exit
 * @flow/exit code=1
 * @flow/exit code=1 if={hasError}
 * ```
 */
import type { ActionResult } from '../../command-registry/action-result.js'
import { BaseCommandHandler } from '../../command-registry/base-command-handler.js'
import type { ExecutionContext } from '../../../domain/index.js'

/**
 * Special action result for exit that includes the exit code.
 * The interpreter uses this to terminate execution.
 */
export interface ExitResult {
  type: 'exit'
  code: number
}

export class ExitHandler extends BaseCommandHandler<ExitResult> {
  readonly id = '@flow/exit'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    _context: ExecutionContext,
  ): Promise<ActionResult<ExitResult>> {
    // Default exit code is 0 (success)
    const code = args.code !== undefined ? Number(args.code) : 0

    if (typeof code !== 'number' || isNaN(code)) {
      return this.handleFailure('code must be a number')
    }

    // Return a special exit result that the interpreter will handle
    return this.handleSuccess('Exit with code ' + code, {
      type: 'exit',
      code,
    })
  }
}
