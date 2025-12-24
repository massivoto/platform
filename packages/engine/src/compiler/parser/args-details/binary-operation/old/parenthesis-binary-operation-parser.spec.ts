import { describe, it, expect } from 'vitest'
import { GenlexTracer, Stream, TracingGenLex } from '@masala/parser'
import { ExpressionNode } from '../../../ast.js'
import { createArgumentTokens } from '../../tokens/argument-tokens.js'
import { createParenthesisBinaryParser } from './parenthesis-binary-operation-parser.js'

let tracer: GenlexTracer
function buildParenthesisParserForTest() {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createParenthesisBinaryParser(tokens)
  return genlex.use(grammar)
}

describe('basicBinaryParser with parentheses', () => {
  it("parses expression  '1*(2+3)-4'", () => {
    const parser = buildParenthesisParserForTest() // must include LPAREN/RPAREN tokens
    const res = parser.thenEos().parse(Stream.ofChars('1*(2+3)-4'))

    expect(res.isAccepted()).toBe(true)
    const value = res.value.first() as ExpressionNode
    const expected = expectedResult()

    expect(value).toEqual(expected)
  })

  it("parses with spaces ' 1 * ( 2 + 3 ) - 4 '", () => {
    const parser = buildParenthesisParserForTest() // must include LPAREN/RPAREN tokens
    const res = parser.thenEos().parse(Stream.ofChars(' 1 * ( 2 + 3 ) - 4 '))

    expect(res.isAccepted()).toBe(true)
    const value = res.value.first() as ExpressionNode
    const expected = expectedResult()
  })
})

function expectedResult(): ExpressionNode {
  return {
    type: 'binary',
    operator: '-',
    left: {
      type: 'binary',
      operator: '*',
      left: { type: 'literal-number', value: 1 },
      right: {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 2 },
        right: { type: 'literal-number', value: 3 },
      },
    },
    right: { type: 'literal-number', value: 4 },
  }
}
