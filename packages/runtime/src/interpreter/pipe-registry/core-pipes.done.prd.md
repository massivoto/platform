# PRD: Core Pipes Registry

**Status:** IMPLEMENTED
**Last updated:** 2026-01-22
**Target Version:** 0.5

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Scope | Complete | - |
| Requirements: Types | Complete | 4/4 |
| Requirements: Registry | Complete | 4/4 |
| Requirements: Core Pipes | Complete | 9/9 |
| Requirements: Error Handling | Complete | 3/3 |
| Acceptance Criteria | Complete | 16/16 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - v0.5: Pipe evaluation

## Child PRDs

- [pipe-evaluator.prd.md](../evaluator/pipe-evaluator.prd.md) - Evaluator integration (depends on this)

## Context

The expression evaluator needs to execute pipe expressions like `{users | filter:active | map:name}`.
Following the established pattern of CommandRegistry and AppletRegistry, we need a PipeRegistry
to manage pipe functions.

This PRD creates:
1. `PipeFunction` interface extending `RegistryItem` from kit
2. `PipeRegistry` wrapping `BaseComposableRegistry<PipeFunction>`
3. `CorePipesBundle` with built-in pipes (filter, map, first, last, join, length, flatten, reverse)

The pipes are testable independently of the evaluator, allowing focused unit tests.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-22 | Location | **Runtime** | Parallel to command-registry; pipes need ExecutionContext |
| 2026-01-22 | Interface | **execute(input, args)** | Simple signature; args are pre-evaluated by evaluator |
| 2026-01-22 | Async | **All async** | Consistent with registry pattern; enables future async pipes |
| 2026-01-22 | Args type | **any[]** | Evaluator evaluates args before passing; pipe receives values |

## Scope

**In scope:**
- `PipeFunction` interface extending `RegistryItem`
- `PipeRegistry` class wrapping `BaseComposableRegistry`
- `CorePipesBundle` with built-in pipes
- Core pipes: `filter`, `map`, `first`, `last`, `join`, `length`, `flatten`, `reverse`, `unique`
- Unit tests for each pipe (no evaluator dependency)
- Error types: `PipeError`, `PipeArgumentError`

**Out of scope:**
- Evaluator integration (separate PRD: pipe-evaluator.prd.md)
- Custom user pipes (v1.0)
- Pipe argument validation schemas (v1.0)
- `sort` pipe (requires comparator function, defer)
- `slice` pipe (defer to pipe-evaluator or later)

## Requirements

### Types

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/runtime/src/interpreter/pipe-registry/types.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-PIPE-01: Define `PipeFunction` interface extending `RegistryItem`:
  ```typescript
  interface PipeFunction extends RegistryItem {
    readonly id: string      // 'filter', 'map', etc.
    readonly type: 'pipe'
    execute(input: any, args: any[]): Promise<any>
  }
  ```

- [x] R-PIPE-02: Define `BasePipeFunction` abstract class with default init/dispose:
  ```typescript
  abstract class BasePipeFunction implements PipeFunction {
    abstract readonly id: string
    readonly type = 'pipe' as const
    async init(): Promise<void> {}
    async dispose(): Promise<void> {}
    abstract execute(input: any, args: any[]): Promise<any>
  }
  ```

- [x] R-PIPE-03: Export `PipeFunction` and `BasePipeFunction` from module index

- [x] R-PIPE-04: Add JSDoc with usage examples to `PipeFunction` interface

### Registry

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/runtime/src/interpreter/pipe-registry/pipe-registry.spec.ts`
**Progress:** 4/4 (100%)

- [x] R-PIPE-21: Implement `PipeRegistry` class wrapping `BaseComposableRegistry<PipeFunction>`

- [x] R-PIPE-22: `PipeRegistry.addBundle(bundle)` registers a pipe bundle

- [x] R-PIPE-23: `PipeRegistry.reload()` loads all bundles with conflict detection

- [x] R-PIPE-24: `PipeRegistry.get(pipeId)` returns `RegistryEntry<PipeFunction> | undefined`

### Core Pipes

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/runtime/src/interpreter/pipe-registry/core-pipes-bundle.spec.ts`
**Progress:** 9/9 (100%)

- [x] R-PIPE-41: `filter` pipe - filters array where `item[propName]` is truthy
  - Input: array
  - Args: `[propName: string]`
  - Output: filtered array
  - Example: `[{a:1,active:true},{a:2,active:false}]` + `['active']` = `[{a:1,active:true}]`

