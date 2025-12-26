import { describe, it, expect } from 'vitest'
import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { BinaryExpressionNode } from '../../ast.js'
import { buildMultiplicativeParser } from './multiplicative-parser.js'

let tracer: GenlexTracer
function buildMultiplicativeParserForTests(): SingleParser<BinaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const grammar = buildMultiplicativeParser(genlex).multiplicative
  return genlex.use(grammar)
}

describe('Multiplicative parser', () => {
  const multiplicativeGrammar = buildMultiplicativeParserForTests()

  it('should parse a multiplication expression', () => {
    const stream = Stream.ofChars('10 * 5')
    const parsing = multiplicativeGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '*',
      left: { type: 'literal-number', value: 10 },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a multiplication expression with unary and number', () => {
    const stream = Stream.ofChars('-10 * 5')
    const parsing = multiplicativeGrammar.parse(stream)

    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '*',
      left: {
        argument: {
          type: 'literal-number',
          value: 10,
        },
        operator: '-',
        type: 'unary',
      },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a multiplication expression with unary and member', () => {
    const stream = Stream.ofChars('-x.a * 5')
    const parsing = multiplicativeGrammar.parse(stream)

    //const logs = tracer.flushForAi()
    expect(parsing.isAccepted()).toBe(true)

    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '*',
      left: {
        argument: {
          type: 'member',
          computed: false,
          object: {
            type: 'identifier',
            value: 'x',
          },
          path: ['a'],
        },
        operator: '-',
        type: 'unary',
      },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })
})
