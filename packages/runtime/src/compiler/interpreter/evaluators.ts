// Expression Evaluator
import {
  ExpressionNode,
  MemberExpressionNode,
  UnaryExpressionNode,
  BinaryExpressionNode,
  LogicalExpressionNode,
  ArrayLiteralNode,
} from '../parser/ast.js'
import { ExecutionContext } from '../../domain/execution-context.js'

/**
 * Custom error class for evaluation failures.
 * Provides LLM-readable context about what went wrong.
 */
export class EvaluationError extends Error {
  readonly nodeType: string
  readonly expression: ExpressionNode

  constructor(message: string, nodeType: string, expression: ExpressionNode) {
    super(message)
    this.name = 'EvaluationError'
    this.nodeType = nodeType
    this.expression = expression
  }
}

export class ExpressionEvaluator {
  evaluate(expr: ExpressionNode, context: ExecutionContext): any {
    switch (expr.type) {
      case 'identifier':
        return context.data[expr.value]

      case 'literal-string':
      case 'literal-number':
      case 'literal-boolean':
        return expr.value

      case 'literal-null':
        return null

      case 'member':
        return this.evaluateMember(expr, context)

      case 'unary':
        return this.evaluateUnary(expr, context)

      case 'binary':
        return this.evaluateBinary(expr, context)

      case 'logical':
        return this.evaluateLogical(expr, context)

      case 'array-literal':
        return this.evaluateArrayLiteral(expr, context)

      case 'pipe-expression':
        throw new EvaluationError(
          'Pipe expressions not yet supported',
          'pipe-expression',
          expr,
        )

      default:
        throw new EvaluationError(
          `Unknown expression type: ${(expr as any).type}`,
          (expr as any).type,
          expr,
        )
    }
  }

  /**
   * Evaluates member access expressions like user.name or user.profile.settings.theme.
   * Returns undefined for missing properties (lenient behavior per PRD).
   */
  private evaluateMember(
    expr: MemberExpressionNode,
    context: ExecutionContext,
  ): any {
    // First evaluate the object part (usually an identifier)
    let current = this.evaluate(expr.object, context)

    // Walk the path, returning undefined if any step is missing
    for (const prop of expr.path) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[prop]
    }

    return current
  }

  /**
   * Evaluates unary expressions: !, -, +
   */
  private evaluateUnary(
    expr: UnaryExpressionNode,
    context: ExecutionContext,
  ): any {
    const arg = this.evaluate(expr.argument, context)

    switch (expr.operator) {
      case '!':
        return !arg
      case '-':
        return -arg
      case '+':
        return +arg
      default:
        throw new EvaluationError(
          `Unknown unary operator: ${(expr as any).operator}`,
          'unary',
          expr,
        )
    }
  }

  /**
   * Evaluates binary expressions: ==, !=, <, <=, >, >=, +, -, *, /, %
   * Uses strict equality (no type coercion for comparisons).
   */
  private evaluateBinary(
    expr: BinaryExpressionNode,
    context: ExecutionContext,
  ): any {
    const left = this.evaluate(expr.left, context)
    const right = this.evaluate(expr.right, context)

    switch (expr.operator) {
      // Comparison operators (strict equality)
      case '==':
        return left === right
      case '!=':
        return left !== right
      case '<':
        return left < right
      case '<=':
        return left <= right
      case '>':
        return left > right
      case '>=':
        return left >= right

      // Arithmetic operators
      case '+':
        return left + right
      case '-':
        return left - right
      case '*':
        return left * right
      case '/':
        return left / right // JS semantics: division by zero returns Infinity
      case '%':
        return left % right

      default:
        throw new EvaluationError(
          `Unknown binary operator: ${(expr as any).operator}`,
          'binary',
          expr,
        )
    }
  }

  /**
   * Evaluates logical expressions: &&, ||
   * Implements short-circuit evaluation per JS semantics.
   */
  private evaluateLogical(
    expr: LogicalExpressionNode,
    context: ExecutionContext,
  ): any {
    const left = this.evaluate(expr.left, context)

    switch (expr.operator) {
      case '&&':
        // Short-circuit: if left is falsy, return it; otherwise return right
        return left ? this.evaluate(expr.right, context) : left
      case '||':
        // Short-circuit: if left is truthy, return it; otherwise return right
        return left ? left : this.evaluate(expr.right, context)
      default:
        throw new EvaluationError(
          `Unknown logical operator: ${(expr as any).operator}`,
          'logical',
          expr,
        )
    }
  }

  /**
   * Evaluates array literal expressions: [1, 2, 3]
   * Recursively evaluates each element.
   */
  private evaluateArrayLiteral(
    expr: ArrayLiteralNode,
    context: ExecutionContext,
  ): any[] {
    return expr.elements.map((el) => this.evaluate(el, context))
  }
}
