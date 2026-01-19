/**
 * BaseComposableRegistry - composes multiple sources into a single registry.
 */

import {
  ComposableRegistry,
  RegistryEntry,
  RegistryItem,
  RegistrySource,
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
 * - Composes multiple sources
 * - Detects conflicts (same key in multiple sources)
 * - Manages item lifecycle (init/dispose)
 * - Tracks source provenance
 *
 * @example
 * ```typescript
 * const registry = new BaseComposableRegistry<CommandHandler>()
 * registry.addSource(coreSource)
 * registry.addSource(customSource)
 * await registry.reload()
 *
 * const entry = await registry.get('@utils/log')
 * console.log(entry?.value, entry?.sourceId)
 * ```
 */
export class BaseComposableRegistry<V extends RegistryItem>
  implements ComposableRegistry<V>
{
  private sources: RegistrySource<V>[] = []
  private cache: Map<string, RegistryEntry<V>> | null = null
  private loaded = false

  addSource(source: RegistrySource<V>): void {
    this.sources.push(source)
  }

  getSources(): RegistrySource<V>[] {
    return [...this.sources]
  }

  async reload(): Promise<void> {
    // Step 1: Dispose existing items
    if (this.cache) {
      await this.disposeAll()
    }

    // Step 2: Load all sources
    const sourceEntries = await this.loadAllSources()

    // Step 3: Detect conflicts
    const conflicts = this.detectConflicts(sourceEntries)
    if (conflicts.length > 0) {
      throw new RegistryConflictError(conflicts)
    }

    // Step 4: Build cache
    this.cache = this.buildCache(sourceEntries)

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

  private async loadAllSources(): Promise<
    Array<{ sourceId: string; entries: Map<string, V> }>
  > {
    const results: Array<{ sourceId: string; entries: Map<string, V> }> = []

    for (const source of this.sources) {
      const entries = await source.load()
      results.push({ sourceId: source.id, entries })
    }

    return results
  }

  private detectConflicts(
    sourceEntries: Array<{ sourceId: string; entries: Map<string, V> }>,
  ): RegistryConflict[] {
    // Map key -> list of source IDs that provide it
    const keyToSources = new Map<string, string[]>()

    for (const { sourceId, entries } of sourceEntries) {
      for (const key of entries.keys()) {
        const sources = keyToSources.get(key) || []
        sources.push(sourceId)
        keyToSources.set(key, sources)
      }
    }

    // Find keys with more than one source
    const conflicts: RegistryConflict[] = []
    for (const [key, sourceIds] of keyToSources) {
      if (sourceIds.length > 1) {
        conflicts.push({ key, sourceIds })
      }
    }

    return conflicts
  }

  private buildCache(
    sourceEntries: Array<{ sourceId: string; entries: Map<string, V> }>,
  ): Map<string, RegistryEntry<V>> {
    const cache = new Map<string, RegistryEntry<V>>()

    for (const { sourceId, entries } of sourceEntries) {
      for (const [key, value] of entries) {
        cache.set(key, { key, value, sourceId })
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
