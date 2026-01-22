/**
 * CorePipesBundle Tests
 *
 * Theme: Social Media Automation
 *
 * Requirements tested:
 * - R-PIPE-41 to R-PIPE-49: Core Pipes
 * - AC-PIPE-01 to AC-PIPE-16: Acceptance Criteria
 */
import { describe, it, expect } from 'vitest'
import { CorePipesBundle } from './core-pipes-bundle.js'
import type { PipeFunction } from './types.js'
import { PipeTypeError, PipeArgumentError } from './errors.js'

describe('CorePipesBundle', () => {
  describe('Bundle structure', () => {
    it('should have id = "core"', () => {
      const bundle = new CorePipesBundle()

      expect(bundle.id).toBe('core')
    })

    it('should implement load() returning Map<string, PipeFunction>', async () => {
      const bundle = new CorePipesBundle()

      const pipes = await bundle.load()

      expect(pipes).toBeInstanceOf(Map)
    })

    it('AC-PIPE-01: should register 9 pipes', async () => {
      const bundle = new CorePipesBundle()

      const pipes = await bundle.load()

      expect(pipes.size).toBe(9)
    })

    it('should return pipes with proper PipeFunction interface', async () => {
      const bundle = new CorePipesBundle()
      const pipes = await bundle.load()

      for (const [key, pipe] of pipes) {
        // Verify PipeFunction interface
        expect(pipe.id).toBeDefined()
        expect(pipe.type).toBe('pipe')
        expect(typeof pipe.init).toBe('function')
        expect(typeof pipe.dispose).toBe('function')
        expect(typeof pipe.execute).toBe('function')

        // Key should match pipe id
        expect(key).toBe(pipe.id)
      }
    })

    it('should include all 9 core pipes', async () => {
      const bundle = new CorePipesBundle()
      const pipes = await bundle.load()

      const expectedPipes = [
        'filter',
        'map',
        'first',
        'last',
        'join',
        'length',
        'flatten',
        'reverse',
        'unique',
      ]

      for (const pipeId of expectedPipes) {
        expect(pipes.has(pipeId)).toBe(true)
      }
    })
  })

  describe('Pipe lifecycle methods', () => {
    it('should have working init() on pipes', async () => {
      const bundle = new CorePipesBundle()
      const pipes = await bundle.load()

      const filterPipe = pipes.get('filter')!

      await expect(filterPipe.init()).resolves.toBeUndefined()
    })

    it('should have working dispose() on pipes', async () => {
      const bundle = new CorePipesBundle()
      const pipes = await bundle.load()

      const mapPipe = pipes.get('map')!

      await expect(mapPipe.dispose()).resolves.toBeUndefined()
    })
  })
})

describe('filter pipe', () => {
  let filterPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    filterPipe = pipes.get('filter')!
  })

  describe('R-PIPE-41: filter pipe filters array by truthy property', () => {
    it('AC-PIPE-03: should filter array by truthy property', async () => {
      const input = [
        { name: 'Emma', active: true },
        { name: 'Bob', active: false },
      ]

      const result = await filterPipe.execute(input, ['active'])

      expect(result).toEqual([{ name: 'Emma', active: true }])
    })

    it('should handle empty arrays', async () => {
      const result = await filterPipe.execute([], ['active'])

      expect(result).toEqual([])
    })

    it('should filter by any truthy value', async () => {
      const input = [
        { id: 1, count: 5 },
        { id: 2, count: 0 },
        { id: 3, count: 10 },
      ]

      const result = await filterPipe.execute(input, ['count'])

      expect(result).toEqual([
        { id: 1, count: 5 },
        { id: 3, count: 10 },
      ])
    })

    it('should handle nested undefined properties safely', async () => {
      const input = [{ name: 'Emma' }, { name: 'Bob', active: true }]

      const result = await filterPipe.execute(input, ['active'])

      expect(result).toEqual([{ name: 'Bob', active: true }])
    })

    it('AC-PIPE-04: should throw PipeTypeError for non-array input', async () => {
      await expect(
        filterPipe.execute('not an array', ['active']),
      ).rejects.toThrow(PipeTypeError)

      await expect(filterPipe.execute(123, ['active'])).rejects.toThrow(
        PipeTypeError,
      )

      await expect(filterPipe.execute({ a: 1 }, ['active'])).rejects.toThrow(
        PipeTypeError,
      )
    })

    it('should throw PipeArgumentError when property name is not a string', async () => {
      await expect(filterPipe.execute([{ a: 1 }], [])).rejects.toThrow(
        PipeArgumentError,
      )

      await expect(filterPipe.execute([{ a: 1 }], [123])).rejects.toThrow(
        PipeArgumentError,
      )
    })
  })
})

