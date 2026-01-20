/**
 * ModuleBundle - loads registry items from JavaScript modules.
 */

import { RegistryItem, RegistryBundle } from './types.js'
import { ModuleLoadError } from './errors.js'

/**
 * Adapter function type.
 * Converts module exports to a Map of registry entries.
 */
export type ModuleAdapter<V extends RegistryItem> = (
  exports: unknown,
) => Map<string, V>

/**
 * Configuration for ModuleBundle.
 */
export interface ModuleBundleConfig<V extends RegistryItem> {
  /** Unique identifier for this bundle */
  id: string

  /** Path to the module (for dynamic import) */
  modulePath: string

  /** Function to convert module exports to registry entries */
  adapter: ModuleAdapter<V>
}

/**
 * Registry bundle that loads items from a JavaScript module.
 *
 * Uses dynamic import() to load the module, then passes exports
 * through an adapter function to extract registry entries.
 *
 * @example
 * ```typescript
 * const bundle = new ModuleBundle({
 *   id: 'vinyl-classics',
 *   modulePath: './fixtures/vinyl-classics.js',
 *   adapter: (exports) => new Map(exports.albums.map(({ key, value }) => [key, value]))
 * })
 *
 * const entries = await bundle.load()
 * ```
 */
export class ModuleBundle<V extends RegistryItem> implements RegistryBundle<V> {
  readonly id: string
  private readonly modulePath: string
  private readonly adapter: ModuleAdapter<V>

  constructor(config: ModuleBundleConfig<V>) {
    this.id = config.id
    this.modulePath = config.modulePath
    this.adapter = config.adapter
  }

  async load(): Promise<Map<string, V>> {
    try {
      const module = await import(this.modulePath)
      const entries = this.adapter(module)
      return entries
    } catch (error) {
      throw new ModuleLoadError(this.modulePath, error)
    }
  }
}
