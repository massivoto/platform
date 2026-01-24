/**
 * PipeRegistry - wraps BaseComposableRegistry for pipe functions.
 *
 * Requirements:
 * - R-PIPE-21: Wraps BaseComposableRegistry<PipeFunction>
 * - R-PIPE-22: addBundle(bundle) registers a pipe bundle
 * - R-PIPE-23: reload() loads all bundles with conflict detection
 * - R-PIPE-24: get(pipeId) returns RegistryEntry<PipeFunction> | undefined
 */
import {
  BaseComposableRegistry,
  RegistryBundle,
  RegistryEntry,
} from '@massivoto/kit'
import type { PipeFunction } from './types.js'

/**
 * PipeRegistry - manages pipe functions with bundle composition.
 *
 * Wraps BaseComposableRegistry to provide pipe-specific methods
 * while inheriting conflict detection, lifecycle management, and
 * bundle provenance tracking.
 *
 * @example
 * ```typescript
 * const registry = new PipeRegistry()
 * registry.addBundle(new CorePipesBundle())
 * registry.addBundle(customBundle)
 * await registry.reload()
 *
 * const entry = await registry.get('filter')
 * if (entry) {
 *   const result = await entry.value.execute(data, ['active'])
 * }
 * ```
 */
export class PipeRegistry {
  private readonly inner: BaseComposableRegistry<PipeFunction>

  constructor() {
    this.inner = new BaseComposableRegistry<PipeFunction>()
  }

  /**
   * Add a bundle of pipe functions.
   * Bundles are loaded in order when reload() is called.
   */
  addBundle(bundle: RegistryBundle<PipeFunction>): void {
    this.inner.addBundle(bundle)
  }

  /**
   * Get all registered bundles.
   */
  getBundles(): RegistryBundle<PipeFunction>[] {
    return this.inner.getBundles()
  }

  /**
   * Reload all bundles.
   * - Calls dispose() on existing pipes
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new pipes
   *
   * @throws RegistryConflictError if same pipe id exists in multiple bundles
   */
  async reload(): Promise<void> {
    await this.inner.reload()
  }

  /**
   * Get a pipe function entry by id.
   *
   * @param pipeId - The pipe identifier (e.g., 'filter', 'map')
   * @returns The entry if found, undefined otherwise
   * @throws RegistryNotLoadedError if reload() was never called
   *
   * @example
   * ```typescript
   * const entry = await registry.get('filter')
   * if (entry) {
   *   console.log(entry.bundleId)  // 'core'
   *   console.log(entry.value.id)  // 'filter'
   * }
   * ```
   */
  async get(pipeId: string): Promise<RegistryEntry<PipeFunction> | undefined> {
    return this.inner.get(pipeId)
  }

  /**
   * Check if a pipe exists in the registry.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  async has(pipeId: string): Promise<boolean> {
    return this.inner.has(pipeId)
  }

  /**
   * Get all registered pipe ids.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  async keys(): Promise<string[]> {
    return this.inner.keys()
  }

  /**
   * Get all entries with provenance information.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  async entries(): Promise<Map<string, RegistryEntry<PipeFunction>>> {
    return this.inner.entries()
  }
}
