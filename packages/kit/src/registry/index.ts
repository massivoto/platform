/**
 * Common Registry Interface
 *
 * Provides a composable registry pattern for loading items from multiple sources.
 * Used by CommandRegistry, ProviderRegistry, and AppletRegistry in runtime.
 *
 * @example
 * ```typescript
 * import {
 *   BaseComposableRegistry,
 *   ModuleSource,
 *   RegistryItem,
 * } from '@massivoto/kit'
 *
 * interface MyHandler extends RegistryItem {
 *   type: 'handler'
 *   execute(): Promise<void>
 * }
 *
 * const registry = new BaseComposableRegistry<MyHandler>()
 * registry.addSource(new ModuleSource({
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
  RegistrySource,
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
export { ModuleSource } from './module-source.js'
export type { ModuleAdapter, ModuleSourceConfig } from './module-source.js'
