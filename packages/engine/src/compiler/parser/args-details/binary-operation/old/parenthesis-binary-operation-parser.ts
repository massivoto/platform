import { F, SingleParser } from '@masala/parser'
import { ExpressionNode } from '../../../ast.js'
import { chainLeft } from '../../../chain-left/chain-left.js'
import { ArgTokens } from '../../tokens/argument-tokens.js'

export function createParenthesisBinaryParser(
  tokens: ArgTokens,
): SingleParser<ExpressionNode> {
  const { NUMBER, MULTIPLY, DIV, PLUS, MINUS, LEFT, RIGHT } = tokens

  const MULTIPLY_OPS = MULTIPLY.or(DIV).trace('MULTIPLY_OPS')
  const ADDITION_OPS = PLUS.or(MINUS).trace('ADDITION_OPS')

  // Expression is the additive level (top)
  const EXPRESSION: SingleParser<ExpressionNode> = F.lazy(() => ADDITION)

  // '(' EXPRESSION ')'
  const PAREN_EXPR = LEFT.drop()
    .then(EXPRESSION)
    .then(RIGHT.drop())
    .map((t) => t.first())
    .trace('PAREN')

  // Primary := '(' expr ')' | number
  const PRIMARY = PAREN_EXPR.or(NUMBER).trace('PRIMARY')

  // Multiplicative := PRIMARY (('*'|'/') PRIMARY)*
  const MULTIPLICATION = chainLeft(
    PRIMARY,
    MULTIPLY_OPS,
    (op, left, right) => ({
      type: 'binary',
      operator: op as '*' | '/',
      left,
      right,
    }),
  ).trace('MULTIPLICATION')

  // Additive := MULTIPLICATION (('+'|'-') MULTIPLICATION)*
  const ADDITION = chainLeft(
    MULTIPLICATION,
    ADDITION_OPS,
    (op, left, right) => ({
      type: 'binary',
      operator: op as '+' | '-',
      left,
      right,
    }),
  ).trace('ADDITION')

  return EXPRESSION
}
