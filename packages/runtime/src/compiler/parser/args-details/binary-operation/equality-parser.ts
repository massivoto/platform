import { F, SingleParser } from '@masala/parser'
import { BinaryExpressionNode, ExpressionNode } from '../../ast.js'
import { chainLeft, makeBinaryNode } from '../../chain-left/chain-left.js'
import { ArgTokens } from '../tokens/argument-tokens.js'

export function equalityParser(
  tokens: ArgTokens,
  comparative: SingleParser<ExpressionNode>,
): SingleParser<BinaryExpressionNode> {
  const { EQ, NEQ } = tokens

  return chainLeft(
    comparative,
    EQ.or(NEQ),
    makeBinaryNode,
  ) as SingleParser<BinaryExpressionNode>
}