- [x] R-PIPE-42: `map` pipe - extracts property from each item
  - Input: array
  - Args: `[propName: string]`
  - Output: array of property values
  - Example: `[{name:'Emma'},{name:'Bob'}]` + `['name']` = `['Emma','Bob']`

- [x] R-PIPE-43: `first` pipe - returns first element
  - Input: array
  - Args: none
  - Output: first element or `undefined`
  - Example: `[1,2,3]` = `1`

- [x] R-PIPE-44: `last` pipe - returns last element
  - Input: array
  - Args: none
  - Output: last element or `undefined`
  - Example: `[1,2,3]` = `3`

- [x] R-PIPE-45: `join` pipe - joins array to string
  - Input: array
  - Args: `[separator?: string]` (default: `','`)
  - Output: string
  - Example: `['a','b','c']` + `['-']` = `'a-b-c'`

- [x] R-PIPE-46: `length` pipe - returns length of array, string, or object key count
  - Input: array, string, or object
  - Args: none
  - Output: number
  - Example: `[1,2,3]` = `3`, `'hello'` = `5`, `{a:1,b:2}` = `2`

- [x] R-PIPE-47: `flatten` pipe - flattens one level of nested arrays
  - Input: array
  - Args: none
  - Output: flattened array
  - Example: `[[1,2],[3,4]]` = `[1,2,3,4]`

- [x] R-PIPE-48: `reverse` pipe - returns reversed array (does not mutate)
  - Input: array
  - Args: none
  - Output: new reversed array
  - Example: `[1,2,3]` = `[3,2,1]`

- [x] R-PIPE-49: `unique` pipe - returns array with duplicates removed
  - Input: array
  - Args: none
  - Output: array with unique values (preserves order, keeps first occurrence)
  - Example: `[1,2,2,3,1]` = `[1,2,3]`

### Error Handling

**Last updated:** 2026-01-22
**Test:** `npx vitest run packages/runtime/src/interpreter/pipe-registry/errors.spec.ts`
**Progress:** 3/3 (100%)

- [x] R-PIPE-61: `PipeError` class with `pipeId` and `message` properties

- [x] R-PIPE-62: `PipeArgumentError` extends `PipeError` with `expectedArgs` hint

- [x] R-PIPE-63: `PipeTypeError` extends `PipeError` for input type mismatches
  - Message format: `"Pipe 'filter' requires array input, got number"`

## Implementation

### File Structure

```
packages/runtime/src/interpreter/pipe-registry/
├── types.ts                    # PipeFunction, BasePipeFunction
├── types.spec.ts               # Interface compliance tests
├── pipe-registry.ts            # PipeRegistry class
├── pipe-registry.spec.ts       # Registry tests
├── core-pipes-bundle.ts        # CorePipesBundle + pipe implementations
├── core-pipes-bundle.spec.ts   # Unit tests for each pipe
├── errors.ts                   # PipeError, PipeArgumentError, PipeTypeError
├── errors.spec.ts              # Error tests
└── index.ts                    # Public exports
```

### PipeFunction Interface

```typescript
// types.ts
import type { RegistryItem } from '@massivoto/kit'

/**
 * PipeFunction - A data transformation function for pipe expressions.
 *
 * Pipes transform data in a chain: `{data | pipe1:arg | pipe2}`
 * Each pipe receives the output of the previous pipe as input.
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
 * ```
 */
export interface PipeFunction extends RegistryItem {
  readonly id: string
  readonly type: 'pipe'

  /**
   * Execute the pipe transformation.
   *
   * @param input - Data from previous pipe or initial expression
   * @param args - Evaluated arguments (e.g., property name, separator)
   * @returns Transformed data
   * @throws PipeError on invalid input or arguments
   */
  execute(input: any, args: any[]): Promise<any>
}

/**
 * Base class for pipe functions with default lifecycle methods.
 */
export abstract class BasePipeFunction implements PipeFunction {
  abstract readonly id: string
  readonly type = 'pipe' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  abstract execute(input: any, args: any[]): Promise<any>
}
```

### CorePipesBundle

```typescript
// core-pipes-bundle.ts
import type { RegistryBundle } from '@massivoto/kit'
import type { PipeFunction } from './types.js'
import { BasePipeFunction } from './types.js'
import { PipeTypeError, PipeArgumentError } from './errors.js'

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
    return input.filter(item => item?.[propName])
  }
}

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
    return input.map(item => item?.[propName])
  }
}

class FirstPipe extends BasePipeFunction {
  readonly id = 'first'

  async execute(input: any, args: any[]): Promise<any> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('first', 'array', typeof input)
    }
    return input[0]
  }
}

