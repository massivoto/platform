import { F, SingleParser } from '@masala/parser'
import { BinaryExpressionNode, ExpressionNode } from '../../ast.js'
import { chainLeft, makeBinaryNode } from '../../chain-left/chain-left.js'
import { ArgTokens } from '../tokens/argument-tokens.js'

export function comparativeParser(
  tokens: ArgTokens,
  additive: SingleParser<ExpressionNode>,
): SingleParser<BinaryExpressionNode> {
  const { LT, LTE, GT, GTE } = tokens

  return chainLeft(
    additive,
    F.tryAll([LTE, LT, GTE, GT]),
    makeBinaryNode,
  ) as SingleParser<BinaryExpressionNode>
}
