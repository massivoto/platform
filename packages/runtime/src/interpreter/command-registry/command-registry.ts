/**
 * CommandRegistry - wraps BaseComposableRegistry for command handlers.
 *
 * Requirements:
 * - R-CMD-03: Wraps BaseComposableRegistry<CommandHandler>
 * - R-CMD-04: resolve(actionPath) returns CommandHandler | undefined
 * - R-CMD-05: reload() delegates to inner registry
 * - R-CMD-61-63: Action resolution by path
 */
import {
  BaseComposableRegistry,
  Registry,
  RegistryBundle,
  RegistryEntry,
} from '@massivoto/kit'
import type { CommandHandler } from './types.js'

/**
 * CommandRegistry - manages command handlers with bundle composition.
 *
 * Wraps BaseComposableRegistry to provide command-specific methods
 * while inheriting conflict detection, lifecycle management, and
 * bundle provenance tracking.
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry()
 * registry.addBundle(new CoreHandlersBundle())
 * registry.addBundle(customBundle)
 * await registry.reload()
 *
 * const handler = registry.resolve('@social/post')
 * if (handler) {
 *   await handler.run(args, context)
 * }
 * ```
 */
export class CommandRegistry implements Registry<CommandHandler> {
  private readonly inner: BaseComposableRegistry<CommandHandler<any>>

  constructor() {
    this.inner = new BaseComposableRegistry<CommandHandler<any>>()
  }

  /**
   * Add a bundle of command handlers.
   * Bundles are loaded in order when reload() is called.
   */
  addBundle(bundle: RegistryBundle<CommandHandler<any>>): void {
    this.inner.addBundle(bundle)
  }

  /**
   * Get all registered bundles.
   */
  getBundles(): RegistryBundle<CommandHandler<any>>[] {
    return this.inner.getBundles()
  }

  /**
   * Reload all bundles.
   * - Calls dispose() on existing handlers
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new handlers
   *
   * @throws RegistryConflictError if same handler id exists in multiple bundles
   */
  async reload(): Promise<void> {
    await this.inner.reload()
  }

  /**
   * Resolve a command handler by action path.
   *
   * @param actionPath - The action path in @package/name format
   * @returns The handler if found, undefined otherwise
   *
   * @example
   * ```typescript
   * // From ActionNode.path = ['@utils', 'log']
   * const actionPath = '@utils/log'
   * const handler = registry.resolve(actionPath)
   * ```
   */
  resolve(actionPath: string): CommandHandler<any> | undefined {
    // Use synchronous lookup via the cache
    // Note: We access the entry synchronously here because
    // the cache is already loaded after reload()
    const entry = this.inner['cache']?.get(actionPath)
    return entry?.value
  }

  /**
   * Check if a handler exists for the given action path.
   */
  async has(actionPath: string): Promise<boolean> {
    return this.inner.has(actionPath)
  }

  /**
   * Get all registered action paths.
   */
  async keys(): Promise<string[]> {
    return this.inner.keys()
  }

  /**
   * Get all entries with provenance information.
   */
  async entries(): Promise<Map<string, RegistryEntry<CommandHandler<any>>>> {
    return this.inner.entries()
  }

  /**
   * Get an entry by action path with provenance.
   */
  async get(
    actionPath: string,
  ): Promise<RegistryEntry<CommandHandler<any>> | undefined> {
    return this.inner.get(actionPath)
  }
}
