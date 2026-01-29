/**
 * Evaluator Interface
 *
 * R-SEP-02: Defines the contract for expression evaluation.
 * The runtime package provides this interface; implementations
 * live in @massivoto/interpreter (BSL 1.1 licensed).
 *
 * @example
 * ```typescript
 * import { Evaluator, ExecutionContext } from '@massivoto/runtime'
 * import { ExpressionEvaluator } from '@massivoto/interpreter'
 *
 * const evaluator: Evaluator = new ExpressionEvaluator(pipeRegistry)
 * const value = await evaluator.evaluate(expr, context)
 * ```
 */
import type { ExpressionNode } from '../interpreter/parser/ast.js'
import type { ExecutionContext } from '@massivoto/kit'

/**
 * Evaluator interface for expression evaluation.
 *
 * Implementations must provide:
 * - evaluate(): Evaluate any expression node to a value
 *
 * Supported expression types:
 * - Literals: string, number, boolean, null, array
 * - Identifiers: user, count
 * - Member access: user.profile.name
 * - Unary: !flag, -count, +value
 * - Binary: a + b, x == y, count > 0
 * - Logical: a && b, x || y
 * - Pipes: {data|filter:key|map:fn}
 *
 * Variable resolution follows scope-first order:
 * 1. Walk scopeChain from current to root
 * 2. If not found, check context.data
 * 3. Return undefined if not found anywhere
 */
export interface Evaluator {
  /**
   * Evaluate an expression node and return the resolved value.
   *
   * @param expr - The expression AST node to evaluate
   * @param context - Current execution context for variable resolution
   * @returns Promise resolving to the evaluated value
   * @throws EvaluationError if expression cannot be evaluated
   */
  evaluate(expr: ExpressionNode, context: ExecutionContext): Promise<unknown>
}
