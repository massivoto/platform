/**
 * CorePipesBundle - RegistryBundle for built-in pipe functions.
 *
 * Requirements:
 * - R-PIPE-41 to R-PIPE-49: Core Pipes Implementation
 *
 * Provides 10 built-in pipes:
 * - filter: Filter array by property value (filter:prop:value) or truthy (filter:prop)
 * - map: Extract property from each item
 * - first: Get first element
 * - last: Get last element
 * - join: Join array to string
 * - length: Get length of array, string, or object key count
 * - flatten: Flatten one level of nested arrays
 * - reverse: Reverse array (non-mutating)
 * - unique: Remove duplicates preserving order
 * - slice: Get array slice (slice:start:end)
 */
import type { RegistryBundle } from '@massivoto/kit'
import type { PipeFunction } from './types.js'
import { BasePipeFunction } from './types.js'
import { PipeTypeError, PipeArgumentError } from './errors.js'

// =============================================================================
// Pipe Implementations
// =============================================================================

/**
 * FilterPipe - filters array where item[propName] equals value.
 *
 * Supports two forms:
 * - filter:propName:value - filters where item[propName] === value
 * - filter:propName - filters where item[propName] is truthy (legacy)
 *
 * @example
 * ```dsl
 * {users | filter:active:true}
 * {users | filter:name:"Emma"}
 * {users | filter:active}  // truthy check (legacy)
 * ```
 */
class FilterPipe extends BasePipeFunction {
  readonly id = 'filter'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('filter', 'array', typeof input)
    }
    const propName = args[0]
    if (typeof propName !== 'string') {
      throw new PipeArgumentError('filter', 'property name (string)')
    }
    // If two arguments, filter by equality
    if (args.length >= 2) {
      const expectedValue = args[1]
      return input.filter((item) => item?.[propName] === expectedValue)
    }
    // Single argument: filter by truthy value (legacy)
    return input.filter((item) => item?.[propName])
  }
}

/**
 * MapPipe - extracts property from each item.
 *
 * @example
 * ```dsl
 * {users | map:name}
 * ```
 */
class MapPipe extends BasePipeFunction {
  readonly id = 'map'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('map', 'array', typeof input)
    }
    const propName = args[0]
    if (typeof propName !== 'string') {
      throw new PipeArgumentError('map', 'property name (string)')
    }
    return input.map((item) => item?.[propName])
  }
}

/**
 * FirstPipe - returns first element.
 *
 * @example
 * ```dsl
 * {items | first}
 * ```
 */
class FirstPipe extends BasePipeFunction {
  readonly id = 'first'

  async execute(input: any, args: any[]): Promise<any> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('first', 'array', typeof input)
    }
    return input[0]
  }
}

/**
 * LastPipe - returns last element.
 *
 * @example
 * ```dsl
 * {items | last}
 * ```
 */
class LastPipe extends BasePipeFunction {
  readonly id = 'last'

  async execute(input: any, args: any[]): Promise<any> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('last', 'array', typeof input)
    }
    return input[input.length - 1]
  }
}

/**
 * JoinPipe - joins array to string.
 *
 * @example
 * ```dsl
 * {names | join:', '}
 * {tags | join}  // defaults to comma
 * ```
 */
class JoinPipe extends BasePipeFunction {
  readonly id = 'join'

  async execute(input: any, args: any[]): Promise<string> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('join', 'array', typeof input)
    }
    const separator = args[0] ?? ','
    return input.join(String(separator))
  }
}

/**
 * LengthPipe - returns length of array, string, or object key count.
 *
 * @example
 * ```dsl
 * {items | length}
 * {message | length}
 * {data | length}
 * ```
 */
class LengthPipe extends BasePipeFunction {
  readonly id = 'length'

  async execute(input: any, args: any[]): Promise<number> {
    if (input == null) return 0
    if (typeof input === 'string' || Array.isArray(input)) {
      return input.length
    }
    if (typeof input === 'object') {
      return Object.keys(input).length
    }
    throw new PipeTypeError('length', 'array, string, or object', typeof input)
  }
}

/**
 * FlattenPipe - flattens one level of nested arrays.
 *
 * @example
 * ```dsl
 * {nestedItems | flatten}
 * ```
 */
class FlattenPipe extends BasePipeFunction {
  readonly id = 'flatten'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('flatten', 'array', typeof input)
    }
    return input.flat()
  }
}

/**
 * ReversePipe - returns reversed array (does not mutate original).
 *
 * @example
 * ```dsl
 * {items | reverse}
 * ```
 */
class ReversePipe extends BasePipeFunction {
  readonly id = 'reverse'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('reverse', 'array', typeof input)
    }
    return [...input].reverse()
  }
}

/**
 * UniquePipe - returns array with duplicates removed.
 * Preserves order, keeps first occurrence.
 *
 * @example
 * ```dsl
 * {tags | unique}
 * ```
 */
class UniquePipe extends BasePipeFunction {
  readonly id = 'unique'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('unique', 'array', typeof input)
    }
    return [...new Set(input)]
  }
}

/**
 * SlicePipe - returns a slice of the array.
 *
 * Arguments:
 * - start: Starting index (inclusive)
 * - end: Optional ending index (exclusive)
 *
 * @example
 * ```dsl
 * {items | slice:1:3}  // [2, 3] from [1, 2, 3, 4, 5]
 * {items | slice:2}    // [3, 4, 5] from [1, 2, 3, 4, 5]
 * ```
 */
class SlicePipe extends BasePipeFunction {
  readonly id = 'slice'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('slice', 'array', typeof input)
    }
    const start = args[0] ?? 0
    const end = args[1] // undefined means slice to end
    if (typeof start !== 'number') {
      throw new PipeArgumentError('slice', 'start index (number)')
    }
    if (end !== undefined && typeof end !== 'number') {
      throw new PipeArgumentError('slice', 'end index (number, optional)')
    }
    return input.slice(start, end)
  }
}

// =============================================================================
// CorePipesBundle
// =============================================================================

/**
 * CorePipesBundle - provides built-in pipe functions.
 *
 * This bundle is always available and provides the core pipes
 * that are part of the runtime.
 *
 * @example
 * ```typescript
 * const registry = new PipeRegistry()
 * registry.addBundle(new CorePipesBundle())
 * await registry.reload()
 *
 * const filterPipe = registry.get('filter')
 * ```
 */
export class CorePipesBundle implements RegistryBundle<PipeFunction> {
  readonly id = 'core'

  async load(): Promise<Map<string, PipeFunction>> {
    const pipes = new Map<string, PipeFunction>()

    // Create instances of all core pipes
    const corePipes: PipeFunction[] = [
      new FilterPipe(),
      new MapPipe(),
      new FirstPipe(),
      new LastPipe(),
      new JoinPipe(),
      new LengthPipe(),
      new FlattenPipe(),
      new ReversePipe(),
      new UniquePipe(),
      new SlicePipe(),
    ]

    // Register each pipe by its id
    for (const pipe of corePipes) {
      pipes.set(pipe.id, pipe)
    }

    return pipes
  }
}
