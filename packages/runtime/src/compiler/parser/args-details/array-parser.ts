import { F, SingleParser } from '@masala/parser'
import { ArrayLiteralNode, ExpressionNode } from '../ast.js'
import { ArgTokens } from './tokens/argument-tokens.js'

/**
 * Creates a parser for array literals: [element, element, ...]
 *
 * Arrays are primary expressions (same precedence as literals and parenthesized expressions).
 * Elements can be any full expression (literals, identifiers, binary, logical, pipes, nested arrays).
 *
 * Grammar:
 *   arrayLiteral ::= '[' ']'
 *                  | '[' expression (',' expression)* ']'
 *
 * Note: Trailing commas are NOT allowed: [1, 2,] is invalid
 */
export function createArrayParser(
  tokens: ArgTokens,
  fullExpression: () => SingleParser<ExpressionNode>,
): SingleParser<ArrayLiteralNode> {
  const { LBRACKET, RBRACKET, COMMA } = tokens

  // Empty array: []
  const emptyArray = LBRACKET.drop()
    .then(RBRACKET.drop())
    .map(() => ({ type: 'array-literal' as const, elements: [] }))

  // Non-empty array: [expr, expr, ...]
  // Uses F.lazy to handle recursive fullExpression
  const nonEmptyArray = LBRACKET.drop()
    .then(
      F.lazy(fullExpression).then(
        COMMA.drop().then(F.lazy(fullExpression)).optrep(),
      ),
    )
    .then(RBRACKET.drop())
    .map((tuple) => {
      const elements = tuple.array() as ExpressionNode[]
      return { type: 'array-literal' as const, elements }
    })

  // Try empty first (more specific), then non-empty
  return F.try(emptyArray).or(nonEmptyArray)
}
