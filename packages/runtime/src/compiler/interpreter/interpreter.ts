import { nowTs, toReadableDate } from '@massivoto/kit'
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

    if (outputKey) {
      returnedContext.data[outputKey] = outcome.value
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
