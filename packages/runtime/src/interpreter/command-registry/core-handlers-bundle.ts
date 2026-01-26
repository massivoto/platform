/**
 * CoreHandlersBundle - RegistryBundle for built-in command handlers.
 *
 * Requirements:
 * - R-CMD-41: Implements RegistryBundle<CommandHandler>
 * - R-CMD-42: id is 'core'
 * - R-CMD-43: load() returns Map of built-in handlers
 * - R-CMD-44: Migrated handlers: @utils/log, @utils/set
 * - R-GOTO-41: @flow/goto handler
 * - R-GOTO-44: @flow/exit handler
 * - R-GOTO-47: @flow/return handler
 */
import type { RegistryBundle } from '@massivoto/kit'
import type { CommandHandler } from './types.js'
import { BaseCommandHandler } from './base-command-handler.js'
import type { ActionResult } from './action-result.js'
import type { ExecutionContext } from '../../domain/index.js'
import { GotoHandler } from '../core-handlers/flow/goto.handler.js'
import { ExitHandler } from '../core-handlers/flow/exit.handler.js'
import { ReturnHandler } from '../core-handlers/flow/return.handler.js'
import { ConfirmHandler } from '../core-handlers/human/confirm.handler.js'
import { TextHandler, ImageHandler } from '../core-handlers/ai/index.js'

// =============================================================================
// Core Handlers with RegistryItem interface
// =============================================================================

/**
 * LogHandler - @utils/log
 *
 * Logs a message to the console and appends to context.userLogs.
 *
 * @example
 * ```dsl
 * @utils/log message="Hello, Social Media!"
 * ```
 */
class LogHandler extends BaseCommandHandler<void> {
  readonly id = '@utils/log'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<void>> {
    const message = args.message as string
    if (!message) {
      throw new Error('Message is required')
    }
    // Log to console
    console.log(`Log: ${message}`)

    // R-CONFIRM-124: Append to userLogs
    if (context.userLogs) {
      context.userLogs.push(message)
    }

    return this.handleSuccess('Logged successfully', undefined)
  }
}

/**
 * SetHandler - @utils/set
 *
 * Sets a value in the execution context.
 *
 * @example
 * ```dsl
 * @utils/set input="value" => $result
 * ```
 */
class SetHandler extends BaseCommandHandler<any> {
  readonly id = '@utils/set'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<any>> {
    const input = args.input as any

    if (input === undefined) {
      throw new Error('Input is required')
    }
    return this.handleSuccess('Set successfully', input)
  }
}

// =============================================================================
// CoreHandlersBundle
// =============================================================================

/**
 * CoreHandlersBundle - provides built-in command handlers.
 *
 * This bundle is always available and provides the core handlers
 * that are part of the runtime.
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry()
 * registry.addBundle(new CoreHandlersBundle())
 * await registry.reload()
 *
 * const logHandler = registry.resolve('@utils/log')
 * ```
 */
export class CoreHandlersBundle implements RegistryBundle<CommandHandler<any>> {
  readonly id = 'core'

  async load(): Promise<Map<string, CommandHandler<any>>> {
    const handlers = new Map<string, CommandHandler<any>>()

    // Create instances of all core handlers
    const coreHandlers: CommandHandler<any>[] = [
      new LogHandler(),
      new SetHandler(),
      // Flow control handlers (R-GOTO-41, R-GOTO-44, R-GOTO-47)
      new GotoHandler(),
      new ExitHandler(),
      new ReturnHandler(),
      // Human validation handlers (R-CONFIRM-101)
      new ConfirmHandler(),
      // AI generation handlers (R-AI-03)
      new TextHandler(),
      new ImageHandler(),
    ]

    // Register each handler by its id
    for (const handler of coreHandlers) {
      handlers.set(handler.id, handler)
    }

    return handlers
  }
}
