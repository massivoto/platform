/**
 * CommandHandler Types
 *
 * Defines the CommandHandler interface that extends RegistryItem.
 * Used by all command handlers in the runtime.
 */
import { ActionResult } from './action-result.js'
import { RegistryItem } from '../../registry/index.js'
import { ExecutionContext } from '../execution-context/index.js'

/**
 * CommandHandler interface - extends RegistryItem with run() method.
 *
 * Requirements:
 * - R-CMD-01: Extends RegistryItem with id, type, init(), dispose()
 * - R-CMD-21: run(args, context) signature
 * - R-CMD-22: id matches action path format @package/name
 * - R-CMD-23: type is always 'command'
 *
 * @example
 * ```typescript
 * class PostToSocialHandler implements CommandHandler<{ postId: string }> {
 *   readonly id = '@social/post'
 *   readonly type = 'command' as const
 *
 *   async init(): Promise<void> { }
 *   async dispose(): Promise<void> { }
 *
 *   async run(args: Record<string, any>, context: ExecutionContext) {
 *     return { success: true, value: { postId: '123' }, ... }
 *   }
 * }
 * ```
 */
export interface CommandHandler<T = any> extends RegistryItem {
  /**
   * Unique identifier in @package/name format.
   * @example '@utils/log', '@social/post', '@analytics/engagement'
   */
  readonly id: string

  /**
   * Item type - always 'command' for command handlers.
   */
  readonly type: 'command'

  /**
   * Execute the command with the given arguments and context.
   *
   * @param args - Key-value pairs of command arguments
   * @param context - Current execution context with data and meta
   * @returns ActionResult with success status, value, and log
   */
  run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<T>>
}