class LastPipe extends BasePipeFunction {
  readonly id = 'last'

  async execute(input: any, args: any[]): Promise<any> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('last', 'array', typeof input)
    }
    return input[input.length - 1]
  }
}

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

class FlattenPipe extends BasePipeFunction {
  readonly id = 'flatten'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('flatten', 'array', typeof input)
    }
    return input.flat()
  }
}

class ReversePipe extends BasePipeFunction {
  readonly id = 'reverse'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('reverse', 'array', typeof input)
    }
    return [...input].reverse()
  }
}

class UniquePipe extends BasePipeFunction {
  readonly id = 'unique'

  async execute(input: any, args: any[]): Promise<any[]> {
    if (!Array.isArray(input)) {
      throw new PipeTypeError('unique', 'array', typeof input)
    }
    return [...new Set(input)]
  }
}

export class CorePipesBundle implements RegistryBundle<PipeFunction> {
  readonly id = 'core'

  async load(): Promise<Map<string, PipeFunction>> {
    const pipes = new Map<string, PipeFunction>()

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

    for (const pipe of corePipes) {
      pipes.set(pipe.id, pipe)
    }

    return pipes
  }
}
```

## Dependencies

- **Depends on:**
  - `@massivoto/kit` - BaseComposableRegistry, RegistryItem, RegistryBundle
- **Blocks:**
  - pipe-evaluator.prd.md - Evaluator integration

## Open Questions

- [x] Should pipes be sync or async? **All async** - consistent with registry pattern
- [x] Should `filter:active` receive `"active"` string or resolved value? **String** - evaluator passes literal
- [x] Should `length` work on objects (key count)? **Yes** - added to R-PIPE-46
- [x] Should we add `unique` pipe? **Yes** - added as R-PIPE-49 

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [evaluator.prd.md](../evaluator/evaluator.prd.md)

### Criteria

**Registry:**
- [x] AC-PIPE-01: Given CorePipesBundle, when registry.reload() is called, then 9 pipes are registered
- [x] AC-PIPE-02: Given registry with 'filter' pipe, when registry.get('filter') is called, then returns RegistryEntry with bundleId 'core'

**Filter Pipe:**
- [x] AC-PIPE-03: Given `[{name:'Emma',active:true},{name:'Bob',active:false}]` and args `['active']`, when filter.execute() is called, then result is `[{name:'Emma',active:true}]`
- [x] AC-PIPE-04: Given non-array input, when filter.execute() is called, then throws PipeTypeError

**Map Pipe:**
- [x] AC-PIPE-05: Given `[{name:'Emma'},{name:'Bob'}]` and args `['name']`, when map.execute() is called, then result is `['Emma','Bob']`

**First/Last Pipe:**
- [x] AC-PIPE-06: Given `[1,2,3]`, when first.execute() is called, then result is `1`
- [x] AC-PIPE-07: Given `[1,2,3]`, when last.execute() is called, then result is `3`
- [x] AC-PIPE-08: Given `[]`, when first.execute() is called, then result is `undefined`

**Join Pipe:**
- [x] AC-PIPE-09: Given `['Alice','Bob']` and args `[', ']`, when join.execute() is called, then result is `'Alice, Bob'`
- [x] AC-PIPE-10: Given `['a','b','c']` and no args, when join.execute() is called, then result is `'a,b,c'` (default separator)

**Length Pipe:**
- [x] AC-PIPE-11: Given `[1,2,3]`, when length.execute() is called, then result is `3`
- [x] AC-PIPE-12: Given `'hello'`, when length.execute() is called, then result is `5`
- [x] AC-PIPE-13: Given `{a:1,b:2,c:3}`, when length.execute() is called, then result is `3` (object key count)

**Flatten/Reverse/Unique Pipe:**
- [x] AC-PIPE-14: Given `[[1,2],[3,4]]`, when flatten.execute() is called, then result is `[1,2,3,4]`
- [x] AC-PIPE-15: Given `[1,2,3]`, when reverse.execute() is called, then result is `[3,2,1]` and original array unchanged
- [x] AC-PIPE-16: Given `[1,2,2,3,1]`, when unique.execute() is called, then result is `[1,2,3]`

## Test File Structure

```
packages/runtime/src/interpreter/pipe-registry/
├── types.spec.ts               # Interface compliance
├── pipe-registry.spec.ts       # Registry add/reload/get
├── core-pipes-bundle.spec.ts   # All 8 pipes with happy path + errors
└── errors.spec.ts              # Error class tests
```
