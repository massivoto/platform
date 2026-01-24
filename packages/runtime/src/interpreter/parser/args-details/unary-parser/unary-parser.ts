import {
  C,
  F,
  GenLex,
  leanToken,
  SingleParser,
  TokenParser,
} from '@masala/parser'
import { ExpressionNode, UnaryExpressionNode } from '../../ast.js'
import { UnaryTokens } from '../tokens/argument-tokens.js'

type UnaryCase = '!' | '+' | '-'

export function unaryParser(
  tokens: UnaryTokens,
  postfix: SingleParser<ExpressionNode>,
): SingleParser<UnaryExpressionNode> {
  const { NOT, PLUS, MINUS } = tokens

  let _UNARY_OP = F.tryAll([NOT, PLUS, MINUS]) as TokenParser<string>
  const UNARY_OP = _UNARY_OP.map(leanToken)
  // option: allow many unary ops followed by a primary: e.g. !!-x
  return UNARY_OP.then(postfix).map((tuple) => ({
    type: 'unary',
    operator: tuple.first() as UnaryCase, // '!' | '+' | '-'
    argument: tuple.last(),
  }))
}

/*
Pseudo code to allow multiple !!! or ---

const UNOP = NOT.or(MINUS) // returns '!' or '-'
const UNARY = UNOP.optrep().then(POSTFIX).map(t => {
  const [ops, node] = t.array() as [string[], ExpressionNode]
  return ops.slice().reverse().reduce<ExpressionNode>(
    (acc, op) => ({ type: 'unary', operator: op as '!'|'-', argument: acc }),
    node
  )
})
 */
