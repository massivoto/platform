/**
 * Common Registry Interface
 *
 * Provides a composable registry pattern for loading items from multiple bundles.
 * Used by CommandRegistry, ProviderRegistry, and AppletRegistry in runtime.
 *
 * @example
 * ```typescript
 * import {
 *   BaseComposableRegistry,
 *   ModuleBundle,
 *   RegistryItem,
 * } from '@massivoto/kit'
 *
 * interface MyHandler extends RegistryItem {
 *   type: 'handler'
 *   execute(): Promise<void>
 * }
 *
 * const registry = new BaseComposableRegistry<MyHandler>()
 * registry.addBundle(new ModuleBundle({
 *   id: 'core',
 *   modulePath: './handlers.js',
 *   adapter: (exports) => new Map(exports.handlers)
 * }))
 *
 * await registry.reload()
 * const entry = await registry.get('@utils/myHandler')
 * ```
 */

// Types
export type {
  Registry,
  ComposableRegistry,
  RegistryBundle,
  RegistryEntry,
  RegistryItem,
} from './types.js'

// Errors
export {
  RegistryConflictError,
  RegistryNotLoadedError,
  ModuleLoadError,
} from './errors.js'
export type { RegistryConflict } from './errors.js'

// Implementations
export { BaseComposableRegistry } from './base-composable-registry.js'
export { ModuleBundle } from './module-bundle.js'
export type { ModuleAdapter, ModuleBundleConfig } from './module-bundle.js'
