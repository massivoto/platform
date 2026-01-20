import { nowTs, toReadableDate } from '@massivoto/kit'
import lodashSet from 'lodash.set'
import { cloneExecutionContext } from '../../domain/execution-context.js'
import {
  InstructionNode,
  ProgramNode,
  StatementNode,
  BlockNode,
} from '../parser/ast.js'
import { CommandRegistry } from '../handlers/command-registry.js'
import { ExpressionEvaluator } from './evaluators.js'
import { ExecutionContext } from '../../domain/index.js'
import { write } from './scope-chain.js'

/**
 * Output target namespace and key parsed from output=... argument.
 */
export interface OutputTarget {
  namespace: 'data' | 'scope'
  key: string
}

/**
 * Parses an output target string to determine namespace and key.
 *
 * - `scope.user` -> { namespace: 'scope', key: 'user' }
 * - `scope.user.profile` -> { namespace: 'scope', key: 'user.profile' }
 * - `user` -> { namespace: 'data', key: 'user' }
 * - `data.user` -> { namespace: 'data', key: 'data.user' } (no special casing)
 *
 * @param output - The output target string from output=...
 * @returns Parsed namespace and key
 */
export function parseOutputTarget(output: string): OutputTarget {
  if (output.startsWith('scope.')) {
    return {
      namespace: 'scope',
      key: output.slice(6), // Remove 'scope.' prefix
    }
  }
  // Default to data namespace (no special casing for 'data.' prefix)
  return {
    namespace: 'data',
    key: output,
  }
}

export class Interpreter {
  constructor(
    private registry: CommandRegistry,
    private evaluator = new ExpressionEvaluator(),
  ) {}

  async execute(
    instruction: InstructionNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const start = nowTs()
    const { package: pkg, name } = instruction.action
    const id = `@${pkg}/${name}`
    const handler = this.registry.resolve(id)
    if (!handler) throw new Error(`Command not found: ${id}`)

    const args: Record<string, any> = {}
    for (const arg of instruction.args) {
      args[arg.name.value] = this.evaluator.evaluate(arg.value, context)
    }

    const result = await handler.run(args, context)

    const outcome: InstructionOutcome = {
      success: result.success,
    }

    const hasOutput = !!(instruction.output && result.success)
    const outputKey = instruction.output?.value

    if (hasOutput) {
      assertDefined(instruction.output)
      outcome.value = result.value
    }

    const end = nowTs()
    const returnedContext = cloneExecutionContext(context)

    // Write output to appropriate namespace
    if (outputKey && hasOutput) {
      const target = parseOutputTarget(outputKey)
      if (target.namespace === 'scope') {
        // Write to scope chain (current scope only)
        write(target.key, outcome.value, returnedContext.scopeChain)
      } else {
        // Write to data namespace using lodash set for nested paths
        lodashSet(returnedContext.data, target.key, outcome.value)
      }
    }

    // Add cost from handler to context
    returnedContext.cost.current += result.cost

    // Log complete InstructionLog with cost, output, and value
    returnedContext.meta.history.push({
      command: id,
      success: outcome.success,
      start: toReadableDate(start),
      end: toReadableDate(end),
      duration: end - start,
      messages: result.messages || [],
      fatalError: result.fatalError,
      cost: result.cost,
      output: outputKey,
      value: hasOutput ? outcome.value : undefined,
    })

    return returnedContext
  }

  /**
   * Execute a full program (sequence of statements).
   * Handles InstructionNode and BlockNode.
   */
  async executeProgram(
    program: ProgramNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    let currentContext = context

    for (const statement of program.body) {
      currentContext = await this.executeStatement(statement, currentContext)
    }

    return currentContext
  }

  /**
   * Execute a single statement (instruction or block).
   */
  private async executeStatement(
    statement: StatementNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    if (statement.type === 'instruction') {
      return this.execute(statement, context)
    }

    if (statement.type === 'block') {
      return this.executeBlock(statement, context)
    }

    // For other statement types (like TemplateNode), pass through for now
    return context
  }

  /**
   * Execute a block by executing all statements in its body.
   * Conditional blocks are evaluated before execution.
   */
  private async executeBlock(
    block: BlockNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    // Check condition if present
    if (block.condition) {
      const conditionValue = this.evaluator.evaluate(block.condition, context)
      if (!conditionValue) {
        // Condition is falsy, skip block
        return context
      }
    }

    // Execute all statements in the block body
    let currentContext = context
    for (const statement of block.body) {
      currentContext = await this.executeStatement(statement, currentContext)
    }

    return currentContext
  }
}

export interface InstructionOutcome {
  success: boolean
  value?: any
  error?: string
}

export function assertDefined<T>(
  value: T,
): asserts value is Exclude<T, undefined> {
  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }
}
