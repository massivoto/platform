// Expression Evaluator
import {
  ExpressionNode,
  MemberExpressionNode,
  UnaryExpressionNode,
  BinaryExpressionNode,
  LogicalExpressionNode,
  ArrayLiteralNode,
  IdentifierNode,
} from '../parser/ast.js'
import { ExecutionContext } from '../../domain/execution-context.js'
import { lookup } from './scope-chain.js'

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
        return this.resolveIdentifier(expr, context)

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
   * Resolves an identifier using scope-first resolution.
   * Walks scope chain first, then falls back to context.data.
   *
   * Resolution rule: scope wins on collision with data.
   */
  private resolveIdentifier(
    expr: IdentifierNode,
    context: ExecutionContext,
  ): any {
    const name = expr.value

    // Check scope chain first (walks from current to root)
    const scopeValue = lookup(name, context.scopeChain)
    if (scopeValue !== undefined) {
      return scopeValue
    }

    // Fall back to data namespace
    return context.data[name]
  }

  /**
   * Evaluates member access expressions like user.name or user.profile.settings.theme.
   * Returns undefined for missing properties (lenient behavior per PRD).
   *
   * Special handling for 'scope' namespace:
   * - scope.x resolves via scope chain only (not data)
   *
   * All other roots use standard resolution (scope chain first, then data).
   */
  private evaluateMember(
    expr: MemberExpressionNode,
    context: ExecutionContext,
  ): any {
    // Check for special 'scope' namespace prefix
    if (
      expr.object.type === 'identifier' &&
      expr.object.value === 'scope' &&
      expr.path.length > 0
    ) {
      // scope.x.y.z - first path element is the scope variable name
      const [scopeVarName, ...restPath] = expr.path
      let current = lookup(scopeVarName, context.scopeChain)

      // Walk remaining path
      for (const prop of restPath) {
        if (current === null || current === undefined) {
          return undefined
        }
        current = current[prop]
      }

      return current
    }

    // Standard resolution: evaluate object (uses scope-first for identifiers)
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
