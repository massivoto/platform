/**
 * Common Registry Interface
 *
 * Provides a composable registry pattern for loading items from multiple bundles.
 * Used by CommandRegistry, ProviderRegistry, and AppletRegistry in runtime.
 */

/**
 * Base interface for all registry items.
 * All items stored in a registry must implement this interface.
 * Usually identified by @package/name in Massivoto, but could be a simple string ID.
 */
export interface RegistryItem {
  /** Unique identifier: "@utils/log", "github", "confirm" */
  readonly id: string

  /** Item type: "command", "provider", "applet", or custom string */
  readonly type: string

  /** Called once after loading. Use for setup, resource allocation. */
  init(): Promise<void>

  /** Called before unloading. Use for cleanup, resource release. */
  dispose(): Promise<void>
}

/**
 * Entry returned by registry lookups.
 * Includes the value and provenance information for debugging.
 */
export interface RegistryEntry<V extends RegistryItem> {
  /** The registry key */
  key: string

  /** The item value */
  value: V

  /** ID of the bundle that provided this entry */
  bundleId: string
}

/**
 * Loadable bundle of registry items.
 * Implementations: ModuleBundle, or custom bundles for remote APIs.
 */
export interface RegistryBundle<V extends RegistryItem> {
  /** Unique identifier for this bundle: "core", "@acme/custom-cmds" */
  readonly id: string

  /** Load all entries from this bundle */
  load(): Promise<Map<string, V>>
}

/**
 * Readonly registry interface.
 * Provides async lookup methods for registry items.
 */
export interface Registry<V extends RegistryItem> {
  /**
   * Get an entry by key.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  get(key: string): Promise<RegistryEntry<V> | undefined>

  /**
   * Check if a key exists in the registry.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  has(key: string): Promise<boolean>

  /**
   * Get all registered keys.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  keys(): Promise<string[]>

  /**
   * Get all entries as a Map.
   * @throws RegistryNotLoadedError if reload() was never called
   */
  entries(): Promise<Map<string, RegistryEntry<V>>>
}

/**
 * Mutable registry that composes multiple bundles.
 * Extends Registry with bundle management and reload capability.
 */
export interface ComposableRegistry<
  V extends RegistryItem,
> extends Registry<V> {
  /**
   * Add a bundle to the registry.
   * Bundles are loaded in order when reload() is called.
   */
  addBundle(bundle: RegistryBundle<V>): void

  addRegistryItem(item: V): void

  /**
   * Reload all bundles.
   * - Calls dispose() on existing items
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new items
   *
   * Idempotent: can be called multiple times.
   *
   * @throws RegistryConflictError if same key exists in multiple bundles
   */
  reload(): Promise<void>

  /** Get all registered bundles */
  getBundles(): RegistryBundle<V>[]
}
