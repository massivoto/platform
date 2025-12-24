import { SingleParser } from '@masala/parser'
import { BinaryExpressionNode, ExpressionNode } from '../../ast.js'
import { chainLeft, makeBinaryNode } from '../../chain-left/chain-left.js'
import { ArgTokens } from '../tokens/argument-tokens.js'

export function additiveParser(
  tokens: ArgTokens,
  multiplicative: SingleParser<ExpressionNode>,
): SingleParser<BinaryExpressionNode> {
  const { PLUS, MINUS } = tokens

  return chainLeft(
    multiplicative,
    PLUS.or(MINUS),
    makeBinaryNode,
  ) as SingleParser<BinaryExpressionNode>
}
