/**
 * BaseComposableRegistry - simple in-memory registry.
 *
 * Always ready to use - no reload() ceremony required.
 * Supports bundles for batch loading if needed.
 */

import {
  ComposableRegistry,
  RegistryBundle,
  RegistryEntry,
  RegistryItem,
} from './types.js'
import { RegistryConflict, RegistryConflictError } from './errors.js'

export class BaseComposableRegistry<V extends RegistryItem>
  implements ComposableRegistry<V>
{
  private bundles: RegistryBundle<V>[] = []
  private registry: Map<string, RegistryEntry<V>> = new Map()

  async addRegistryItem(id: string, item: V): Promise<void> {
    await item.init()
    this.registry.set(id, { key: id, value: item, bundleId: 'dynamic' })
  }

  async resolve(key: string): Promise<V> {
    const entry = await this.get(key)
    if (!entry) {
      throw new Error(`Registry entry not found for key: ${key}`)
    }
    return entry.value
  }

  addBundle(bundle: RegistryBundle<V>): void {
    this.bundles.push(bundle)
  }

  getBundles(): RegistryBundle<V>[] {
    return [...this.bundles]
  }

  /**
   * Load all bundles. Optional - only needed if using bundles.
   * Items added via addRegistryItem() are available immediately.
   */
  async reload(): Promise<void> {
    // Dispose existing bundle items (keep dynamic items)
    await this.disposeBundleItems()

    // Load all bundles
    const bundleEntries = await this.loadAllBundles()

    // Detect conflicts
    const conflicts = this.detectConflicts(bundleEntries)
    if (conflicts.length > 0) {
      throw new RegistryConflictError(conflicts)
    }

    // Add bundle items to registry
    for (const { bundleId, entries } of bundleEntries) {
      for (const [key, value] of entries) {
        await value.init()
        this.registry.set(key, { key, value, bundleId })
      }
    }
  }

  async get(key: string): Promise<RegistryEntry<V> | undefined> {
    return this.registry.get(key)
  }

  async has(key: string): Promise<boolean> {
    return this.registry.has(key)
  }

  async keys(): Promise<string[]> {
    return [...this.registry.keys()]
  }

  async entries(): Promise<Map<string, RegistryEntry<V>>> {
    return new Map(this.registry)
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
    const keyToBundles = new Map<string, string[]>()

    for (const { bundleId, entries } of bundleEntries) {
      for (const key of entries.keys()) {
        const bundles = keyToBundles.get(key) || []
        bundles.push(bundleId)
        keyToBundles.set(key, bundles)
      }
    }

    const conflicts: RegistryConflict[] = []
    for (const [key, bundleIds] of keyToBundles) {
      if (bundleIds.length > 1) {
        conflicts.push({ key, sourceIds: bundleIds })
      }
    }
    return conflicts
  }

  private async disposeBundleItems(): Promise<void> {
    const disposePromises: Promise<void>[] = []
    for (const [key, entry] of this.registry) {
      if (entry.bundleId !== 'dynamic') {
        disposePromises.push(entry.value.dispose())
        this.registry.delete(key)
      }
    }
    await Promise.all(disposePromises)
  }
}
