/**
 * PipeRegistry Interface
 *
 * R-SEP-04: Defines the contract for pipe function resolution.
 * The runtime package provides this interface; implementations
 * live in @massivoto/interpreter (BSL 1.1 licensed).
 *
 * @example
 * ```typescript
 * import { PipeRegistry } from '@massivoto/runtime'
 * import { CorePipeRegistry, CorePipesBundle } from '@massivoto/interpreter'
 *
 * const registry: PipeRegistry = new CorePipeRegistry()
 * registry.addBundle(new CorePipesBundle())
 * await registry.reload()
 *
 * const entry = await registry.get('filter')
 * ```
 */
import type { RegistryBundle, RegistryEntry } from '@massivoto/kit'

/**
 * Pipe function interface for data transformation.
 * Used in pipe expressions like {data | filter:key | map:fn}
 */
export interface PipeFunction {
  /** Unique pipe identifier (e.g., 'filter', 'map', 'join') */
  readonly id: string

  /** Item type - always 'pipe' */
  readonly type: 'pipe'

  /** Initialize the pipe (called after loading) */
  init(): Promise<void>

  /** Dispose the pipe (called before unloading) */
  dispose(): Promise<void>

  /**
   * Execute the pipe transformation.
   *
   * @param input - Data from previous pipe or initial expression
   * @param args - Evaluated arguments (e.g., property name, separator)
   * @returns Transformed data
   */
  execute(input: unknown, args: unknown[]): Promise<unknown>
}

/**
 * PipeRegistry interface for managing pipe functions.
 *
 * Implementations must provide:
 * - get(): Async lookup of pipes by id
 * - addBundle(): Add a bundle of pipes
 * - reload(): Load all bundles with conflict detection
 */
export interface PipeRegistry {
  /**
   * Get a pipe function entry by id.
   *
   * @param pipeId - The pipe identifier (e.g., 'filter', 'map')
   * @returns The entry if found, undefined otherwise
   */
  get(pipeId: string): Promise<RegistryEntry<PipeFunction> | undefined>

  /**
   * Add a bundle of pipe functions.
   * Bundles are loaded in order when reload() is called.
   *
   * @param bundle - The bundle to add
   */
  addBundle(bundle: RegistryBundle<PipeFunction>): void

  /**
   * Reload all bundles.
   * - Calls dispose() on existing pipes
   * - Loads all bundles
   * - Detects conflicts (throws RegistryConflictError)
   * - Calls init() on new pipes
   */
  reload(): Promise<void>
}
