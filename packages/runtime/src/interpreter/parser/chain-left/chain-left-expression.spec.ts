import {
  GenlexTracer,
  leanToken,
  N,
  SingleParser,
  Stream,
  TracingGenLex,
  F,
} from '@masala/parser'
import { ExpressionNode, LiteralNumberNode } from '../ast.js'
import { chainLeft } from './chain-left.js'
import { describe, it, expect } from 'vitest'

export function buildChainLeftAddMulParser(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()

  // Operators as keyword tokens, mapped to plain strings via leanToken
  const [ADD] = genlex.keywords(['+']).flatMap((t) => t.map(leanToken))
  const [SUB] = genlex.keywords(['-']).flatMap((t) => t.map(leanToken))
  const [MUL] = genlex.keywords(['*']).flatMap((t) => t.map(leanToken))
  const [DIV] = genlex.keywords(['/']).flatMap((t) => t.map(leanToken))

  const ADDITION_OPS = ADD.or(SUB) as SingleParser<'+' | '-'>
  const MULTIPLY_OPS = MUL.or(DIV) as SingleParser<'*' | '/'>

  // Numbers -> AST
  const NUMBER: SingleParser<LiteralNumberNode> = genlex
    .tokenize(N.number(), 'number', 2000) // keep your priority choice
    .map((tok) => ({ type: 'literal-number', value: tok.value }))

  // Forward ref so we can extend later (e.g., parentheses)
  const EXPR: SingleParser<ExpressionNode> = F.lazy(() => ADDITION)

  // For now, primary = NUMBER (no parens/unary yet)
  const PRIMARY = NUMBER as SingleParser<ExpressionNode>

  // multiplicative := PRIMARY (('*'|'/') PRIMARY)*
  const MULTIPLICATION = chainLeft(
    PRIMARY,
    MULTIPLY_OPS,
    (op, left, right) => ({
      type: 'binary',
      operator: op as '*' | '/',
      left,
      right,
    }),
  )

  // additive := multiplicative (('+'|'-') multiplicative)*
  const ADDITION = chainLeft(
    MULTIPLICATION,
    ADDITION_OPS,
    (op, left, right) => ({
      type: 'binary',
      operator: op as '+' | '-',
      left,
      right,
    }),
  )

  return genlex.use(EXPR)
}

describe('ChainLeft Add+Mul precedence', () => {
  it("parses '1+2*3-4*5+6' with * before + and left-assoc per level", () => {
    const parser = buildChainLeftAddMulParser()
    const res = parser.thenEos().parse(Stream.ofChars('1+2*3-4*5+6'))

    expect(res.isAccepted()).toBe(true)

    const value = res.value.first() as ExpressionNode
    expect(value).toEqual({
      type: 'binary',
      operator: '+',
      left: {
        type: 'binary',
        operator: '-',
        left: {
          type: 'binary',
          operator: '+',
          left: { type: 'literal-number', value: 1 },
          right: {
            type: 'binary',
            operator: '*',
            left: { type: 'literal-number', value: 2 },
            right: { type: 'literal-number', value: 3 },
          },
        },
        right: {
          type: 'binary',
          operator: '*',
          left: { type: 'literal-number', value: 4 },
          right: { type: 'literal-number', value: 5 },
        },
      },
      right: { type: 'literal-number', value: 6 },
    })
  })
})
