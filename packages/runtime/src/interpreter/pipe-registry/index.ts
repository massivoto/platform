/**
 * Pipe Registry Module
 *
 * Provides a registry for pipe functions used in expression evaluation.
 * Pipes transform data in chains: `{data | pipe1:arg | pipe2}`
 *
 * @example
 * ```typescript
 * import {
 *   PipeRegistry,
 *   CorePipesBundle,
 *   PipeFunction,
 *   BasePipeFunction,
 * } from './pipe-registry'
 *
 * // Set up registry
 * const registry = new PipeRegistry()
 * registry.addBundle(new CorePipesBundle())
 * await registry.reload()
 *
 * // Use a pipe
 * const entry = await registry.get('filter')
 * const result = await entry?.value.execute(data, ['active'])
 *
 * // Create custom pipe
 * class UppercasePipe extends BasePipeFunction {
 *   readonly id = 'uppercase'
 *   async execute(input: string): Promise<string> {
 *     return input.toUpperCase()
 *   }
 * }
 * ```
 */

// Types
export type { PipeFunction } from './types.js'
export { BasePipeFunction } from './types.js'

// Registry
export { PipeRegistry } from './pipe-registry.js'

// Bundle
export { CorePipesBundle } from './core-pipes-bundle.js'

// Errors
export { PipeError, PipeArgumentError, PipeTypeError } from './errors.js'
