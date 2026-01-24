/**
 * Pipe Types Tests
 *
 * Requirements tested:
 * - R-PIPE-01: PipeFunction interface extending RegistryItem
 * - R-PIPE-02: BasePipeFunction abstract class with default init/dispose
 * - R-PIPE-03: Export from module index (tested in index.spec.ts)
 * - R-PIPE-04: JSDoc with usage examples
 */
import { describe, it, expect } from 'vitest'
import type { RegistryItem } from '@massivoto/kit'
import type { PipeFunction } from './types.js'
import { BasePipeFunction } from './types.js'

describe('PipeFunction interface', () => {
  describe('R-PIPE-01: PipeFunction extends RegistryItem', () => {
    it('should have required RegistryItem properties', () => {
      // Create a concrete implementation to test the interface
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe: PipeFunction = new TestPipe()

      // RegistryItem properties
      expect(pipe.id).toBe('test')
      expect(pipe.type).toBe('pipe')
      expect(typeof pipe.init).toBe('function')
      expect(typeof pipe.dispose).toBe('function')

      // PipeFunction-specific
      expect(typeof pipe.execute).toBe('function')
    })

    it('should have type = "pipe"', () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      expect(pipe.type).toBe('pipe')
    })

    it('should have execute(input, args) returning Promise', async () => {
      class EchoPipe extends BasePipeFunction {
        readonly id = 'echo'

        async execute(input: any, args: any[]): Promise<any> {
          return { input, args }
        }
      }

      const pipe = new EchoPipe()
      const result = await pipe.execute('hello', ['arg1', 'arg2'])

      expect(result).toEqual({ input: 'hello', args: ['arg1', 'arg2'] })
    })
  })
})

describe('BasePipeFunction', () => {
  describe('R-PIPE-02: BasePipeFunction abstract class', () => {
    it('should set type = "pipe" as const', () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      expect(pipe.type).toBe('pipe')
      // Type should be exactly 'pipe', not string
      const typeCheck: 'pipe' = pipe.type
      expect(typeCheck).toBe('pipe')
    })

    it('should have default init() that resolves to undefined', async () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      await expect(pipe.init()).resolves.toBeUndefined()
    })

    it('should have default dispose() that resolves to undefined', async () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      await expect(pipe.dispose()).resolves.toBeUndefined()
    })

    it('should allow subclass to override init()', async () => {
      let initialized = false

      class InitializablePipe extends BasePipeFunction {
        readonly id = 'initializable'

        async init(): Promise<void> {
          initialized = true
        }

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new InitializablePipe()
      await pipe.init()

      expect(initialized).toBe(true)
    })

    it('should allow subclass to override dispose()', async () => {
      let disposed = false

      class DisposablePipe extends BasePipeFunction {
        readonly id = 'disposable'

        async dispose(): Promise<void> {
          disposed = true
        }

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new DisposablePipe()
      await pipe.dispose()

      expect(disposed).toBe(true)
    })

    it('should implement RegistryItem interface', () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      // Can be assigned to RegistryItem
      const registryItem: RegistryItem = pipe
      expect(registryItem.id).toBe('test')
      expect(registryItem.type).toBe('pipe')
    })

    it('should implement PipeFunction interface', () => {
      class TestPipe extends BasePipeFunction {
        readonly id = 'test'

        async execute(input: any, args: any[]): Promise<any> {
          return input
        }
      }

      const pipe = new TestPipe()

      // Can be assigned to PipeFunction
      const pipeFunction: PipeFunction = pipe
      expect(pipeFunction.id).toBe('test')
      expect(typeof pipeFunction.execute).toBe('function')
    })
  })

  describe('R-PIPE-04: JSDoc with usage examples', () => {
    it('should work as documented in JSDoc example', async () => {
      // This test follows the JSDoc example from the PRD
      class FilterPipe extends BasePipeFunction {
        readonly id = 'filter'

        async execute(input: any[], args: any[]): Promise<any[]> {
          const propName = args[0] as string
          return input.filter((item) => item?.[propName])
        }
      }

      const filterPipe = new FilterPipe()
      const data = [
        { name: 'Emma', active: true },
        { name: 'Bob', active: false },
      ]

      const result = await filterPipe.execute(data, ['active'])

      expect(result).toEqual([{ name: 'Emma', active: true }])
    })
  })
})
