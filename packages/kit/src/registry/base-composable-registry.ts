/**
 * BaseComposableRegistry - composes multiple bundles into a single registry.
 */

import {
  ComposableRegistry,
  RegistryEntry,
  RegistryItem,
  RegistryBundle,
} from './types.js'
import {
  RegistryConflictError,
  RegistryNotLoadedError,
  RegistryConflict,
} from './errors.js'

/**
 * Base implementation of a composable registry.
 *
 * Features:
 * - Composes multiple bundles
 * - Detects conflicts (same key in multiple bundles)
 * - Manages item lifecycle (init/dispose)
 * - Tracks bundle provenance
 *
 * @example
 * ```typescript
 * const registry = new BaseComposableRegistry<CommandHandler>()
 * registry.addBundle(coreBundle)
 * registry.addBundle(customBundle)
 * await registry.reload()
 *
 * const entry = await registry.get('@utils/log')
 * console.log(entry?.value, entry?.bundleId)
 * ```
 */
export class BaseComposableRegistry<
  V extends RegistryItem,
> implements ComposableRegistry<V> {
  private bundles: RegistryBundle<V>[] = []
  private cache: Map<string, RegistryEntry<V>> | null = null
  private loaded = false

  addBundle(bundle: RegistryBundle<V>): void {
    this.bundles.push(bundle)
  }

  getBundles(): RegistryBundle<V>[] {
    return [...this.bundles]
  }

  async reload(): Promise<void> {
    // Step 1: Dispose existing items
    if (this.cache) {
      await this.disposeAll()
    }

    // Step 2: Load all bundles
    const bundleEntries = await this.loadAllBundles()

    // Step 3: Detect conflicts
    const conflicts = this.detectConflicts(bundleEntries)
    if (conflicts.length > 0) {
      throw new RegistryConflictError(conflicts)
    }

    // Step 4: Build cache
    this.cache = this.buildCache(bundleEntries)

    // Step 5: Initialize all items
    await this.initAll()

    this.loaded = true
  }

  async get(key: string): Promise<RegistryEntry<V> | undefined> {
    this.ensureLoaded()
    return this.cache!.get(key)
  }

  async has(key: string): Promise<boolean> {
    this.ensureLoaded()
    return this.cache!.has(key)
  }

  async keys(): Promise<string[]> {
    this.ensureLoaded()
    return [...this.cache!.keys()]
  }

  async entries(): Promise<Map<string, RegistryEntry<V>>> {
    this.ensureLoaded()
    return new Map(this.cache!)
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      throw new RegistryNotLoadedError()
    }
  }

  private async loadAllBundles(): Promise<
    Array<{ bundleId: string; entries: Map<string, V> }>
  > {
    const results: Array<{ bundleId: string; entries: Map<string, V> }> = []

    for (const bundle of this.bundles) {
      const entries = await bundle.load()
      results.push({ bundleId: bundle.id, entries })
    }

    return results
  }

  private detectConflicts(
    bundleEntries: Array<{ bundleId: string; entries: Map<string, V> }>,
  ): RegistryConflict[] {
    // Map key -> list of bundle IDs that provide it
    const keyToBundles = new Map<string, string[]>()

    for (const { bundleId, entries } of bundleEntries) {
      for (const key of entries.keys()) {
        const bundles = keyToBundles.get(key) || []
        bundles.push(bundleId)
        keyToBundles.set(key, bundles)
      }
    }

    // Find keys with more than one bundle
    const conflicts: RegistryConflict[] = []
    for (const [key, bundleIds] of keyToBundles) {
      if (bundleIds.length > 1) {
        conflicts.push({ key, sourceIds: bundleIds })
      }
    }

    return conflicts
  }

  private buildCache(
    bundleEntries: Array<{ bundleId: string; entries: Map<string, V> }>,
  ): Map<string, RegistryEntry<V>> {
    const cache = new Map<string, RegistryEntry<V>>()

    for (const { bundleId, entries } of bundleEntries) {
      for (const [key, value] of entries) {
        cache.set(key, { key, value, bundleId })
      }
    }

    return cache
  }

  private async initAll(): Promise<void> {
    if (!this.cache) return

    const initPromises: Promise<void>[] = []
    for (const entry of this.cache.values()) {
      initPromises.push(entry.value.init())
    }

    await Promise.all(initPromises)
  }

  private async disposeAll(): Promise<void> {
    if (!this.cache) return

    const disposePromises: Promise<void>[] = []
    for (const entry of this.cache.values()) {
      disposePromises.push(entry.value.dispose())
    }

    await Promise.all(disposePromises)
  }
}