describe('map pipe', () => {
  let mapPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    mapPipe = pipes.get('map')!
  })

  describe('R-PIPE-42: map pipe extracts property from each item', () => {
    it('AC-PIPE-05: should extract property values', async () => {
      const input = [{ name: 'Emma' }, { name: 'Bob' }]

      const result = await mapPipe.execute(input, ['name'])

      expect(result).toEqual(['Emma', 'Bob'])
    })

    it('should handle empty arrays', async () => {
      const result = await mapPipe.execute([], ['name'])

      expect(result).toEqual([])
    })

    it('should return undefined for missing properties', async () => {
      const input = [{ name: 'Emma' }, { other: 'value' }]

      const result = await mapPipe.execute(input, ['name'])

      expect(result).toEqual(['Emma', undefined])
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(mapPipe.execute('not an array', ['name'])).rejects.toThrow(
        PipeTypeError,
      )
    })

    it('should throw PipeArgumentError when property name is not a string', async () => {
      await expect(mapPipe.execute([{ a: 1 }], [])).rejects.toThrow(
        PipeArgumentError,
      )
    })
  })
})

describe('first pipe', () => {
  let firstPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    firstPipe = pipes.get('first')!
  })

  describe('R-PIPE-43: first pipe returns first element', () => {
    it('AC-PIPE-06: should return first element', async () => {
      const result = await firstPipe.execute([1, 2, 3], [])

      expect(result).toBe(1)
    })

    it('AC-PIPE-08: should return undefined for empty array', async () => {
      const result = await firstPipe.execute([], [])

      expect(result).toBeUndefined()
    })

    it('should work with object arrays', async () => {
      const input = [{ name: 'Emma' }, { name: 'Bob' }]

      const result = await firstPipe.execute(input, [])

      expect(result).toEqual({ name: 'Emma' })
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(firstPipe.execute('string', [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('last pipe', () => {
  let lastPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    lastPipe = pipes.get('last')!
  })

  describe('R-PIPE-44: last pipe returns last element', () => {
    it('AC-PIPE-07: should return last element', async () => {
      const result = await lastPipe.execute([1, 2, 3], [])

      expect(result).toBe(3)
    })

    it('should return undefined for empty array', async () => {
      const result = await lastPipe.execute([], [])

      expect(result).toBeUndefined()
    })

    it('should work with object arrays', async () => {
      const input = [{ name: 'Emma' }, { name: 'Bob' }]

      const result = await lastPipe.execute(input, [])

      expect(result).toEqual({ name: 'Bob' })
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(lastPipe.execute('string', [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('join pipe', () => {
  let joinPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    joinPipe = pipes.get('join')!
  })

  describe('R-PIPE-45: join pipe joins array to string', () => {
    it('AC-PIPE-09: should join array with custom separator', async () => {
      const result = await joinPipe.execute(['Alice', 'Bob'], [', '])

      expect(result).toBe('Alice, Bob')
    })

    it('AC-PIPE-10: should use comma as default separator', async () => {
      const result = await joinPipe.execute(['a', 'b', 'c'], [])

      expect(result).toBe('a,b,c')
    })

    it('should join with hyphen separator', async () => {
      const result = await joinPipe.execute(['a', 'b', 'c'], ['-'])

      expect(result).toBe('a-b-c')
    })

    it('should handle empty arrays', async () => {
      const result = await joinPipe.execute([], [', '])

      expect(result).toBe('')
    })

    it('should convert non-string separator to string', async () => {
      const result = await joinPipe.execute([1, 2, 3], [0])

      expect(result).toBe('10203')
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(joinPipe.execute('not an array', [', '])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('length pipe', () => {
  let lengthPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    lengthPipe = pipes.get('length')!
  })

  describe('R-PIPE-46: length pipe returns length', () => {
    it('AC-PIPE-11: should return array length', async () => {
      const result = await lengthPipe.execute([1, 2, 3], [])

      expect(result).toBe(3)
    })

    it('AC-PIPE-12: should return string length', async () => {
      const result = await lengthPipe.execute('hello', [])

      expect(result).toBe(5)
    })

    it('AC-PIPE-13: should return object key count', async () => {
      const result = await lengthPipe.execute({ a: 1, b: 2, c: 3 }, [])

      expect(result).toBe(3)
    })

    it('should return 0 for empty array', async () => {
      const result = await lengthPipe.execute([], [])

      expect(result).toBe(0)
    })

    it('should return 0 for empty string', async () => {
      const result = await lengthPipe.execute('', [])

      expect(result).toBe(0)
    })

    it('should return 0 for empty object', async () => {
      const result = await lengthPipe.execute({}, [])

      expect(result).toBe(0)
    })

    it('should return 0 for null', async () => {
      const result = await lengthPipe.execute(null, [])

      expect(result).toBe(0)
    })

    it('should return 0 for undefined', async () => {
      const result = await lengthPipe.execute(undefined, [])

      expect(result).toBe(0)
    })

    it('should throw PipeTypeError for number input', async () => {
      await expect(lengthPipe.execute(123, [])).rejects.toThrow(PipeTypeError)
    })

    it('should throw PipeTypeError for function input', async () => {
      await expect(lengthPipe.execute(() => {}, [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('flatten pipe', () => {
  let flattenPipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    flattenPipe = pipes.get('flatten')!
  })

  describe('R-PIPE-47: flatten pipe flattens one level', () => {
    it('AC-PIPE-14: should flatten one level of nested arrays', async () => {
      const result = await flattenPipe.execute(
        [
          [1, 2],
          [3, 4],
        ],
        [],
      )

      expect(result).toEqual([1, 2, 3, 4])
    })

    it('should only flatten one level', async () => {
      const result = await flattenPipe.execute([[1, [2, 3]], [4]], [])

      expect(result).toEqual([1, [2, 3], 4])
    })

    it('should handle empty arrays', async () => {
      const result = await flattenPipe.execute([], [])

      expect(result).toEqual([])
    })

    it('should handle arrays with no nesting', async () => {
      const result = await flattenPipe.execute([1, 2, 3], [])

      expect(result).toEqual([1, 2, 3])
    })

    it('should handle mixed content', async () => {
      const result = await flattenPipe.execute([[1, 2], 3, [4, 5]], [])

      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(flattenPipe.execute('not an array', [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('reverse pipe', () => {
  let reversePipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    reversePipe = pipes.get('reverse')!
  })

  describe('R-PIPE-48: reverse pipe returns reversed array', () => {
    it('AC-PIPE-15: should return reversed array', async () => {
      const result = await reversePipe.execute([1, 2, 3], [])

      expect(result).toEqual([3, 2, 1])
    })

    it('AC-PIPE-15: should not mutate original array', async () => {
      const original = [1, 2, 3]

      await reversePipe.execute(original, [])

      expect(original).toEqual([1, 2, 3])
    })

    it('should handle empty arrays', async () => {
      const result = await reversePipe.execute([], [])

      expect(result).toEqual([])
    })

    it('should handle single element', async () => {
      const result = await reversePipe.execute([1], [])

      expect(result).toEqual([1])
    })

    it('should work with object arrays', async () => {
      const input = [{ a: 1 }, { b: 2 }]

      const result = await reversePipe.execute(input, [])

      expect(result).toEqual([{ b: 2 }, { a: 1 }])
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(reversePipe.execute('string', [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

describe('unique pipe', () => {
  let uniquePipe: PipeFunction

  beforeEach(async () => {
    const bundle = new CorePipesBundle()
    const pipes = await bundle.load()
    uniquePipe = pipes.get('unique')!
  })

  describe('R-PIPE-49: unique pipe removes duplicates', () => {
    it('AC-PIPE-16: should remove duplicates preserving order', async () => {
      const result = await uniquePipe.execute([1, 2, 2, 3, 1], [])

      expect(result).toEqual([1, 2, 3])
    })

    it('should handle empty arrays', async () => {
      const result = await uniquePipe.execute([], [])

      expect(result).toEqual([])
    })

    it('should handle array with no duplicates', async () => {
      const result = await uniquePipe.execute([1, 2, 3], [])

      expect(result).toEqual([1, 2, 3])
    })

    it('should handle strings', async () => {
      const result = await uniquePipe.execute(['a', 'b', 'a', 'c', 'b'], [])

      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should keep first occurrence', async () => {
      const result = await uniquePipe.execute([3, 1, 2, 1, 3], [])

      expect(result).toEqual([3, 1, 2])
    })

    it('should throw PipeTypeError for non-array input', async () => {
      await expect(uniquePipe.execute('string', [])).rejects.toThrow(
        PipeTypeError,
      )
    })
  })
})

// Import beforeEach from vitest
import { beforeEach } from 'vitest'
