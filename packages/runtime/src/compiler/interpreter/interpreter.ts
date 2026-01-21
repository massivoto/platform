import { nowTs, toReadableDate } from '@massivoto/kit'
import lodashSet from 'lodash.set'
import { cloneExecutionContext } from '../../domain/execution-context.js'
import {
  InstructionNode,
  ProgramNode,
  StatementNode,
  BlockNode,
  ForEachArgNode,
} from '../parser/ast.js'
import { CommandRegistry } from '../handlers/command-registry.js'
import { ExpressionEvaluator } from './evaluators.js'
import { ExecutionContext } from '../../domain/index.js'
import { write, pushScope, popScope } from './scope-chain.js'

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
   * Handles both conditional blocks (if=) and iteration blocks (forEach=).
   */
  private async executeBlock(
    block: BlockNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    // Check for forEach - takes precedence over condition (mutually exclusive)
    if (block.forEach) {
      return this.executeForEach(block, block.forEach, context)
    }

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

  /**
   * Execute a forEach block by iterating over the collection.
   *
   * System variables injected into each iteration's scope:
   * - _index: 0-based index
   * - _count: 1-based count (== _index + 1)
   * - _length: total number of items
   * - _first: true if first iteration
   * - _last: true if last iteration
   * - _odd: true if 1-based count is odd (1st, 3rd, 5th...)
   * - _even: true if 1-based count is even (2nd, 4th, 6th...)
   *
   * The iterator variable (e.g., "user" in "users -> user") is also injected.
   */
  private async executeForEach(
    block: BlockNode,
    forEach: ForEachArgNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    // Evaluate the iterable expression
    const iterable = this.evaluator.evaluate(forEach.iterable, context)

    // Validate that the iterable is actually an array
    if (!Array.isArray(iterable)) {
      const type = iterable === null ? 'null' : typeof iterable
      throw new Error(
        `Cannot iterate over ${type}. forEach requires an array.`,
      )
    }

    // R-FE-103: Empty collection should execute 0 times
    if (iterable.length === 0) {
      return context
    }

    const iteratorName = forEach.iterator.value
    const length = iterable.length
    let currentContext = context

    for (let index = 0; index < length; index++) {
      const item = iterable[index]

      // Create a new scope for this iteration
      currentContext = cloneExecutionContext(currentContext)
      currentContext.scopeChain = pushScope(currentContext.scopeChain)

      // Inject system variables
      write('_index', index, currentContext.scopeChain)
      write('_count', index + 1, currentContext.scopeChain)
      write('_length', length, currentContext.scopeChain)
      write('_first', index === 0, currentContext.scopeChain)
      write('_last', index === length - 1, currentContext.scopeChain)
      write('_odd', (index + 1) % 2 === 1, currentContext.scopeChain)
      write('_even', (index + 1) % 2 === 0, currentContext.scopeChain)

      // Inject the iterator variable
      write(iteratorName, item, currentContext.scopeChain)

      // Execute all statements in the block body
      for (const statement of block.body) {
        currentContext = await this.executeStatement(statement, currentContext)
      }

      // Pop the scope to discard iteration-specific variables
      // But preserve changes to data namespace
      currentContext.scopeChain = popScope(currentContext.scopeChain)
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
