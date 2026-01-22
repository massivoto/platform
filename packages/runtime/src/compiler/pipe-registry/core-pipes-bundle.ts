/**
 * CorePipesBundle - RegistryBundle for built-in pipe functions.
 *
 * Requirements:
 * - R-PIPE-41 to R-PIPE-49: Core Pipes Implementation
 *
 * Provides 9 built-in pipes:
 * - filter: Filter array by truthy property
 * - map: Extract property from each item
 * - first: Get first element
 * - last: Get last element
 * - join: Join array to string
 * - length: Get length of array, string, or object key count
 * - flatten: Flatten one level of nested arrays
 * - reverse: Reverse array (non-mutating)
 * - unique: Remove duplicates preserving order
 */
import type { RegistryBundle } from '@massivoto/kit'
import type { PipeFunction } from './types.js'
import { BasePipeFunction } from './types.js'
import { PipeTypeError, PipeArgumentError } from './errors.js'

// =============================================================================
// Pipe Implementations
// =============================================================================

/**
 * FilterPipe - filters array where item[propName] is truthy.
 *
 * @example
 * ```dsl
 * {users | filter:active}
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
    ]

    // Register each pipe by its id
    for (const pipe of corePipes) {
      pipes.set(pipe.id, pipe)
    }

    return pipes
  }
}
