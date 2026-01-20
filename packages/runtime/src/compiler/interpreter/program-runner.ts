import {
  ExecutionContext,
  createEmptyExecutionContext,
} from '../../domain/execution-context.js'
import { buildProgramParser } from '../parser/program-parser.js'
import { CommandRegistry } from '../handlers/command-registry.js'
import { LogHandler } from '../core-handlers/utils/log.handler.js'
import { SetHandler } from '../core-handlers/utils/set.handler.js'
import { Interpreter } from './interpreter.js'

/**
 * Error thrown when program parsing or execution fails.
 * Designed to be LLM-readable with clear context.
 */
export class ProgramRunError extends Error {
  constructor(
    message: string,
    public readonly source: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'ProgramRunError'
  }
}

/**
 * Create a fresh command registry with standard handlers.
 * This avoids the singleton issue from registerStandardCommandHandlers.
 */
function createStandardRegistry(): CommandRegistry {
  const registry = new CommandRegistry()
  registry.register('@utils/log', new LogHandler())
  registry.register('@utils/set', new SetHandler())
  return registry
}

/**
 * Parse and execute a DSL program.
 *
 * @param source - The DSL source code to execute
 * @param context - Optional execution context (created if not provided)
 * @param registry - Optional command registry (uses standard handlers if not provided)
 * @returns The final ExecutionContext with complete history
 * @throws ProgramRunError on parse errors
 * @throws Error on execution errors (e.g., unknown command)
 *
 * @example
 * ```typescript
 * const source = `
 * @utils/set input="Emma" output=user
 * @utils/set input=1500 output=followers
 * @utils/log message={user}
 * `
 *
 * const result = await runProgram(source)
 * console.log(result.data.user) // "Emma"
 * console.log(result.data.followers) // 1500
 * console.log(result.meta.history.length) // 3
 * ```
 */
export async function runProgram(
  source: string,
  context?: ExecutionContext,
  registry?: CommandRegistry,
): Promise<ExecutionContext> {
  const parser = buildProgramParser()

  // Parse the source
  const parseResult = parser.parse(source)

  if (!parseResult.isAccepted()) {
    const errorMessage = parseResult.error?.message || 'Unknown parse error'
    throw new ProgramRunError(
      `Parse error: ${errorMessage}`,
      source,
      parseResult.error,
    )
  }

  const program = parseResult.value!

  // Use provided context or create empty one
  const executionContext = context || createEmptyExecutionContext('anonymous')

  // Use provided registry or create fresh one with standard handlers
  const commandRegistry = registry || createStandardRegistry()

  // Create interpreter and execute
  const interpreter = new Interpreter(commandRegistry)

  return interpreter.executeProgram(program, executionContext)
}
