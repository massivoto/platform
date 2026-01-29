import { describe, it, expect } from 'vitest'
import { runProgram } from '../program-runner.js'
import { createEmptyExecutionContext } from '@massivoto/kit'
import {
  CommandHandler,
  CommandRegistry,
} from '../handlers/command-registry.js'
import { Interpreter } from '../interpreter.js'
import { buildProgramParser } from '../parser/program-parser.js'

describe('ForEach Execution', () => {
  describe('R-FE-101 & R-FE-102: executeForEach implementation', () => {
    it('AC-FE-11: iterates over array and executes block for each element', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.users = [{ name: 'Emma' }, { name: 'Carlos' }]

      const source = `@block/begin forEach=users -> user
@utils/log message=user.name
@block/end`

      const result = await runProgram(source, context)

      // Check that both names were logged
      const logs = result.batches[0].actions
        .filter((h) => h.command === '@utils/log')
        .map((h) => h.messages)
        .flat()

      // LogHandler prefixes messages with "Logged: "
      expect(logs.some((l) => l.includes('Emma'))).toBe(true)
      expect(logs.some((l) => l.includes('Carlos'))).toBe(true)
    })

    it('iterates in order', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['first', 'second', 'third']

      const logged: string[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          logged.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=item
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(logged).toEqual(['first', 'second', 'third'])
    })
  })

  describe('R-FE-103: Empty collection handling', () => {
    it('AC-FE-12: empty collection executes 0 times', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = []

      const source = `@block/begin forEach=items -> item
@utils/log message=item
@block/end`

      const result = await runProgram(source, context)

      // No log instructions should have been executed
      const logs = result.batches[0].actions.filter(
        (h) => h.command === '@utils/log',
      )
      expect(logs).toHaveLength(0)
    })
  })

  describe('R-FE-104: Nested forEach with scope chain', () => {
    it('AC-FE-14: nested forEach can access outer iterator', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.users = [
        { name: 'Emma', tweets: [{ text: 'Hello' }] },
        { name: 'Carlos', tweets: [{ text: 'World' }] },
      ]

      const logged: string[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          logged.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=users -> user
@block/begin forEach=user.tweets -> tweet
@utils/log message={user.name + ": " + tweet.text}
@block/end
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(logged).toContain('Emma: Hello')
      expect(logged).toContain('Carlos: World')
    })

    it('inner _index shadows outer _index', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.outer = ['a', 'b']
      context.data.inner = ['x', 'y', 'z']

      const innerIndices: number[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          if (typeof args.message === 'number') {
            innerIndices.push(args.message)
          }
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=outer -> o
@block/begin forEach=inner -> i
@utils/log message=_index
@block/end
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      // Inner loop runs 3 times for each outer iteration (2 times)
      // So we should see indices 0,1,2 twice
      expect(innerIndices).toEqual([0, 1, 2, 0, 1, 2])
    })
  })

  describe('R-FE-105: Data changes persist after loop', () => {
    it('AC-FE-15: output to data persists after forEach', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = [1, 2, 3]
      context.data.sum = 0

      const source = `@block/begin forEach=items -> item
@utils/set input={sum + item} output=sum
@block/end`

      const result = await runProgram(source, context)

      // Sum should be 1+2+3 = 6
      expect(result.data.sum).toBe(6)
    })

    it('last iteration value is retained in data', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['first', 'second', 'last']

      const source = `@block/begin forEach=items -> item
@utils/set input=item output=lastItem
@block/end`

      const result = await runProgram(source, context)

      expect(result.data.lastItem).toBe('last')
    })
  })

  describe('R-FE-106: System variables scope', () => {
    it('AC-FE-16: iterator and _index not accessible after loop', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b']

      const source = `@block/begin forEach=items -> item
@utils/set input=item output=inside
@block/end
@utils/set input=item output=outside`

      // item should be undefined outside the loop
      const result = await runProgram(source, context)

      expect(result.data.inside).toBe('b') // Last iteration value
      expect(result.data.outside).toBeUndefined() // item not accessible
    })
  })

  describe('System Variables (AC-FE-05 to AC-FE-10)', () => {
    it('AC-FE-05: _index provides 0-based indices', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c']

      const indices: number[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          indices.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=_index
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(indices).toEqual([0, 1, 2])
    })

    it('AC-FE-06: _count provides 1-based count', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c']

      const counts: number[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          counts.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=_count
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(counts).toEqual([1, 2, 3])
    })

    it('AC-FE-07: _length is constant throughout loop', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c']

      const lengths: number[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          lengths.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=_length
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(lengths).toEqual([3, 3, 3])
    })

    it('AC-FE-08: _first is true only on first iteration', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c']

      const firsts: boolean[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          firsts.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=_first
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(firsts).toEqual([true, false, false])
    })

    it('AC-FE-09: _last is true only on last iteration', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c']

      const lasts: boolean[] = []
      const logHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          lasts.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@utils/log', logHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@utils/log message=_last
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      expect(lasts).toEqual([false, false, true])
    })

    it('AC-FE-10: _odd and _even alternate correctly', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.items = ['a', 'b', 'c', 'd']

      const oddValues: boolean[] = []
      const evenValues: boolean[] = []

      const logOddHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          oddValues.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const logEvenHandler: CommandHandler<void> = {
        run: async (args: Record<string, any>) => {
          evenValues.push(args.message)
          return { success: true, cost: 0, messages: [] }
        },
      }

      const registry = new CommandRegistry()
      registry.register('@log/odd', logOddHandler)
      registry.register('@log/even', logEvenHandler)

      const parser = buildProgramParser()
      const program = parser.val(`@block/begin forEach=items -> item
@log/odd message=_odd
@log/even message=_even
@block/end`)

      const interpreter = new Interpreter(registry)
      await interpreter.executeProgram(program, context)

      // Index 0: odd=true (1st), even=false
      // Index 1: odd=false, even=true (2nd)
      // Index 2: odd=true (3rd), even=false
      // Index 3: odd=false, even=true (4th)
      expect(oddValues).toEqual([true, false, true, false])
      expect(evenValues).toEqual([false, true, false, true])
    })
  })

  describe('Error handling', () => {
    it('AC-FE-13: throws error for non-array iterable', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.notAnArray = 'string value'

      const source = `@block/begin forEach=notAnArray -> item
@utils/log message=item
@block/end`

      await expect(runProgram(source, context)).rejects.toThrow(
        /Cannot iterate over string/,
      )
    })

    it('throws error for null iterable', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.nullValue = null as any

      const source = `@block/begin forEach=nullValue -> item
@utils/log message=item
@block/end`

      await expect(runProgram(source, context)).rejects.toThrow(
        /Cannot iterate over/,
      )
    })

    it('throws error for number iterable', async () => {
      const context = createEmptyExecutionContext('test')
      context.data.num = 42

      const source = `@block/begin forEach=num -> item
@utils/log message=item
@block/end`

      await expect(runProgram(source, context)).rejects.toThrow(
        /Cannot iterate over number/,
      )
    })
  })
})
