import {
  ExecutionContext,
  createEmptyExecutionContext,
  ProgramResult,
} from '../domain/index.js'
import { buildProgramParser } from './parser/program-parser.js'
import { CommandRegistry } from './handlers/command-registry.js'
import { LogHandler } from './core-handlers/utils/log.handler.js'
import { SetHandler } from './core-handlers/utils/set.handler.js'
import { GotoHandler } from './core-handlers/flow/goto.handler.js'
import { ExitHandler } from './core-handlers/flow/exit.handler.js'
import { ReturnHandler } from './core-handlers/flow/return.handler.js'
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
 * Includes flow control handlers for @flow/goto, @flow/exit, @flow/return.
 */
function createStandardRegistry(): CommandRegistry {
  const registry = new CommandRegistry()
  registry.register('@utils/log', new LogHandler())
  registry.register('@utils/set', new SetHandler())
  // Flow control handlers (R-GOTO-41, R-GOTO-44, R-GOTO-47)
  registry.register('@flow/goto', new GotoHandler())
  registry.register('@flow/exit', new ExitHandler())
  registry.register('@flow/return', new ReturnHandler())
  return registry
}

/**
 * Parse and execute a DSL program.
 *
 * @param source - The DSL source code to execute
 * @param context - Optional execution context (created if not provided)
 * @param registry - Optional command registry (uses standard handlers if not provided)
 * @returns ProgramResult with context, exitCode, value, and exitedEarly flag
 * @throws ProgramRunError on parse errors
 * @throws Error on execution errors (e.g., unknown command)
 *
 * Breaking change (R-GOTO-82): Returns ProgramResult instead of ExecutionContext.
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
 * console.log(result.context.data.user) // "Emma"
 * console.log(result.context.data.followers) // 1500
 * console.log(result.exitCode) // 0
 * ```
 */
export async function runProgram(
  source: string,
  context?: ExecutionContext,
  registry?: CommandRegistry,
): Promise<ProgramResult> {
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
