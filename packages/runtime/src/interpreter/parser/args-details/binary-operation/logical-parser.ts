import { SingleParser } from '@masala/parser'
import { BinaryExpressionNode, ExpressionNode } from '../../ast.js'
import { chainLeft, makeLogicalNode } from '../../chain-left/chain-left.js'
import { ArgTokens } from '../tokens/argument-tokens.js'

export function logicalAndParser(
  tokens: ArgTokens,
  equality: SingleParser<ExpressionNode>,
): SingleParser<BinaryExpressionNode> {
  const { AND } = tokens

  return chainLeft(
    equality,
    AND,
    makeLogicalNode,
  ) as SingleParser<BinaryExpressionNode>
}

export function logicalOrParser(
  tokens: ArgTokens,
  logicalAnd: SingleParser<ExpressionNode>,
): SingleParser<BinaryExpressionNode> {
  const { OR } = tokens

  return chainLeft(
    logicalAnd,
    OR,
    makeLogicalNode,
  ) as SingleParser<BinaryExpressionNode>
}
