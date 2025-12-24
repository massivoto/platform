import { F, SingleParser } from '@masala/parser'
import { ExpressionNode, LiteralNumberNode } from '../../../ast.js'
import { chainLeft } from '../../../chain-left/chain-left.js'
import { ArgTokens } from '../../tokens/argument-tokens.js'

/**
 * Very minimal parser made for tests and validating concepts
 * @param tokens
 */
export function createSeriesOfNumberParser(
  tokens: ArgTokens,
): SingleParser<LiteralNumberNode> {
  const { NUMBER } = tokens

  const numbersParser = NUMBER.optrep().map((v) => ({
    type: 'literal-number' as const,
    value: Number(v.last().value),
  }))
  return numbersParser
}

/**
 * Not for real application, but step to understand concepts
 * No parenthesis nor atomic nor comparison nor logic
 * Just number, add and mult with correct precedence
 */
export function createBasicBinaryParser(
  tokens: ArgTokens,
): SingleParser<ExpressionNode> {
  const { NUMBER, MULTIPLY, DIV, PLUS, MINUS } = tokens

  const MULTIPLY_OPS = MULTIPLY.or(DIV).trace('MULTIPLY_OPS')
  const ADDITION_OPS = PLUS.or(MINUS).trace('ADDITION_OPS')

  const EXPRESSION: SingleParser<ExpressionNode> = F.lazy(() => ADDITION) // Expression is defined as the additive level

  const MULTIPLICATION = chainLeft(NUMBER, MULTIPLY_OPS, (op, left, right) => ({
    type: 'binary',
    operator: op as '*' | '/',
    left,
    right,
  })).trace('MULTIPLICATION')

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
