// Expression Evaluator
import { ExpressionNode } from '../parser/ast.js'
import { ExecutionContext } from '../../domain/execution-context.js'

export class ExpressionEvaluator {
  evaluate(expr: ExpressionNode, context: ExecutionContext): any {
    switch (expr.type) {
      case 'identifier':
        return context.data[expr.value]
      case 'literal-string':
      case 'literal-number':
      case 'literal-boolean':
        return expr.value

      default:
        throw new Error(`Unknown expression type: ${(expr as any).type}`)
    }
  }
}
