/**
 * CommandRegistry Interface
 *
 * R-SEP-03: Defines the contract for command handler resolution.
 * The runtime package provides this interface; implementations
 * live in @massivoto/interpreter (BSL 1.1 licensed).
 *
 * @example
 * ```typescript
 * import { CommandRegistry } from '@massivoto/runtime'
 * import { CoreCommandRegistry, CoreHandlersBundle } from '@massivoto/interpreter'
 *
 * const registry: CommandRegistry = new CoreCommandRegistry()
 * registry.addBundle(new CoreHandlersBundle())
 * await registry.reload()
 *
 * const handler = registry.resolve('@utils/log')
 * ```
 */
import type { RegistryBundle } from '@massivoto/kit'
import type { ExecutionContext } from '@massivoto/kit'

/**
 * Result of a command handler execution.
 */
export interface ActionResult<T = unknown> {
  /** Whether the command executed successfully */
  success: boolean

  /** If success and pertinent, the value returned by the action */
  value?: T

  /** Error message if the command failed fatally */
  fatalError?: string

  /** All messages generated during execution */
  messages: string[]

  /** Primary message for the action result */
  message?: string

  /** Cost in credits (handler reports its cost, 0 for free commands) */
  cost: number
}

/**
 * Command handler interface for executing OTO commands.
 * Extends RegistryItem with run() method.
 */
export interface CommandHandler<T = unknown> {
  /** Unique identifier in @package/name format */
  readonly id: string

  /** Item type - always 'command' */
  readonly type: 'command'

  /** Initialize the handler (called after loading) */
  init(): Promise<void>

  /** Dispose the handler (called before unloading) */
  dispose(): Promise<void>

  /**
   * Execute the command with the given arguments and context.
   *
   * @param args - Key-value pairs of command arguments
   * @param context - Current execution context with data and meta
   * @returns ActionResult with success status, value, and log
   */
  run(
    args: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<ActionResult<T>>
}

/**
 * CommandRegistry interface for managing command handlers.
 *
 * Implementations must provide:
 * - resolve(): Synchronous lookup of handlers by action path
 * - addBundle(): Add a bundle of handlers
 * - reload(): Load all bundles with conflict detection
 */
export interface CommandRegistry {
  /**
   * Resolve a command handler by action path.
   *
   * @param actionPath - The action path in @package/name format
   * @returns The handler if found, undefined otherwise
   */
  resolve(actionPath: string): CommandHandler | undefined

  /**
   * Add a bundle of command handlers.
   * Bundles are loaded in order when reload() is called.
   *
   * @param bundle - The bundle to add
   */
  addBundle(bundle: RegistryBundle<CommandHandler>): void

  /**
   * Reload all bundles.
   * - Calls dispose() on existing handlers
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new handlers
   */
  reload(): Promise<void>
}
