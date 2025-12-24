import { nowTs, toReadableDate } from '@massivoto/kit'
import { cloneExecutionContext } from '../../domain/execution-context.js'
import { InstructionNode } from '../parser/ast.js'
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
    const { package: pkg, name } = instruction.command
    const id = `@${pkg}/${name}`
    const handler = this.registry.resolve(id)
    if (!handler) throw new Error(`Command not found: ${id}`)

    const args: Record<string, any> = {}
    for (const arg of instruction.args) {
      args[arg.name.value] = this.evaluator.evaluate(arg.value, context)
    }

    const result = await handler.run(args, context)

    const succeed = result.success
    /*const hasSomeErrors = result.errors && result.errors.length
    const hasMessages = !!result.message

    const failed = !succeed*/

    const outcome: InstructionOutcome = {
      success: result.success,
    }

    const hasOutput = !!(instruction.output && result.success)

    if (hasOutput) {
      assertDefined(instruction.output)
      outcome.value = result.value
    }
    const end = nowTs()
    const returnedContext = cloneExecutionContext(context)
    const dataKey = instruction.output?.value
    if (dataKey) {
      returnedContext.data[dataKey] = outcome.value
    }

    returnedContext.meta.history.push({
      command: id,
      success: outcome.success,
      start: toReadableDate(start),
      end: toReadableDate(end),
      duration: end - start,
      messages: result.messages || [],
      fatalError: result.fatalError,
    })
    return returnedContext
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
