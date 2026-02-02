/**
 * Local Runner - Factory for creating runners with dependency injection.
 *
 * R-SEP-21: createRunner(interpreter: Interpreter): Runner
 *
 * The runner accepts an Interpreter implementation at runtime,
 * enabling the BSL-licensed CoreInterpreter to be injected
 * without the runtime package depending on it directly.
 *
 * @example
 * ```typescript
 * import { createRunner, ExecutionContext, ProgramResult } from '@massivoto/runtime'
 * import { CoreInterpreter, CoreCommandRegistry } from '@massivoto/interpreter'
 *
 * // Set up interpreter with registry
 * const registry = new CoreCommandRegistry()
 * const interpreter = new CoreInterpreter(registry)
 *
 * // Create runner with DI
 * const runner = createRunner(interpreter)
 *
 * // Execute programs
 * const result = await runner.runProgram(program, context)
 * ```
 *
 * @license Apache-2.0
 */
import { parseProgram, ProgramNode } from '@massivoto/interpreter'
import type { Interpreter } from '../interfaces/interpreter.js'
import type { ProgramResult } from '@massivoto/kit'
import { createEmptyExecutionContext, ExecutionContext } from '@massivoto/kit'

/**
 * Runner interface for program execution.
 *
 * The runner is the main entry point for executing OTO programs.
 * It accepts an Interpreter via dependency injection.
 */
export interface Runner {
  /**
   * Parse and execute source code with optional context.
   *
   * @param source - OTO source code
   * @param context - Optional partial context (merged with defaults)
   * @returns Promise resolving to ProgramResult
   */
  runSource(
    source: string,
    context?: Partial<ExecutionContext>,
  ): Promise<ProgramResult>
}

/**
 * Create a Runner with the provided Interpreter implementation.
 *
 * R-SEP-21: Factory function for dependency injection.
 *
 * @param interpreter - The Interpreter implementation to use
 * @returns A Runner instance
 *
 * @example
 * ```typescript
 * // In application code:
 * import { createRunner } from '@massivoto/runtime'
 * import { CoreInterpreter } from '@massivoto/interpreter'
 *
 * const runner = createRunner(new CoreInterpreter(registry, evaluator))
 * const result = await runner.runSource('@utils/set input="hello" output=greeting')
 * console.log(result.data.greeting) // 'hello'
 * ```
 */
export function createRunner(interpreter: Interpreter): Runner {
  return new LocalRunner(interpreter)
}

/**
 * Local Runner implementation using injected Interpreter.
 * @internal
 */
class LocalRunner implements Runner {
  constructor(private readonly interpreter: Interpreter) {}

  async runSource(
    source: string,
    partialContext?: Partial<ExecutionContext>,
  ): Promise<ProgramResult> {
    // Parse source to AST
    const program:ProgramNode = parseProgram(source)

    // Build full context from partial
    const context = partialContext
      ? {
          ...createEmptyExecutionContext(partialContext.user?.id || 'local'),
          ...partialContext,
          data: { ...partialContext.data },
          env: { ...partialContext.env },
        }
      : createEmptyExecutionContext('local')

    return this.interpreter.executeProgram(program, context)
  }
}
