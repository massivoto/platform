/**
 * Pipe Types
 *
 * Requirements:
 * - R-PIPE-01: PipeFunction interface extending RegistryItem
 * - R-PIPE-02: BasePipeFunction abstract class with default init/dispose
 * - R-PIPE-03: Export from module index
 * - R-PIPE-04: JSDoc with usage examples
 */
import type { RegistryItem } from '@massivoto/kit'

/**
 * PipeFunction - A data transformation function for pipe expressions.
 *
 * Pipes transform data in a chain: `{data | pipe1:arg | pipe2}`
 * Each pipe receives the output of the previous pipe as input.
 *
 * Extends RegistryItem with:
 * - `id`: Pipe name (e.g., 'filter', 'map', 'join')
 * - `type`: Always 'pipe'
 * - `execute()`: Transform input data with optional arguments
 *
 * @example
 * ```typescript
 * class FilterPipe extends BasePipeFunction {
 *   readonly id = 'filter'
 *
 *   async execute(input: any[], args: any[]): Promise<any[]> {
 *     const propName = args[0] as string
 *     return input.filter(item => item?.[propName])
 *   }
 * }
 *
 * // Usage: {users | filter:active}
 * const result = await filterPipe.execute(users, ['active'])
 * ```
 */
export interface PipeFunction extends RegistryItem {
  /**
   * Unique pipe identifier.
   * @example 'filter', 'map', 'join', 'length'
   */
  readonly id: string

  /**
   * Item type - always 'pipe' for pipe functions.
   */
  readonly type: 'pipe'

  /**
   * Execute the pipe transformation.
   *
   * @param input - Data from previous pipe or initial expression
   * @param args - Evaluated arguments (e.g., property name, separator)
   * @returns Transformed data
   * @throws PipeError on invalid input or arguments
   *
   * @example
   * ```typescript
   * // filter pipe: {users | filter:active}
   * await filterPipe.execute(users, ['active'])
   *
   * // join pipe: {names | join:', '}
   * await joinPipe.execute(names, [', '])
   *
   * // length pipe: {items | length}
   * await lengthPipe.execute(items, [])
   * ```
   */
  execute(input: any, args: any[]): Promise<any>
}

/**
 * Base class for pipe functions with default lifecycle methods.
 *
 * Provides default no-op implementations of init() and dispose().
 * Subclasses must implement:
 * - `id`: Unique pipe identifier
 * - `execute()`: Transform input data
 *
 * @example
 * ```typescript
 * class MapPipe extends BasePipeFunction {
 *   readonly id = 'map'
 *
 *   async execute(input: any[], args: any[]): Promise<any[]> {
 *     const propName = args[0] as string
 *     return input.map(item => item?.[propName])
 *   }
 * }
 *
 * const mapPipe = new MapPipe()
 * await mapPipe.init()  // No-op by default
 * const result = await mapPipe.execute(data, ['name'])
 * await mapPipe.dispose()  // No-op by default
 * ```
 */
export abstract class BasePipeFunction implements PipeFunction {
  /**
   * Unique pipe identifier.
   * Must be implemented by subclasses.
   */
  abstract readonly id: string

  /**
   * Item type - always 'pipe'.
   */
  readonly type = 'pipe' as const

  /**
   * Called once after loading. Default is no-op.
   * Override in subclass if setup is needed.
   */
  async init(): Promise<void> {
    // Default no-op - override in subclass if needed
  }

  /**
   * Called before unloading. Default is no-op.
   * Override in subclass if cleanup is needed.
   */
  async dispose(): Promise<void> {
    // Default no-op - override in subclass if needed
  }

  /**
   * Execute the pipe transformation.
   * Must be implemented by subclasses.
   */
  abstract execute(input: any, args: any[]): Promise<any>
}
