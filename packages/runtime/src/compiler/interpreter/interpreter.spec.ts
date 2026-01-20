import { describe, it, expect, beforeEach } from 'vitest'
import { Stream } from '@masala/parser'
import { Interpreter } from './interpreter.js'
import { CommandRegistry } from '../handlers/command-registry.js'
import { CommandHandler } from '../handlers/command-registry.js'
import { ActionResult } from '../handlers/action-result.js'
import {
  ExecutionContext,
  createEmptyExecutionContext,
} from '../../domain/execution-context.js'
import { buildInstructionParser } from '../parser/instruction-parser.js'
import { buildProgramParser } from '../parser/program-parser.js'
import { InstructionNode, ProgramNode } from '../parser/ast.js'

/**
 * Test file: interpreter.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for:
 * - Cost Tracking (R-COST-01 to R-COST-04)
 * - Interpreter Enhancements (R-INT-01 to R-INT-03)
 * - Acceptance Criteria (AC-LOG-01 to AC-LOG-09)
 */

/**
 * Mock handler that returns a specific cost
 */
class MockCostHandler implements CommandHandler<string> {
  constructor(private cost: number) {}

  async run(): Promise<ActionResult<string>> {
    return {
      success: true,
      value: 'mock-result',
      messages: ['Mock executed'],
      cost: this.cost,
    }
  }
}

/**
 * Mock handler that fails
 */
class MockFailHandler implements CommandHandler<void> {
  async run(): Promise<ActionResult<void>> {
    return {
      success: false,
      fatalError: 'Mock failure',
      messages: ['Something went wrong'],
      cost: 0,
    }
  }
}

/**
 * Updated LogHandler for tests (implements full interface)
 */
class TestLogHandler implements CommandHandler<void> {
  readonly id = '@utils/log'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(args: Record<string, any>): Promise<ActionResult<void>> {
    const message = args.message as string
    if (!message) {
      return {
        success: false,
        fatalError: 'Message is required',
        messages: ['Missing required argument: message'],
        cost: 0,
      }
    }
    return {
      success: true,
      messages: [`Logged: ${message}`],
      cost: 0,
    }
  }
}

/**
 * Updated SetHandler for tests (implements full interface)
 */
class TestSetHandler implements CommandHandler<any> {
  readonly id = '@utils/set'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(args: Record<string, any>): Promise<ActionResult<any>> {
    const input = args.input
    if (input === undefined) {
      return {
        success: false,
        fatalError: 'Input is required',
        messages: ['Missing required argument: input'],
        cost: 0,
      }
    }
    return {
      success: true,
      value: input,
      messages: [`Set successfully`],
      cost: 0,
    }
  }
}

describe('Cost Tracking', () => {
  let registry: CommandRegistry
  let interpreter: Interpreter
  let context: ExecutionContext
  const instructionParser = buildInstructionParser()

  beforeEach(() => {
    registry = new CommandRegistry()
    registry.register('@utils/log', new TestLogHandler())
    registry.register('@utils/set', new TestSetHandler())
    interpreter = new Interpreter(registry)
    context = createEmptyExecutionContext('emma-123')
  })

  describe('R-COST-01: ActionResult has cost field', () => {
    it('should receive cost from handler result', async () => {
      registry.register('@mock/paid', new MockCostHandler(100))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].cost).toBe(100)
    })
  })

  describe('R-COST-03: Interpreter adds cost to context.cost.current', () => {
    it('should accumulate cost from single instruction', async () => {
      registry.register('@mock/paid', new MockCostHandler(50))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.cost.current).toBe(50)
    })

    it('should accumulate cost from multiple instructions', async () => {
      registry.register('@mock/paid', new MockCostHandler(25))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      // Execute first instruction
      let currentContext = await interpreter.execute(ast, context)
      expect(currentContext.cost.current).toBe(25)

      // Execute second instruction
      currentContext = await interpreter.execute(ast, currentContext)
      expect(currentContext.cost.current).toBe(50)

      // Execute third instruction
      currentContext = await interpreter.execute(ast, currentContext)
      expect(currentContext.cost.current).toBe(75)
    })
  })

  describe('R-COST-04: Interpreter stores cost in InstructionLog', () => {
    it('should store cost in history entry', async () => {
      registry.register('@mock/paid', new MockCostHandler(150))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].cost).toBe(150)
    })
  })
})

