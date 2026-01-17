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
  const { LEFT, RIGHT, OPEN, CLOSE } = tokens

  const parenthesisExpression = F.lazy(() =>
    LEFT.drop().then(fullExpression).then(RIGHT.drop()),
  ).map((t) => t.single())

  // Braced expressions: {expr} - for complex expressions in arguments like if={x > 10}
  // Must be lazy to avoid infinite recursion with fullExpression
  const bracedExpression = F.lazy(() =>
    OPEN.drop().then(fullExpression).then(CLOSE.drop()),
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

  // Order matters: try pipe expression first (requires |> segments),
  // then braced expression (simple expr in braces), then bare simple expression
  const fullExpression: SingleParser<ExpressionNode> = F.try(pipeExpression)
    .or(F.try(bracedExpression))
    .or(simpleExpression)

  return fullExpression
}
