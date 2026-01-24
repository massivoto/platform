import { describe, it, expect } from 'vitest'
import { GenlexTracer, Stream, TracingGenLex } from '@masala/parser'
import { ExpressionNode } from '../../../ast.js'
import { createArgumentTokens } from '../../tokens/argument-tokens.js'
import { createFullExpressionParser } from './parser-without-pipe.js'

let tracer: GenlexTracer
function buildParserWithoutPipeForTest() {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createFullExpressionParser(tokens)
  return genlex.use(grammar)
}

describe('full expression parser', () => {
  it("parses '7*4 < 5 == !true' with precedence and unary !", () => {
    const parser = buildParserWithoutPipeForTest()

    const res = parser.thenEos().parse(Stream.ofChars('7*4 < 5 == !true'))
    expect(res.isAccepted()).toBe(true)

    const value = res.value.first() as ExpressionNode
    expect(value).toEqual({
      type: 'binary',
      operator: '==',
      left: {
        type: 'binary',
        operator: '<',
        left: {
          type: 'binary',
          operator: '*',
          left: { type: 'literal-number', value: 7 },
          right: { type: 'literal-number', value: 4 },
        },
        right: { type: 'literal-number', value: 5 },
      },
      right: {
        type: 'unary',
        operator: '!',
        argument: { type: 'literal-boolean', value: true },
      },
    })
  })
})
