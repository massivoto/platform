import { F, SingleParser, Tuple } from '@masala/parser'
import {
  ExpressionNode,
  IdentifierNode,
  MapperExpressionNode,
  SingleStringNode,
} from '../ast.js'
import { ArgTokens } from './tokens/argument-tokens.js'

/**
 * Creates a mapper expression parser.
 *
 * Mapper expressions use the `->` operator for property extraction and iterator binding:
 * - `users -> name` extracts `name` property from each element
 * - `forEach=users -> user` binds `user` as loop variable
 *
 * The mapper has the LOWEST precedence in the expression hierarchy.
 * It wraps the base expression (which can be pipe, simple, or braced expression).
 *
 * Grammar: mapperExpression = baseExpression (-> singleString)?
 *
 * Chaining is NOT allowed: `a -> b -> c` is invalid.
 */
export function createMapperParser(
  tokens: ArgTokens,
  baseExpression: SingleParser<ExpressionNode>,
): SingleParser<ExpressionNode> {
  const { ARROW, IDENTIFIER } = tokens

  // SingleString uses the same syntax as identifier but produces a different node type.
  // We use IDENTIFIER token (genlex-compatible) and map to SingleStringNode.
  const singleString: SingleParser<SingleStringNode> = IDENTIFIER.map(
    (id: IdentifierNode): SingleStringNode => ({
      type: 'single-string',
      value: id.value,
    }),
  )

  // Parse: baseExpression ARROW singleString (produces MapperExpressionNode)
  const mapperExpression = baseExpression
    .then(ARROW.drop())
    .then(singleString)
    .map((tuple: Tuple<ExpressionNode | SingleStringNode>) => {
      const source = tuple.first() as ExpressionNode
      const target = tuple.last() as SingleStringNode
      return {
        type: 'mapper',
        source,
        target,
      } as MapperExpressionNode
    })

  // Try mapper first (has arrow), otherwise just the base expression
  return F.try(mapperExpression).or(baseExpression)
}
