import { F, SingleParser } from '@masala/parser'
import { ExpressionNode, SimpleExpressionNode } from '../ast.js'
import { createArrayParser } from './array-parser.js'
import {
  createPipeParser,
  PipeExpressionNode,
} from './pipe-parser/pipe-parser.js'
import { createSimpleExpressionParser } from './simple-expression-parser.js'
import { ArgTokens } from './tokens/argument-tokens.js'
import { atomicParser } from './tokens/literals-parser.js'

export function createExpressionWithPipe(
  tokens: ArgTokens,
): SingleParser<ExpressionNode> {
  const { LEFT, RIGHT } = tokens

  const parenthesisExpression = F.lazy(() =>
    LEFT.drop().then(fullExpression).then(RIGHT.drop()),
  ).map((t) => t.single())

  // Array literals: [1, 2, 3] - uses fullExpression for elements
  const arrayLiteral = createArrayParser(tokens, () => fullExpression)

  const atomic: SingleParser<ExpressionNode> = atomicParser(tokens)
  const primary = F.try(arrayLiteral)
    .or(F.try(parenthesisExpression))
    .or(atomic)

  const simpleExpression: SingleParser<SimpleExpressionNode> =
    createSimpleExpressionParser(tokens, primary)

  const pipeExpression: SingleParser<PipeExpressionNode> = createPipeParser(
    tokens,
    simpleExpression,
  )

  const fullExpression: SingleParser<ExpressionNode> =
    pipeExpression.or(simpleExpression)

  return fullExpression
}
