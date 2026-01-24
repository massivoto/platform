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
import { PipeExpressionNode } from '../parser/args-details/pipe-parser/pipe-parser.js'
import { ExecutionContext } from '../../domain/execution-context.js'
import { lookup } from './scope-chain.js'
import { PipeRegistry } from '../pipe-registry/index.js'

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
  private readonly pipeRegistry?: PipeRegistry

  /**
   * Creates an ExpressionEvaluator.
   *
   * @param pipeRegistry - Optional PipeRegistry for evaluating pipe expressions.
   *                       If not provided, pipe expressions will throw an error.
   */
  constructor(pipeRegistry?: PipeRegistry) {
    this.pipeRegistry = pipeRegistry
  }

  /**
   * Evaluates an expression node and returns a Promise.
   * All evaluations are async to support store.x lookups which require async I/O.
   */
  async evaluate(
    expr: ExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
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
        return this.evaluatePipe(expr, context)

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
   * Special handling for namespaces:
   * - scope.x resolves via scope chain only (not data)
   * - store.x resolves via async StoreProvider.get() (not data)
   *
   * All other roots use standard resolution (scope chain first, then data).
   */
  private async evaluateMember(
    expr: MemberExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
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

    // Check for special 'store' namespace prefix
    if (
      expr.object.type === 'identifier' &&
      expr.object.value === 'store' &&
      expr.path.length > 0
    ) {
      // store.x.y.z - join path elements to form the store key
      const storePath = expr.path.join('.')

      // If no storeProvider is set, return undefined
      if (!context.storeProvider) {
        return undefined
      }

      // Use async StoreProvider.get() to fetch the value
      return context.storeProvider.get(storePath)
    }

    // Standard resolution: evaluate object (uses scope-first for identifiers)
    let current = await this.evaluate(expr.object, context)

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
  private async evaluateUnary(
    expr: UnaryExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
    const arg = await this.evaluate(expr.argument, context)

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
  private async evaluateBinary(
    expr: BinaryExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
    const left = await this.evaluate(expr.left, context)
    const right = await this.evaluate(expr.right, context)

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
  private async evaluateLogical(
    expr: LogicalExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
    const left = await this.evaluate(expr.left, context)

    switch (expr.operator) {
      case '&&':
        // Short-circuit: if left is falsy, return it; otherwise return right
        return left ? await this.evaluate(expr.right, context) : left
      case '||':
        // Short-circuit: if left is truthy, return it; otherwise return right
        return left ? left : await this.evaluate(expr.right, context)
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
  private async evaluateArrayLiteral(
    expr: ArrayLiteralNode,
    context: ExecutionContext,
  ): Promise<any[]> {
    const results = await Promise.all(
      expr.elements.map((el) => this.evaluate(el, context)),
    )
    return results
  }

  /**
   * Evaluates pipe expressions: {input | pipe1:arg1 | pipe2:arg2}
   *
   * Pipe expressions chain transformations left-to-right:
   * 1. Evaluate the input expression
   * 2. For each segment, evaluate arguments and apply the pipe
   * 3. Pass the result to the next pipe
   *
   * @throws EvaluationError if no PipeRegistry is configured
   * @throws EvaluationError if a pipe is not found in the registry
   */
  private async evaluatePipe(
    expr: PipeExpressionNode,
    context: ExecutionContext,
  ): Promise<any> {
    // Check if pipe registry is available
    if (!this.pipeRegistry) {
      throw new EvaluationError(
        'Pipe expressions require a PipeRegistry. Create evaluator with: new ExpressionEvaluator(pipeRegistry)',
        'pipe-expression',
        expr,
      )
    }

    // 1. Evaluate input expression
    let current = await this.evaluate(expr.input, context)

    // 2. Chain through each segment
    for (const segment of expr.segments) {
      // Evaluate all arguments
      const args = await Promise.all(
        segment.args.map((arg) => this.evaluate(arg, context)),
      )

      // Get pipe from registry
      const entry = await this.pipeRegistry.get(segment.pipeName)
      if (!entry) {
        throw new EvaluationError(
          `Unknown pipe: ${segment.pipeName}`,
          'pipe-expression',
          expr,
        )
      }

      // Execute pipe with current value and arguments
      current = await entry.value.execute(current, args)
    }

    return current
  }
}
