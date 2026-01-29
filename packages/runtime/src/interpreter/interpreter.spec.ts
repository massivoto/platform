import { describe, it, expect, beforeEach } from 'vitest'
import { Stream } from '@masala/parser'
import { Interpreter, parseOutputTarget } from './interpreter.js'
import { CommandRegistry } from './handlers/command-registry.js'
import { CommandHandler } from './handlers/command-registry.js'
import { ActionResult } from './handlers/action-result.js'
import { ExecutionContext } from '@massivoto/kit'
import { buildInstructionParser } from './parser/instruction-parser.js'
import { buildProgramParser } from './parser/program-parser.js'
import { InstructionNode, ProgramNode } from './parser/ast.js'
import {
  createEmptyScopeChain,
  write,
  lookup,
} from './evaluator/scope-chain.js'
import { createEmptyExecutionContext } from './context/core-context'

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

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.cost).toBe(100)
    })
  })

  describe('R-COST-03: Interpreter returns cost in StatementResult', () => {
    it('should return cost from single instruction', async () => {
      registry.register('@mock/paid', new MockCostHandler(50))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.cost).toBe(50)
    })

    it('should return cost from each instruction execution', async () => {
      registry.register('@mock/paid', new MockCostHandler(25))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      // Execute first instruction - cost is returned in StatementResult
      let statementResult = await interpreter.execute(ast, context)
      expect(statementResult.cost).toBe(25)

      // Execute second instruction
      statementResult = await interpreter.execute(ast, statementResult.context)
      expect(statementResult.cost).toBe(25)

      // Execute third instruction
      statementResult = await interpreter.execute(ast, statementResult.context)
      expect(statementResult.cost).toBe(25)
    })
  })

  describe('R-COST-04: Interpreter stores cost in ActionLog', () => {
    it('should store cost in log entry', async () => {
      registry.register('@mock/paid', new MockCostHandler(150))

      const dsl = '@mock/paid'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.cost).toBe(150)
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

  describe('R-INT-01: execute() returns complete ActionLog with cost', () => {
    it('should return complete ActionLog for @utils/log', async () => {
      const dsl = '@utils/log message="Hello Emma"'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)
      const log = statementResult.log!

      expect(log.command).toBe('@utils/log')
      expect(log.success).toBe(true)
      expect(log.cost).toBe(0)
      expect(log.start).toBeDefined()
      expect(log.end).toBeDefined()
      expect(log.duration).toBeGreaterThanOrEqual(0)
      expect(log.messages).toContain('Logged: Hello Emma')
    })

    it('should return log with output and value for @utils/set', async () => {
      const dsl = '@utils/set input="Emma" output=user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)
      const log = statementResult.log!

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
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.batches[0].actions).toHaveLength(3)
      expect(programResult.data.user).toBe('Emma')
      expect(programResult.data.followers).toBe(1500)
    })

    it('should accumulate cost across program execution', async () => {
      registry.register('@mock/paid', new MockCostHandler(10))

      const source = `
@mock/paid
@mock/paid
@mock/paid
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.cost.current).toBe(30)
      expect(programResult.batches[0].actions).toHaveLength(3)
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
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.data.author).toBe('Carlos')
      expect(programResult.data.content).toBe('Hello world!')
      expect(programResult.data.likes).toBe(42)
      // 1 before block + 2 inside block + 1 after block = 4 instructions
      expect(programResult.batches[0].actions).toHaveLength(4)
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
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.data.user).toBe('Emma')
      expect(programResult.data.count).toBe(100)
      expect(programResult.batches[0].actions).toHaveLength(2)
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

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.command).toBe('@utils/log')
      expect(statementResult.log?.success).toBe(true)
    })
  })

  describe('AC-LOG-02: @utils/set with output', () => {
    it('should store value and log output variable name', async () => {
      const dsl = '@utils/set input="Emma" output=user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.context.data.user).toBe('Emma')
      expect(statementResult.log?.output).toBe('user')
    })
  })

  describe('AC-LOG-03: @utils/set logs value', () => {
    it('should log the stored value for debugging', async () => {
      const dsl = '@utils/set input=42 output=count'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.value).toBe(42)
    })
  })

  describe('AC-LOG-04: @utils/log cost is 0', () => {
    it('should have cost 0 for free command', async () => {
      const dsl = '@utils/log message="Free message"'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.cost).toBe(0)
    })
  })

  describe('AC-LOG-05: cumulative cost tracking', () => {
    it('should sum individual costs in result.cost.current', async () => {
      registry.register('@mock/cheap', new MockCostHandler(10))
      registry.register('@mock/medium', new MockCostHandler(50))
      registry.register('@mock/expensive', new MockCostHandler(100))

      const source = `
@mock/cheap
@mock/medium
@mock/expensive
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.cost.current).toBe(160) // 10 + 50 + 100
    })
  })

  describe('AC-LOG-06: program execution logs all actions', () => {
    it('should have actions.length equal to instruction count', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input="Carlos" output=friend
@utils/log message="Setup complete"
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.batches[0].actions).toHaveLength(3)
    })
  })

  describe('AC-LOG-07: variable resolution in log message', () => {
    it('should resolve variable in @utils/log message', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/log message={user}
      `.trim()

      const program = programParser.val(source) as ProgramNode
      const programResult = await interpreter.executeProgram(program, context)

      // The log should have resolved 'user' to 'Emma'
      expect(programResult.batches[0].actions[1].messages).toContain(
        'Logged: Emma',
      )
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
    it('should fail with error in log when message missing', async () => {
      const dsl = '@utils/log'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.success).toBe(false)
      expect(statementResult.log?.fatalError).toBe('Message is required')
    })
  })
})

// ============================================================================
// OUTPUT TARGETING (R-SCOPE-41 to R-SCOPE-44)
// ============================================================================

describe('Output Targeting', () => {
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

  describe('R-SCOPE-41: output=user writes to context.data.user', () => {
    // AC-SCOPE-05: Given instruction @api/call output=user,
    // when executed with result { name: "Emma" },
    // then context.data.user equals { name: "Emma" }
    it('should write to context.data when output has no scope prefix', async () => {
      const dsl = '@utils/set input="Emma" output=user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.context.data.user).toBe('Emma')
      // Verify it's NOT in scope
      expect(lookup('user', statementResult.context.scopeChain)).toBeUndefined()
    })

    it('should write object to context.data', async () => {
      // Using set handler to simulate an API that returns an object
      const source = `@utils/set input="Emma" output=userName`

      const program = programParser.val(source) as ProgramNode
      const programResult = await interpreter.executeProgram(program, context)

      expect(programResult.data.userName).toBe('Emma')
    })
  })

  describe('R-SCOPE-42: output=scope.user writes to context.scopeChain.current.user', () => {
    // AC-SCOPE-06: Given instruction @api/call output=scope.user,
    // when executed with result { name: "Carlos" },
    // then context.scope.user equals { name: "Carlos" }
    it('should write to scope chain when output has scope. prefix', async () => {
      const dsl = '@utils/set input="Carlos" output=scope.user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      // Should be in scope chain
      expect(lookup('user', statementResult.context.scopeChain)).toBe('Carlos')
      // Should NOT be in data
      expect(statementResult.context.data.user).toBeUndefined()
    })

    it('should write to current scope only', async () => {
      // Setup: create a child scope
      const parent = createEmptyScopeChain()
      write('existingVar', 'parent-value', parent)

      const child = { current: {}, parent }
      context.scopeChain = child

      const dsl = '@utils/set input="child-value" output=scope.newVar'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      // Should be in current scope
      expect(statementResult.context.scopeChain.current.newVar).toBe(
        'child-value',
      )
      // Parent should be unchanged
      expect(
        statementResult.context.scopeChain.parent?.current.newVar,
      ).toBeUndefined()
    })
  })

  describe('R-SCOPE-43: output=data.user writes to context.data.data.user', () => {
    // AC-SCOPE-07: Given instruction @api/call output=data.user,
    // when executed, then context.data.data.user is set (no special casing)
    it('should write to context.data.data.user with no special handling', async () => {
      const dsl = '@utils/set input="Emma" output=data.user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      // data.user is a nested path: context.data['data']['user']
      expect(statementResult.context.data.data).toEqual({ user: 'Emma' })
    })
  })

  describe('R-SCOPE-44: parseOutputTarget detects scope. prefix', () => {
    it('should parse output=user as data namespace', () => {
      const target = parseOutputTarget('user')

      expect(target.namespace).toBe('data')
      expect(target.key).toBe('user')
    })

    it('should parse output=scope.user as scope namespace', () => {
      const target = parseOutputTarget('scope.user')

      expect(target.namespace).toBe('scope')
      expect(target.key).toBe('user')
    })

    it('should parse output=data.user as data namespace with data.user key', () => {
      const target = parseOutputTarget('data.user')

      expect(target.namespace).toBe('data')
      expect(target.key).toBe('data.user')
    })

    it('should handle nested paths', () => {
      const target = parseOutputTarget('scope.user.profile')

      expect(target.namespace).toBe('scope')
      expect(target.key).toBe('user.profile')
    })

    it('should handle simple names', () => {
      const target = parseOutputTarget('followers')

      expect(target.namespace).toBe('data')
      expect(target.key).toBe('followers')
    })
  })
})

describe('Output Targeting Integration', () => {
  describe('action logging with scope output', () => {
    let registry: CommandRegistry
    let interpreter: Interpreter
    let context: ExecutionContext
    const instructionParser = buildInstructionParser()

    beforeEach(() => {
      registry = new CommandRegistry()
      registry.register('@utils/set', new TestSetHandler())
      interpreter = new Interpreter(registry)
      context = createEmptyExecutionContext('emma-123')
    })

    it('should log output target including scope prefix', async () => {
      const dsl = '@utils/set input="Carlos" output=scope.user'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.output).toBe('scope.user')
      expect(statementResult.log?.value).toBe('Carlos')
    })

    it('should log output target for data writes', async () => {
      const dsl = '@utils/set input=1500 output=followers'
      const result = instructionParser.parse(Stream.ofChars(dsl))
      const ast = result.value as InstructionNode

      const statementResult = await interpreter.execute(ast, context)

      expect(statementResult.log?.output).toBe('followers')
      expect(statementResult.log?.value).toBe(1500)
    })
  })
})
