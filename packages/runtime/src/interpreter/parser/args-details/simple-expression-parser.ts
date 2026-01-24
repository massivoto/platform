import { F, SingleParser } from '@masala/parser'
import {
  BinaryExpressionNode,
  ExpressionNode,
  SimpleExpressionNode,
} from '../ast.js'
import { additiveParser } from './binary-operation/additive-parser.js'
import { comparativeParser } from './binary-operation/comparative-parser.js'
import { equalityParser } from './binary-operation/equality-parser.js'
import {
  logicalAndParser,
  logicalOrParser,
} from './binary-operation/logical-parser.js'
import { multiplicativeParser } from './binary-operation/multiplicative-parser.js'
import { ArgTokens } from './tokens/argument-tokens.js'
import { atomicParser } from './tokens/literals-parser.js'
import { createMemberExpressionParser } from './unary-parser/member-parser.js'
import { unaryParser } from './unary-parser/unary-parser.js'

export function createSimpleExpressionParser(
  tokens: ArgTokens,
  primary: SingleParser<ExpressionNode>,
): SingleParser<SimpleExpressionNode> {
  const member = createMemberExpressionParser(tokens, primary)
  const postfix = F.tryAll([member, primary])

  const unary = unaryParser(tokens, postfix)

  const multiplicative = multiplicativeParser(
    tokens,
    postfix.or(unary),
  ) as SingleParser<BinaryExpressionNode>

  const additive = additiveParser(tokens, multiplicative)
  const comparative = comparativeParser(tokens, additive)
  const equality = equalityParser(tokens, comparative)
  const logicalAnd = logicalAndParser(tokens, equality)
  const logicalOr = logicalOrParser(tokens, logicalAnd)

  const simpleExpression: SingleParser<ExpressionNode> = logicalOr

  return simpleExpression as SingleParser<SimpleExpressionNode>
}

export function createSimpleExpressionWithParenthesesParser(
  tokens: ArgTokens,
): SingleParser<SimpleExpressionNode> {
  const { LEFT, RIGHT } = tokens

  const parenthesisExpression = F.lazy(() =>
    LEFT.drop().then(simpleExpression).then(RIGHT.drop()),
  ).map((t) => t.single())
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens).or(
    parenthesisExpression,
  )

  const simpleExpression: SingleParser<SimpleExpressionNode> =
    createSimpleExpressionParser(tokens, primary)

  return simpleExpression
}

export function createExpressionWithoutParenthesesParser(
  tokens: ArgTokens,
): SingleParser<ExpressionNode> {
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens)
  const simpleExpression: SingleParser<SimpleExpressionNode> =
    createSimpleExpressionParser(tokens, primary)

  return simpleExpression
}
