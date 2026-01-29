/**
 * @flow/return Handler - Terminate program with return value
 *
 * Requirements:
 * - R-GOTO-47: Registered with required value arg (any expression)
 * - R-GOTO-48: Terminates program with exitCode=0 and value set to evaluated expression
 * - R-GOTO-49: Supports if={condition} for conditional return
 *
 * @example
 * ```oto
 * @flow/return value="success"
 * @flow/return value={total * 1.2}
 * @flow/return value=result if={isComplete}
 * ```
 */
import type { ActionResult } from '../../command-registry/action-result.js'
import { BaseCommandHandler } from '../../command-registry/base-command-handler.js'
import type { ExecutionContext } from '@massivoto/kit'

/**
 * Special action result for return that includes the return value.
 * The interpreter uses this to terminate execution with a value.
 */
export interface ReturnResult {
  type: 'return'
  value: unknown
}

export class ReturnHandler extends BaseCommandHandler<ReturnResult> {
  readonly id = '@flow/return'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    _context: ExecutionContext,
  ): Promise<ActionResult<ReturnResult>> {
    // value is required - can be any type (already evaluated by interpreter)
    const value = args.value

    // Return a special return result that the interpreter will handle
    return this.handleSuccess('Return value', {
      type: 'return',
      value,
    })
  }
}
