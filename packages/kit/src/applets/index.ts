/**
 * Applet System
 *
 * Provides shared types and registry for applet definitions.
 * Used by both local (v0.5) and cloud (v1.0) runtimes.
 *
 * @example
 * ```typescript
 * import {
 *   AppletRegistry,
 *   CoreAppletsBundle,
 *   type AppletDefinition,
 * } from '@massivoto/kit'
 *
 * const registry = new AppletRegistry()
 * registry.addBundle(new CoreAppletsBundle())
 * await registry.reload()
 *
 * const entry = await registry.get('confirm')
 * ```
 */

// Types
export type { AppletDefinition } from './types.js'

// Registry
export { AppletRegistry } from './applet-registry.js'

// Bundles
export { CoreAppletsBundle } from './core-applets-bundle.js'

// Docker utilities
export * from './docker/index.js'