describe('Interpreter Enhancements', () => {
  let registry: CommandRegistry
  let interpreter: Interpreter
  let context: ExecutionContext
  const instructionParser = buildInstructionParser()
  const programParser = buildProgramParser()

  beforeEach(() => {
    registry = new CommandRegistry()
    registry.register('@utils/log', new TestLogHandler())
    registry.register('@utils/set', new TestSetHandler())
    interpreter = new Interpreter(registry)
    context = createEmptyExecutionContext('carlos-456')
  })

  describe('R-INT-01: execute() logs complete InstructionLog with cost', () => {
    it('should log complete InstructionLog for @utils/log', async () => {
      const dsl = '@utils/log message="Hello Emma"'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)
      const log = newContext.meta.history[0]

      expect(log.command).toBe('@utils/log')
      expect(log.success).toBe(true)
      expect(log.cost).toBe(0)
      expect(log.start).toBeDefined()
      expect(log.end).toBeDefined()
      expect(log.duration).toBeGreaterThanOrEqual(0)
      expect(log.messages).toContain('Logged: Hello Emma')
    })

    it('should log output and value for @utils/set', async () => {
      const dsl = '@utils/set input="Emma" output=user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)
      const log = newContext.meta.history[0]

      expect(log.command).toBe('@utils/set')
      expect(log.success).toBe(true)
      expect(log.cost).toBe(0)
      expect(log.output).toBe('user')
      expect(log.value).toBe('Emma')
    })
  })

  describe('R-INT-02: executeProgram() executes all statements', () => {
    it('should execute program with 3 instructions', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@utils/log message="Done"
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.meta.history).toHaveLength(3)
      expect(newContext.data.user).toBe('Emma')
      expect(newContext.data.followers).toBe(1500)
    })

    it('should accumulate cost across program execution', async () => {
      registry.register('@mock/paid', new MockCostHandler(10))

      const source = `
@mock/paid
@mock/paid
@mock/paid
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.cost.current).toBe(30)
      expect(newContext.meta.history).toHaveLength(3)
    })
  })

  describe('R-INT-03: executeProgram() handles BlockNode', () => {
    it('should execute instructions inside a block', async () => {
      const source = `
@utils/set input="Carlos" output=author
@block/begin name="Tweet Setup"
@utils/set input="Hello world!" output=content
@utils/set input=42 output=likes
@block/end
@utils/log message="Block complete"
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.data.author).toBe('Carlos')
      expect(newContext.data.content).toBe('Hello world!')
      expect(newContext.data.likes).toBe(42)
      // 1 before block + 2 inside block + 1 after block = 4 instructions
      expect(newContext.meta.history).toHaveLength(4)
    })

    it('should handle nested blocks', async () => {
      const source = `
@block/begin name="Outer"
@utils/set input="Emma" output=user
@block/begin name="Inner"
@utils/set input=100 output=count
@block/end
@block/end
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.data.user).toBe('Emma')
      expect(newContext.data.count).toBe(100)
      expect(newContext.meta.history).toHaveLength(2)
    })
  })
})

describe('Acceptance Criteria', () => {
  let registry: CommandRegistry
  let interpreter: Interpreter
  let context: ExecutionContext
  const instructionParser = buildInstructionParser()
  const programParser = buildProgramParser()

  beforeEach(() => {
    registry = new CommandRegistry()
    registry.register('@utils/log', new TestLogHandler())
    registry.register('@utils/set', new TestSetHandler())
    interpreter = new Interpreter(registry)
    context = createEmptyExecutionContext('emma-123')
  })

  describe('AC-LOG-01: @utils/log execution', () => {
    it('should log command and success', async () => {
      const dsl = '@utils/log message="Hello Emma"'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].command).toBe('@utils/log')
      expect(newContext.meta.history[0].success).toBe(true)
    })
  })

  describe('AC-LOG-02: @utils/set with output', () => {
    it('should store value and log output variable name', async () => {
      const dsl = '@utils/set input="Emma" output=user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.data.user).toBe('Emma')
      expect(newContext.meta.history[0].output).toBe('user')
    })
  })

  describe('AC-LOG-03: @utils/set logs value', () => {
    it('should log the stored value for debugging', async () => {
      const dsl = '@utils/set input=42 output=count'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].value).toBe(42)
    })
  })

  describe('AC-LOG-04: @utils/log cost is 0', () => {
    it('should have cost 0 for free command', async () => {
      const dsl = '@utils/log message="Free message"'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].cost).toBe(0)
    })
  })

  describe('AC-LOG-05: cumulative cost tracking', () => {
    it('should sum individual costs in context.cost.current', async () => {
      registry.register('@mock/cheap', new MockCostHandler(10))
      registry.register('@mock/medium', new MockCostHandler(50))
      registry.register('@mock/expensive', new MockCostHandler(100))

      const source = `
@mock/cheap
@mock/medium
@mock/expensive
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.cost.current).toBe(160) // 10 + 50 + 100
    })
  })

  describe('AC-LOG-06: program execution logs all instructions', () => {
    it('should have history.length equal to instruction count', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input="Carlos" output=friend
@utils/log message="Setup complete"
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      expect(newContext.meta.history).toHaveLength(3)
    })
  })

  describe('AC-LOG-07: variable resolution in log message', () => {
    it('should resolve variable in @utils/log message', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/log message={user}
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const newContext = await interpreter.executeProgram(program, context)

      // The log should have resolved 'user' to 'Emma'
      expect(newContext.meta.history[1].messages).toContain('Logged: Emma')
    })
  })

  describe('AC-LOG-08: unknown command error', () => {
    it('should throw error with command ID', async () => {
      const dsl = '@unknown/cmd'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      await expect(interpreter.execute(ast, context)).rejects.toThrow(
        'Command not found: @unknown/cmd',
      )
    })
  })

  describe('AC-LOG-09: missing required argument', () => {
    it('should fail with error in history when message missing', async () => {
      const dsl = '@utils/log'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const newContext = await interpreter.execute(ast, context)

      expect(newContext.meta.history[0].success).toBe(false)
      expect(newContext.meta.history[0].fatalError).toBe('Message is required')
    })
  })
})
