/**
 * AppletRegistry - wraps BaseComposableRegistry for applet definitions.
 *
 * Requirements:
 * - R-APP-21: Wraps BaseComposableRegistry<AppletDefinition>
 * - R-APP-22: addBundle() to register applet bundles
 * - R-APP-23: reload() with conflict detection
 * - R-APP-24: get() returns RegistryEntry<AppletDefinition> | undefined
 */

import {
  BaseComposableRegistry,
  RegistryBundle,
  RegistryEntry,
} from '../registry/index.js'
import type { AppletDefinition } from './types.js'

/**
 * AppletRegistry - manages applet definitions with bundle composition.
 *
 * Wraps BaseComposableRegistry to provide applet-specific methods
 * while inheriting conflict detection, lifecycle management, and
 * bundle provenance tracking.
 *
 * @example
 * ```typescript
 * const registry = new AppletRegistry()
 * registry.addBundle(new CoreAppletsBundle())
 * registry.addBundle(customBundle)
 * await registry.reload()
 *
 * const entry = await registry.get('confirm')
 * if (entry) {
 *   const validated = entry.value.inputSchema.parse({ message: 'Approve?' })
 * }
 * ```
 */
export class AppletRegistry {
  private readonly inner: BaseComposableRegistry<AppletDefinition>

  constructor() {
    this.inner = new BaseComposableRegistry<AppletDefinition>()
  }

  /**
   * Add a bundle of applet definitions.
   * Bundles are loaded in order when reload() is called.
   */
  addBundle(bundle: RegistryBundle<AppletDefinition>): void {
    this.inner.addBundle(bundle)
  }

  /**
   * Get all registered bundles.
   */
  getBundles(): RegistryBundle<AppletDefinition>[] {
    return this.inner.getBundles()
  }

  /**
   * Reload all bundles.
   * - Calls dispose() on existing definitions
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new definitions
   *
   * @throws RegistryConflictError if same applet id exists in multiple bundles
   */
  async reload(): Promise<void> {
    await this.inner.reload()
  }

  /**
   * Get an applet definition by id.
   *
   * @param appletId - The applet identifier (e.g., "confirm", "grid")
   * @returns Entry with value and bundleId, or undefined if not found
   */
  async get(appletId: string): Promise<RegistryEntry<AppletDefinition> | undefined> {
    return this.inner.get(appletId)
  }

  /**
   * Check if an applet exists in the registry.
   */
  async has(appletId: string): Promise<boolean> {
    return this.inner.has(appletId)
  }

  /**
   * Get all registered applet ids.
   */
  async keys(): Promise<string[]> {
    return this.inner.keys()
  }

  /**
   * Get all entries with provenance information.
   */
  async entries(): Promise<Map<string, RegistryEntry<AppletDefinition>>> {
    return this.inner.entries()
  }
}
